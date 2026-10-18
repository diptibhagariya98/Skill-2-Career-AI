# Production-Ready Authentication & Authorization with Branded Email

Oct 18, 2026 · @manish

## 1. Overview, scope and stack

This spec defines one auth system you can build once and reuse across every project: email and password sign-up with OTP email verification, short-lived JWTs with rotating refresh tokens, role-based authorization, and branded, mobile-responsive emails sent through Nodemailer.

**Stack assumed** (swap any row and the design still holds)

| Layer | Choice | Why |
| --- | --- | --- |
| Client | Next.js with Tailwind CSS | Existing frontend stack |
| API | NestJS with Passport and `@nestjs/jwt` | Guards and decorators fit auth cleanly |
| Database | PostgreSQL with Drizzle ORM | Existing backend stack |
| Cache and queue | Redis with BullMQ | Rate limits, OTP throttles, email jobs with retries |
| Email transport | Nodemailer over SMTP to a managed provider | Provider can change without code changes |
| Email templates | React Email, rendered to HTML on the server | Responsive components, one theme file shared with the web app |
| Password hashing | Argon2id | Current OWASP-recommended default |

**In scope**

- Sign-up with email, password and an OTP sent by email before the account becomes active.
- Login, logout, logout from all devices, token refresh with rotation.
- Forgot password and reset password through an emailed OTP or link, and change password.
- Roles and permissions, with optional tenant scoping for multi-tenant projects.
- Branded transactional emails: verification, welcome, password reset, password changed, new device login.
- Rate limiting, account lockout, audit log, and the production checklist.

**Out of scope for the first release (extension points are kept)**

- Social login, magic links, SSO and two-factor authentication. The `auth_identities` table and the session model leave room for them.

**Decisions this spec makes**

| Decision | Choice |
| --- | --- |
| Account active only after email verification | Yes, login is refused until the OTP is confirmed |
| Access token | JWT, 15 minutes, signed with an asymmetric key |
| Refresh token | Opaque random value, stored hashed, rotated on every use |
| Where tokens live in the browser | Refresh token in an `HttpOnly` cookie; access token in memory |
| Email sending | Always through a queue, never inside the request |
| Brand theme in emails | Read from one shared theme file, so the app and the emails never drift |

## 2. Architecture at a glance

The API never sends email itself: it stores state in PostgreSQL, keeps counters and the queue in Redis, and hands every email to a worker that sends it through the provider.

&#91;embedded content: auth architecture · 6 components\]

The web app talks only to the auth module; PostgreSQL holds the durable records, while Redis holds data that can expire or be rebuilt.

## 3. Core flows

Sign-up creates a pending account, the emailed OTP activates it, and from then on login and refresh keep a rotating session alive until logout, expiry or a security event.

&#91;embedded content: account lifecycle · 7 states\]

The Active session state is the only one that holds usable tokens. A login before verification returns to the OTP step, a reused refresh token forces a new login, and a password reset revokes every session before the user signs in again.

## 4. Data model

Nine tables carry the whole system; secrets (passwords, OTPs, refresh tokens) are only ever stored as hashes.

| Table | Key columns | Purpose |
| --- | --- | --- |
| `users` | `email` (unique, lowercased), `emailVerifiedAt`, `passwordHash`, `status`, `failedLoginCount`, `lockedUntil`, `lastLoginAt`, `deletedAt` | Account and its state |
| `otp_codes` | `userId`, `purpose`, `codeHash`, `expiresAt`, `attempts`, `maxAttempts`, `consumedAt` | Email verification and password reset codes |
| `sessions` | `userId`, `familyId`, `refreshTokenHash`, `userAgent`, `ip`, `expiresAt`, `revokedAt`, `replacedBySessionId` | One row per device login; enables revoke and reuse detection |
| `roles`, `permissions`, `role_permissions` | `name`, `key` (for example `orders.read`) | Role-based access control |
| `user_roles` | `userId`, `roleId`, `tenantId` (nullable) | Role per user, optionally per tenant |
| `auth_audit_logs` | `userId`, `event`, `ip`, `userAgent`, `metadata`, `createdAt` | Security trail |
| `email_logs` | `toEmail`, `template`, `status`, `providerMessageId`, `error`, `sentAt` | Delivery tracking and support lookups |

A later `auth_identities` table (`provider`, `providerUserId`, `userId`) adds social login without touching `users`.

**User status values:** `PENDING_VERIFICATION`, `ACTIVE`, `LOCKED`, `DISABLED`. Only `ACTIVE` users can log in.

**Drizzle schema for the three core tables**

```ts
import { sql } from 'drizzle-orm';
import { pgTable, pgEnum, uuid, varchar, text, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const userStatus = pgEnum('user_status', ['PENDING_VERIFICATION', 'ACTIVE', 'LOCKED', 'DISABLED']);
export const otpPurpose = pgEnum('otp_purpose', ['EMAIL_VERIFY', 'PASSWORD_RESET']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 320 }).notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  passwordHash: text('password_hash').notNull(),
  status: userStatus('status').notNull().default('PENDING_VERIFICATION'),
  failedLoginCount: integer('failed_login_count').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  emailUq: uniqueIndex('users_email_lower_uq').on(sql`lower(${t.email})`),
}));

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  purpose: otpPurpose('purpose').notNull(),
  codeHash: text('code_hash').notNull(),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(5),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  lookupIdx: index('otp_user_purpose_idx').on(t.userId, t.purpose, t.createdAt),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  familyId: uuid('family_id').notNull(),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  userAgent: text('user_agent'),
  ip: varchar('ip', { length: 64 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  replacedBySessionId: uuid('replaced_by_session_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  hashUq: uniqueIndex('sessions_refresh_hash_uq').on(t.refreshTokenHash),
  userIdx: index('sessions_user_idx').on(t.userId),
}));
```

**Rules**

- Normalize email (trim, lowercase) before every read and write; the unique index is on `lower(email)`.
- Delete expired and consumed OTP rows and expired sessions with a nightly job.
- Soft-delete users (`deletedAt`); the unique email index still blocks reuse until a purge policy says otherwise.

## 5. Password and OTP rules

Passwords are hashed with Argon2id and OTPs are short-lived, single-use and attempt-limited, so a leaked database or a guessing attack gives an attacker very little.

**Passwords**

| Rule | Value |
| --- | --- |
| Hash | Argon2id, `memoryCost` 19456 KiB, `timeCost` 2, `parallelism` 1 as the floor; tune upward until a hash takes a few hundred milliseconds on production hardware |
| Length | 10 to 128 characters; no forced symbol or case rules |
| Strength check | Reject common and breached passwords (HIBP range API with k-anonymity, or a local list) and weak `zxcvbn` scores |
| Rehash | On successful login, rehash if the stored parameters are outdated |
| Unknown email on login | Run a dummy hash verify so response time does not reveal whether the account exists |
| Error message | Always `Invalid email or password`, never which part was wrong |

```ts
import * as argon2 from 'argon2';

const opts = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const hashPassword = (pw: string) => argon2.hash(pw, opts);
export const verifyPassword = (hash: string, pw: string) => argon2.verify(hash, pw);
export const needsRehash = (hash: string) => argon2.needsRehash(hash, opts);
```

**OTP codes** (email verification and password reset)

| Rule | Value |
| --- | --- |
| Format | 6 digits from `crypto.randomInt`, never `Math.random` |
| Storage | HMAC-SHA256 of user, purpose and code using a server secret; a plain hash of 6 digits can be brute-forced offline |
| Expiry | 10 minutes |
| Attempts | 5 wrong tries invalidate the code; the user must request a new one |
| Single use | Consumed inside the same transaction that activates the account or resets the password |
| Resend | 60-second cooldown; at most 5 sends per hour per email and per IP |
| New code | Issuing a new OTP invalidates every older unused OTP for that user and purpose |
| Failure message | `Invalid or expired code`, the same for wrong, expired and used codes |

```ts
import { randomInt, createHmac, timingSafeEqual } from 'crypto';

export const generateOtp = () => randomInt(0, 1_000_000).toString().padStart(6, '0');

export const hashOtp = (code: string, userId: string, purpose: string, secret: string) =>
  createHmac('sha256', secret).update(`${userId}:${purpose}:${code}`).digest('hex');

export function otpMatches(storedHex: string, code: string, userId: string, purpose: string, secret: string) {
  const a = Buffer.from(hashOtp(code, userId, purpose, secret), 'hex');
  const b = Buffer.from(storedHex, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
```

**After verification:** the user becomes `ACTIVE`, `emailVerifiedAt` is set, and the user is logged in immediately so onboarding continues without a second login.

**After a password reset or change:** every session of that user is revoked and a "password changed" email is sent.

## 6. JWT and session design

A 15-minute JWT proves who the caller is, and a rotating refresh token tied to a database session lets you revoke any device instantly and detect stolen tokens.

|  | Access token | Refresh token |
| --- | --- | --- |
| Format | Signed JWT | Opaque random value, 32 bytes from `crypto.randomBytes`, base64url |
| Lifetime | 15 minutes | 30 days sliding, 90 days absolute cap (proposed) |
| Stored server-side | No | Yes, as a SHA-256 hash in `sessions` |
| Stored in the browser | JavaScript memory only | `HttpOnly` cookie |
| Used for | Every API call, in `Authorization: Bearer` | Only `POST /auth/refresh` |

**Access token claims** (kept small; permissions are not stored in the token)

| Claim | Meaning |
| --- | --- |
| `sub` | User id |
| `sid` | Session id, used to revoke and to show active devices |
| `roles` | Role names, for quick checks |
| `tid` | Tenant id, only for multi-tenant projects |
| `iss`, `aud`, `iat`, `exp` | Issuer, audience and timing, all validated on every request |

**Signing.** Use an asymmetric algorithm (`ES256`, or `RS256` if a consumer needs it) so other services verify with a public key and never hold the signing key. Pin the allowed algorithm in verification, publish public keys at `/.well-known/jwks.json`, and put a `kid` in the header so keys rotate without logging everyone out.

```ts
JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) => ({
    privateKey: cfg.getOrThrow('JWT_PRIVATE_KEY'),
    publicKey: cfg.getOrThrow('JWT_PUBLIC_KEY'),
    signOptions: {
      algorithm: 'ES256',
      expiresIn: '15m',
      issuer: cfg.getOrThrow('JWT_ISSUER'),
      audience: cfg.getOrThrow('JWT_AUDIENCE'),
      keyid: cfg.getOrThrow('JWT_KEY_ID'),
    },
    verifyOptions: {
      algorithms: ['ES256'],
      issuer: cfg.getOrThrow('JWT_ISSUER'),
      audience: cfg.getOrThrow('JWT_AUDIENCE'),
    },
  }),
});
```

**Refresh rotation and reuse detection.** Every refresh marks the presented token as used and issues a new one in the same `familyId`. If a token that was already rotated is presented again, someone has a copy: revoke the whole family, force a new login and write a `TOKEN_REUSE_DETECTED` audit event. The family revoke must commit before the request fails, so it is returned as a result and thrown after the transaction, otherwise the rollback would undo it.

```ts
async refresh(rawToken: string) {
  const outcome = await this.db.transaction(async (tx) => {
    const [s] = await tx.select().from(sessions)
      .where(eq(sessions.refreshTokenHash, sha256(rawToken))).for('update');
    if (!s || s.expiresAt < new Date()) return { ok: false } as const;
    if (s.revokedAt) {
      await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.familyId, s.familyId));
      return { ok: false, reuse: true, userId: s.userId } as const;
    }
    const next = await this.issueSession(tx, s.userId, s.familyId);
    await tx.update(sessions)
      .set({ revokedAt: new Date(), replacedBySessionId: next.id })
      .where(eq(sessions.id, s.id));
    return { ok: true, session: next } as const;
  });
  if (!outcome.ok) {
    if ('reuse' in outcome) await this.audit('TOKEN_REUSE_DETECTED', outcome.userId);
    throw new UnauthorizedException();
  }
  return this.buildTokens(outcome.session);
}
```

**Concurrent tabs.** Two tabs refreshing at once would trip reuse detection. The client refreshes through a single shared call (single-flight), and the server accepts a just-rotated token for a 10-second grace window (proposed).

**Refresh cookie attributes**

| Attribute | Value |
| --- | --- |
| `HttpOnly` | On, so scripts cannot read it |
| `Secure` | On in every environment except local development |
| `SameSite` | `Lax`, or `None` only if the API is on a different site |
| `Path` | `/auth`, so it is sent only to auth routes (the proxy path if the web app proxies, Q4) |
| `Max-Age` | Matches the session lifetime |

**Logout.** Logout revokes the current session row and clears the cookie. Logout-all revokes every session of the user. To make logout instant instead of waiting up to 15 minutes, the guard also checks a Redis list of revoked `sid` values, each kept for 15 minutes.

**Mobile and non-browser clients.** They send `X-Client: mobile` and receive the refresh token in the response body, to store in the platform's secure storage.

## 7. Authorization

Every route is private by default; a route becomes open only when it is marked `@Public()`, and access is then decided by roles and permissions, with an ownership check in the service for the final say.

**Request pipeline in NestJS**

1. `JwtAuthGuard` (global): verifies the token, or lets `@Public()` routes through.
2. `PermissionsGuard` (global): compares the route's required permissions with what the user's roles grant.
3. Controller handler.
4. Service-level check: does this record belong to this user or tenant?

Guards answer "may this role use this feature"; only the service can answer "may this person touch this record", so both are needed.

**Decorators**

| Decorator | Use |
| --- | --- |
| `@Public()` | Opt a route out of authentication (login, sign-up, verify, health) |
| `@RequirePermissions('orders.read')` | Needs every listed permission |
| `@Roles('ADMIN')` | Coarse role gate for admin-only areas |
| `@CurrentUser()` | Injects `{ sub, sid, roles, tid }` from the verified token |

```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }
  canActivate(ctx: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    return isPublic ? true : super.canActivate(ctx);
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private perms: PermissionService) {}
  async canActivate(ctx: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!required?.length) return true;
    const { user } = ctx.switchToHttp().getRequest();
    const granted = await this.perms.forUser(user.sub, user.tid);
    return required.every((p) => granted.has(p));
  }
}
```

Register both as `APP_GUARD` providers in that order. The JWT strategy's `validate()` also rejects a `sid` found in the Redis revoked list.

**Roles and permissions**

- Permissions are strings in `resource.action` form, for example `orders.read`, `products.write`, `users.manage`.
- Roles are bundles of permissions stored in the database, so an admin can change them without a deploy.
- A starter set: `SUPER_ADMIN` (platform), `ADMIN`, `STAFF`, `USER`. Rename these per project.
- Permission lookups are cached in Redis for 5 minutes per role set and cleared whenever a role changes.
- A disabled or locked account has all its sessions revoked, so the per-request check needs no database read.

**Tenant scoping (multi-tenant projects)**

- The token carries `tid`; every query on tenant data filters by it, enforced in a shared repository base class, never left to each developer.
- A user who belongs to several tenants switches with `POST /auth/switch-tenant`, which checks membership and returns a new access token.
- Cross-tenant access by a platform `SUPER_ADMIN` is explicit, logged, and never implied by the role name alone.

**Declare a permission on every route.** A route with no decorator is authenticated but not permission-checked, so code review and an automated test must confirm that every non-public controller method declares a permission.

## 8. API endpoints

The auth module exposes 15 routes, 14 of them under `/auth`, and every response that could reveal whether an email is registered looks the same whether it is or not.

| Verb | Route | Access | What it does |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | Public | Creates a `PENDING_VERIFICATION` user and emails an OTP |
| `POST` | `/auth/verify-email` | Public | Confirms the OTP, activates the user, returns tokens |
| `POST` | `/auth/resend-otp` | Public | Sends a new OTP, subject to cooldown and hourly limit |
| `POST` | `/auth/login` | Public | Checks email and password, returns tokens |
| `POST` | `/auth/refresh` | Refresh cookie | Rotates the refresh token, returns a new access token |
| `POST` | `/auth/logout` | Refresh cookie | Revokes the current session |
| `POST` | `/auth/logout-all` | Bearer | Revokes every session of the user |
| `POST` | `/auth/forgot-password` | Public | Emails a reset OTP; always answers the same |
| `POST` | `/auth/reset-password` | Public | Verifies the OTP, sets a new password, revokes all sessions |
| `POST` | `/auth/change-password` | Bearer | Needs the current password; revokes other sessions |
| `GET` | `/auth/me` | Bearer | Profile, roles and permissions |
| `GET` | `/auth/sessions` | Bearer | Active devices with last-used time and location hint |
| `DELETE` | `/auth/sessions/:id` | Bearer | Revokes one device |
| `POST` | `/auth/switch-tenant` | Bearer | Re-issues the access token for another tenant |
| `GET` | `/.well-known/jwks.json` | Public | Public signing keys |

**Sign-up and verification behaviour**

- `signup` for a new email: create the user, send the OTP, answer `202` with a neutral message.
- `signup` for an email that already has a verified account: answer the same `202`, send that person a "someone tried to register" email, and create nothing.
- `signup` for an email still pending: send a fresh OTP, within the resend limits.
- `login` before verification: when the password is correct, answer `403 EMAIL_NOT_VERIFIED` and send a new OTP so the client can show the code screen.
- `verify-email` success returns the same payload as `login`, so onboarding continues without another login.

**Success payload for `login` and `verify-email`**

```json
{
  "accessToken": "eyJ...",
  "expiresIn": 900,
  "user": { "id": "...", "email": "a@b.com", "roles": ["USER"], "emailVerified": true }
}
```

The refresh token is set as an `HttpOnly` cookie, never in the JSON, except for mobile clients.

**Error format and codes**

```json
{ "error": { "code": "INVALID_OR_EXPIRED_CODE", "message": "Invalid or expired code", "details": null } }
```

| Code | HTTP | When |
| --- | --- | --- |
| `VALIDATION_ERROR` | 422 | Malformed email or missing field; `details` lists fields |
| `WEAK_PASSWORD` | 422 | Fails the password policy; `details` lists reasons |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `EMAIL_NOT_VERIFIED` | 403 | Correct password, account not yet verified |
| `INVALID_OR_EXPIRED_CODE` | 400 | Wrong, expired, used or exhausted OTP |
| `TOO_MANY_ATTEMPTS` | 429 | Rate limit or lockout; sends `Retry-After` |
| `UNAUTHORIZED` | 401 | Missing, expired or revoked access token; the client refreshes once |
| `FORBIDDEN` | 403 | Authenticated but lacks the permission |

## 9. Email delivery

Nodemailer is only the sending library; reliable delivery comes from a managed SMTP provider, a retrying queue, and correct DNS authentication on your own sending domain.

**Choose a provider.** Nodemailer talks SMTP, so the provider is a configuration choice and can change later without code changes. Check current pricing and sending limits before committing.

| Provider | Good fit when | Watch for |
| --- | --- | --- |
| Amazon SES | You already run on AWS and want low cost at volume | New accounts start in a sandbox and need production access approved |
| Postmark | Auth and receipt emails matter most and you want strong deliverability focus | Built for transactional mail only, so marketing goes elsewhere |
| SendGrid | You want one vendor for transactional and marketing | Use a dedicated IP or verified domain so your reputation is your own |
| Mailgun | You want a developer-friendly API alongside SMTP | Same domain-verification and warm-up work as the others |

Do not use a personal Gmail or free SMTP account in production; sending limits, security prompts and spam placement will cause missed OTP emails.

**Sending pipeline.** The request that creates an OTP only adds a job; a worker renders and sends the email.

1. `EmailService.enqueue(template, to, data)` adds a BullMQ job with a deterministic `jobId`, so a retried request never sends two copies.
2. The worker renders the HTML and plain-text versions from the template.
3. Nodemailer sends through a pooled SMTP connection.
4. The result and the provider message id are written to `email_logs`.
5. Failures retry with exponential backoff; after the last attempt the job stays in a failed list and raises an alert.

```ts
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true', // true for port 465
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

// at startup: fail fast on bad credentials
await transporter.verify();
```

```ts
// enqueue
await this.queue.add('send', { template: 'verify-email', to, data }, {
  jobId: `verify-email:${userId}:${otpId}`,
  attempts: 5,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 1000,
  removeOnFail: false,
});

// worker
@Processor('email')
export class EmailProcessor extends WorkerHost {
  async process(job: Job<EmailJob>) {
    const { template, to, data } = job.data;
    const { subject, html, text } = await this.templates.render(template, data);
    const info = await this.transporter.sendMail({
      from: `"${BRAND.name}" <${process.env.MAIL_FROM}>`,
      to, subject, html, text,
    });
    await this.logs.markSent(String(job.id), info.messageId);
  }
}
```

**Deliverability setup (done once per sending domain)**

| Item | Setup |
| --- | --- |
| Sending domain | Use a subdomain such as `mail.yourbrand.com` so mail reputation stays separate from the main domain |
| SPF | Publish the provider's SPF include on the sending domain |
| DKIM | Publish the provider's DKIM keys; confirm the provider shows the domain as verified |
| DMARC | Start with `p=none` and reports to a mailbox you read, then move to `quarantine`, then `reject` |
| From and Reply-To | From `no-reply` on the sending subdomain; Reply-To a monitored support address |
| Tracking | Turn off open and click tracking on auth emails, so links stay direct and codes are not rewritten |
| Plain text | Every email ships an HTML and a plain-text part |

**Bounces and complaints.** The provider calls a webhook for hard bounces and spam complaints. The handler updates `email_logs` and adds the address to a suppression list; sends to suppressed addresses are skipped and logged.

**Environments**

| Environment | Mail goes to |
| --- | --- |
| Local | Mailpit (local SMTP catcher with a web inbox) |
| Staging | The provider's sandbox or a catch-all inbox, never real users |
| Production | The verified provider account |

## 10. Email templates: responsive and on brand

Every email is built from React Email components on top of one shared brand theme file, so a colour or logo change in that file updates the web app and all emails together.

**Why React Email.** It renders TypeScript components into table-based, inline-styled HTML that works in Gmail, Apple Mail and Outlook, and gives a plain-text version from the same component. MJML is a good alternative if non-developers will edit templates; this spec uses React Email because it shares code and types with the NestJS and Next.js projects.

**One brand theme file.** Email clients ignore CSS variables and modern colour formats, so the theme stores plain hex values and font stacks. Tailwind in the web app imports the same file.

```ts
// packages/brand/brand.theme.ts: single source of truth for web and email.
// Values below are placeholders; replace them with the real brand values.
export const BRAND = {
  name: 'YourBrand',
  url: 'https://yourbrand.com',
  supportEmail: 'support@yourbrand.com',
  address: 'Legal company name, street, city, country',
  logo: { src: 'https://cdn.yourbrand.com/email/logo.png', width: 140, alt: 'YourBrand' },
  colors: {
    primary: '#4F46E5',
    primaryText: '#FFFFFF',
    background: '#F4F5F7',
    surface: '#FFFFFF',
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
    danger: '#DC2626',
  },
  fontFamily: "'Inter', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  radius: 8,
} as const;
```

**Responsive and compatibility rules** (apply to every template)

| Rule | Detail |
| --- | --- |
| Single column | One 600px column that shrinks to 100% width on small screens; no side-by-side layout on phones |
| Table-based layout | No flexbox or grid; Outlook desktop does not support them |
| Readable type | Body at least 16px, small print at least 12px, line height about 1.5 |
| Tap targets | Buttons at least 44px high with padding inside the link, so the whole button is tappable |
| Images | Absolute `https` URLs on a CDN, `width` attribute set, `max-width: 100%`, always `alt` text; logo as PNG, not SVG |
| Fonts | Brand font first, then a system fallback stack; custom web fonts are not reliable in email |
| OTP code | Real text in large monospaced type, never an image, so it can be selected and copied |
| Preheader | A short hidden preview line so the inbox shows useful text |
| Dark mode | Declare `color-scheme`; choose colours and a logo that stay readable if a client inverts them |
| Accessibility | `lang` on the root, contrast of 4.5:1 or better, links that look like links, `role="presentation"` on layout tables |

**Shared layout and the verification email**

```tsx
import { Html, Head, Preview, Body, Container, Section, Img, Heading, Text, Link } from '@react-email/components';
import { BRAND } from '@brand/theme';

export function EmailLayout({ preview, children }: { preview: string; children: React.ReactNode }) {
  const c = BRAND.colors;
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: '24px 12px', backgroundColor: c.background, fontFamily: BRAND.fontFamily, color: c.text }}>
        <Container style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
          <Section style={{ padding: '8px 0 24px' }}>
            <Img src={BRAND.logo.src} width={BRAND.logo.width} alt={BRAND.logo.alt} />
          </Section>
          <Section style={{ backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: BRAND.radius, padding: '32px 24px' }}>
            {children}
          </Section>
          <Section style={{ padding: '24px 8px', color: c.muted, fontSize: 12, lineHeight: '18px' }}>
            <Text style={{ margin: 0 }}>{BRAND.name} · {BRAND.address}</Text>
            <Text style={{ margin: '8px 0 0' }}>
              Need help? <Link href={`mailto:${BRAND.supportEmail}`} style={{ color: c.muted }}>{BRAND.supportEmail}</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default function VerifyEmail({ name, code, expiresInMinutes = 10 }: { name?: string; code: string; expiresInMinutes?: number }) {
  const c = BRAND.colors;
  return (
    <EmailLayout preview={`Your ${BRAND.name} verification code`}>
      <Heading style={{ margin: '0 0 12px', fontSize: 22, lineHeight: '28px' }}>Verify your email</Heading>
      <Text style={{ margin: '0 0 24px', fontSize: 16, lineHeight: '24px' }}>
        Hi {name ?? 'there'}, enter this code to finish creating your {BRAND.name} account.
      </Text>
      <Section style={{ backgroundColor: c.background, borderRadius: BRAND.radius, padding: 16, textAlign: 'center' }}>
        <Text style={{ margin: 0, fontSize: 32, lineHeight: '40px', fontWeight: 700, letterSpacing: 8, fontFamily: "Menlo, Consolas, 'Courier New', monospace" }}>{code}</Text>
      </Section>
      <Text style={{ margin: '24px 0 0', fontSize: 14, lineHeight: '20px', color: c.muted }}>
        This code expires in {expiresInMinutes} minutes. If you did not request it, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}
```

```ts
import { render } from '@react-email/render';

const html = await render(<VerifyEmail name={name} code={code} />);
const text = await render(<VerifyEmail name={name} code={code} />, { plainText: true });
```

**Template list**

| Template | Sent when | Content |
| --- | --- | --- |
| `verify-email` | Sign-up, resend, login before verification | OTP, expiry, ignore-if-not-you note |
| `welcome` | After the OTP is verified | Short greeting and one button to the app |
| `reset-password` | Forgot password | OTP, expiry, security note |
| `password-changed` | Reset or change succeeds | Time and device, button to secure the account |
| `new-device-login` | Login from an unseen device | Device, approximate location, time, link to review sessions |
| `signup-existing-account` | Sign-up with an email that already has an account | "Someone tried to register", buttons to log in or reset |
| `security-alert` | Refresh token reuse detected | "We signed you out everywhere" and a reset button |

**Subject lines.** Keep the code out of the subject, because lock screens and notifications show it: `Verify your email for YourBrand`, `Reset your YourBrand password`.

**Testing emails**

- Preview each template locally with the React Email dev server and Mailpit.
- Check width 320, 375 and 414 pixels, and a desktop width.
- Check Gmail (web and app), Apple Mail, Outlook desktop, Outlook.com and Yahoo, in light and dark mode, using a rendering service or real accounts.
- Check spam score and authentication results of a real send before launch.

## 11. Security hardening

Rate limits, lockout, strict input handling and a clean audit trail stop the common attacks on an auth system: password guessing, OTP brute force, email bombing and token theft.

**Rate limits.** Use `@nestjs/throttler` with Redis storage so limits hold across several API instances. Values are proposed starting points.

| Route | Limit | Counted by |
| --- | --- | --- |
| `POST /auth/login` | 5 attempts per 15 minutes; 20 per 15 minutes | Email plus IP; IP alone |
| `POST /auth/signup` | 5 per hour | IP |
| `POST /auth/resend-otp` | 60-second cooldown; 5 per hour; 10 per hour | Email; email; IP |
| `POST /auth/verify-email` | 5 wrong codes per OTP; 10 per 15 minutes | OTP; IP |
| `POST /auth/forgot-password` | 5 per hour; 10 per hour | Email; IP |
| `POST /auth/refresh` | 30 per minute | IP |

Set Express or Fastify `trust proxy` to match your load balancer, otherwise every request looks like it comes from the proxy and the IP limits break.

**Account lockout.** After 10 failed logins in a row, set `lockedUntil` 15 minutes ahead, then longer on repeat. A successful password reset clears it. Because lockout can be used to annoy a real user, it is paired with per-IP limits and sends the owner one "unusual login attempts" email, not one per attempt.

**Bot protection.** Add Cloudflare Turnstile or hCaptcha to sign-up and forgot-password, shown only after a limit is approached, so normal users rarely see it.

**Request hardening**

| Area | Rule |
| --- | --- |
| Headers | `helmet` defaults plus HSTS; HTTPS only |
| CORS | Exact allow-list of origins, `credentials: true`, no wildcard |
| CSRF | The refresh cookie is `SameSite=Lax` and scoped to `/auth`; `refresh` and `logout` also require a custom header and a matching `Origin`; bearer-token routes are not affected |
| Validation | DTOs with `class-validator`, `whitelist` and `forbidNonWhitelisted` on, request body size capped |
| Email input | Trim, lowercase, validate format, cap length at 320 characters |
| Disposable emails | Optional block list for sign-up |
| Dependencies | `npm audit` and secret scanning in CI |

**Logging and audit**

- Never log passwords, OTPs, access tokens, refresh tokens or full cookies; redact them at the logger.
- Write an `auth_audit_logs` row for: `SIGNUP`, `EMAIL_VERIFIED`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_CHANGED`, `TOKEN_REUSE_DETECTED`, `SESSION_REVOKED`, `ROLE_CHANGED`.
- Each row carries IP, user agent and request id, so support can answer "was this me?".

**Later additions that fit this design:** changing the account email (re-verify the new address before switching), two-factor authentication, and social login through `auth_identities`.

## 12. Next.js client integration

The client keeps the access token in memory, refreshes it silently through one shared call, and uses a non-secret hint cookie only to redirect logged-out visitors quickly; the API stays the real gatekeeper.

**Screens**

| Route | Notes |
| --- | --- |
| `/signup` | Email, password with strength meter, show-password toggle |
| `/verify-email` | Six-digit input with `autocomplete="one-time-code"` and `inputmode="numeric"`, paste support, 60-second resend timer |
| `/login` | Handles `EMAIL_NOT_VERIFIED` by moving to the code screen |
| `/forgot-password`, `/reset-password` | Same neutral message whether or not the email exists |
| `/account/security` | Change password, list and revoke devices, log out everywhere |

**Where the refresh cookie lives (decision Q4)**

| Option | How it works | Trade-off |
| --- | --- | --- |
| A: Direct to API | Browser calls NestJS on the API origin with CORS and credentials | Simple; server components and middleware cannot see the session |
| B: Next.js route handlers as a thin proxy (recommended) | Browser calls `/api/auth/*` on the web origin; handlers forward to NestJS and set the `HttpOnly` cookie on the web origin | One origin, no CORS for auth, server components can call the API with the session |

With option B, add a non-secret `session_hint` cookie (not `HttpOnly`, holds no token) so `middleware.ts` can redirect logged-out visitors without calling the API. Every real check still happens on the API.

```ts
// lib/api.ts: access token in memory, single-flight refresh, retry once
let accessToken: string | null = null;
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken() {
  refreshing ??= fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-Requested-With': 'fetch' },
  })
    .then(async (r) => (r.ok ? (await r.json()).accessToken : null))
    .finally(() => { refreshing = null; });
  accessToken = await refreshing;
  return accessToken;
}

export async function api(input: string, init: RequestInit = {}) {
  const run = () => fetch(input, {
    ...init,
    headers: { ...init.headers, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
  });
  let res = await run();
  if (res.status === 401 && (await refreshAccessToken())) res = await run();
  if (res.status === 401) window.location.assign(`/login?returnTo=${encodeURIComponent(location.pathname)}`);
  return res;
}
```

```ts
// middleware.ts: quick redirect only, not a security boundary
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  if (!req.cookies.get('session_hint')) {
    const url = new URL('/login', req.url);
    url.searchParams.set('returnTo', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
}

export const config = { matcher: ['/dashboard/:path*', '/account/:path*'] };
```

**Client rules**

- On first load an `AuthProvider` calls refresh once to restore the session, and shows a skeleton, not the login page, while it waits.
- Accept `returnTo` only if it is a relative path starting with a single `/`, to avoid open redirects.
- Form fields use the right keyboard and autofill hints: `type="email"` with `autocomplete="email"`, `autocomplete="new-password"` on sign-up and `current-password` on login.
- Errors are announced to screen readers with `aria-live`, and submit buttons are disabled while a request runs.
- Auth screens read colours, radius and fonts from the same `BRAND` theme through the Tailwind config, so the forms and the emails match.

## 13. Configuration and secrets

All tunable values live in environment variables validated at start-up, and every secret has a documented way to rotate without logging users out.

```bash
# .env.example: placeholders only, never real values
NODE_ENV=production
APP_URL=https://app.yourbrand.com
API_URL=https://api.yourbrand.com
CORS_ORIGINS=https://app.yourbrand.com
DATABASE_URL=postgres://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# JWT (ES256 key pair, PEM)
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=
JWT_KEY_ID=2026-10-a
JWT_ISSUER=https://api.yourbrand.com
JWT_AUDIENCE=yourbrand-web
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
REFRESH_ABSOLUTE_TTL_DAYS=90

# OTP
OTP_HMAC_SECRET=
OTP_HMAC_SECRET_PREVIOUS=
OTP_TTL_MINUTES=10
OTP_MAX_ATTEMPTS=5

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM=no-reply@mail.yourbrand.com
MAIL_REPLY_TO=support@yourbrand.com

# Bot protection
CAPTCHA_SECRET=
```

**Rules**

- Validate the whole set at boot with `@nestjs/config` and a Zod or Joi schema; the app refuses to start if a required value is missing or malformed.
- Keep production values in a secret manager or the hosting platform's encrypted settings, one set per environment; only `.env.example` is committed.
- Brand values (name, colours, logo, address) are not environment variables; they come from the shared theme file, so web and email stay identical.

**Generating secrets**

```bash
# ES256 signing key pair
openssl ecparam -name prime256v1 -genkey -noout -out jwt-private.pem
openssl ec -in jwt-private.pem -pubout -out jwt-public.pem

# OTP HMAC secret
openssl rand -base64 48
```

**Rotation**

| Secret | How to rotate |
| --- | --- |
| JWT signing key | Create a new pair with a new `kid`, publish both public keys at the JWKS URL, start signing with the new key, and remove the old public key after the access token lifetime plus a safety margin, such as 1 hour |
| OTP HMAC secret | Move the current value to `OTP_HMAC_SECRET_PREVIOUS`, set a new current value, verify against both for 10 minutes, then clear the previous one |
| SMTP credentials | Create new credentials at the provider, deploy them, then delete the old ones |
| Database and Redis passwords | Standard provider rotation with a rolling restart |

## 14. Testing, monitoring and production checklist

The system is ready for production when the full journey passes automated tests, email authentication is verified on real inboxes, and alerts exist for the failures that lock users out.

**Tests**

| Level | What to cover |
| --- | --- |
| Unit | Password hash, verify and rehash; OTP generation, expiry, attempt limit and single use; token claims; password policy |
| Integration (Supertest, test database and Redis) | Sign-up, verify, login, refresh, logout; refresh reuse revokes the family; reset password revokes all sessions; `EMAIL_NOT_VERIFIED` path; rate limit returns 429; permission guard returns 403; tenant isolation |
| Token security | `alg: none` rejected, tampered signature rejected, wrong `aud` or `iss` rejected, expired token rejected, revoked `sid` rejected |
| Email | Render every template, assert an HTML and a plain-text part, all images have `alt`, buttons and codes appear, links point to the right host |
| Route coverage | A test that lists every controller route and fails when a non-public route has no permission or role declared |
| Load | Login throughput with Argon2 on production-sized hardware; size the CPU, memory and `UV_THREADPOOL_SIZE` from the result |

**Metrics and alerts**

| Metric | Alert when |
| --- | --- |
| Email jobs failed or waiting | Failed jobs appear, or the queue backlog keeps growing |
| OTP sent to verified conversion | It drops sharply, which usually means emails are not arriving |
| Bounce and complaint rate | Above the provider's warning level |
| Failed logins and 429 responses | Sudden spike, which suggests credential stuffing |
| `TOKEN_REUSE_DETECTED` events | Any occurrence is reviewed |
| Refresh failures | Rising rate after a deploy |
| Account lockouts | Unusual count in a short time |

**Production checklist**

- [ ] Sending domain verified at the provider; SPF and DKIM pass; DMARC published and reports are read
- [ ] Provider account out of sandbox; a real send to Gmail, Outlook and Yahoo lands in the inbox, not spam
- [ ] All templates checked at 320, 375, 414 and desktop widths, in light and dark mode
- [ ] Production JWT keys and secrets generated, stored in the secret manager, environment validation passes
- [ ] HTTPS everywhere, HSTS on, cookies `Secure`, `trust proxy` matches the load balancer
- [ ] Rate limits tested behind the load balancer with real client IPs
- [ ] Migrations applied, indexes present, nightly cleanup job scheduled
- [ ] Redis persistence or high availability set up for the queue and limits
- [ ] Database backups restored once in a test
- [ ] Bounce and complaint webhook receiving events and filling the suppression list
- [ ] Audit log retention period decided and the log table partitioned or pruned
- [ ] Runbook written: revoke all sessions, rotate the JWT key, disable an account, resend a failed email
- [ ] Dependency audit clean and an external security review done before launch
- [ ] Privacy text, terms link and account deletion process in place

## 15. Implementation plan

Build in five phases, each ending with something that can be tested end to end: the email system first, because sign-up cannot be verified without it.

**Phase 1: Foundations**

- [ ] Shared `brand.theme.ts` package used by the web app and the email package
- [ ] Config module with validated environment variables
- [ ] Drizzle tables and migrations from section 4; seed roles and permissions
- [ ] Redis and BullMQ set up

**Phase 2: Email system**

- [ ] Nodemailer transport, `EmailService`, queue and worker with retries
- [ ] `EmailLayout` and the `verify-email`, `reset-password` and `welcome` templates
- [ ] Local Mailpit and template preview; render tests
- [ ] Provider account, domain, SPF, DKIM and DMARC; bounce webhook

**Phase 3: Core authentication**

- [ ] Password hashing and policy; OTP service
- [ ] Sign-up, verify-email, resend-otp, login
- [ ] Access token signing, JWKS endpoint, refresh rotation with reuse detection, logout and logout-all
- [ ] Forgot and reset password, change password, `password-changed` email
- [ ] Rate limits, lockout and audit logging

**Phase 4: Authorization and client**

- [ ] Global JWT and permissions guards, decorators, permission cache
- [ ] Tenant scoping in the repository base class and `switch-tenant`
- [ ] Next.js screens, API client with single-flight refresh, middleware and `AuthProvider`
- [ ] Sessions screen with device list and revoke
- [ ] Remaining emails: `new-device-login`, `signup-existing-account`, `security-alert`

**Phase 5: Hardening and launch**

- [ ] Integration, token security, email and route-coverage tests
- [ ] Load test login; size the servers
- [ ] Metrics, alerts and the runbook
- [ ] Complete the production checklist in section 14 and run a staged rollout

## 16. Open questions and decisions needed

Eight decisions are open; each has a proposed answer so Phase 1 can start now.

| # | Question | Proposed answer |
| --- | --- | --- |
| Q1 | What are the real brand values: colours, logo files (PNG, light and dark), font, legal address, support email? | Placeholders in `brand.theme.ts` until supplied; the logo must be a hosted PNG |
| Q2 | Which email provider? | Amazon SES if the project is on AWS, otherwise Postmark |
| Q3 | Does every project need tenant scoping, or only some? | Keep `tid` and `tenantId` optional so single-tenant projects ignore them |
| Q4 | Refresh cookie on the API origin (option A) or on the web origin through Next.js route handlers (option B)? | Option B for Next.js App Router projects |
| Q5 | Password reset by emailed OTP or by emailed link? | OTP, to match sign-up; a link is a small change to the same flow |
| Q6 | Session lifetime and a "remember me" choice | 30 days sliding, 90 days absolute; no remember-me checkbox in the first release |
| Q7 | Which bot-protection service? | Cloudflare Turnstile, shown only after a limit is near |
| Q8 | When do two-factor authentication and social login join? | After launch; the data model and session design already leave room |
