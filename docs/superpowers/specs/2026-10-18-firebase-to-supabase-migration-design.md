# Architecture Design Specification: Firebase to Supabase Migration

- **Date:** 2026-10-18
- **Target Project:** ResuMentor / Skill-2-Career-AI (`Skill-2-Career-AI-1`)
- **Status:** Approved for Implementation

---

## 1. Executive Summary & Goals

### 1.1 Objective
Completely replace Firebase Auth and Cloud Firestore with a unified **Supabase (Auth + PostgreSQL)** backend. The solution must provide full control, predictable free-tier behavior for presentations and production demos, zero permission-denied gRPC stream failures, and seamless cross-platform execution across:
1. **Vercel Serverless / SSR**: Next.js App Router web application.
2. **Capacitor Mobile (Android & iOS)**: Static mobile export (`BUILD_TARGET=mobile`) running in WebViews with local storage session persistence and hardware back button handling.

### 1.2 Key Motivations
- Eliminate `7 PERMISSION_DENIED` errors caused by running unauthenticated Firebase Web SDK inside server-side route handlers.
- Eliminate complex, error-prone Firestore declarative security rules.
- Replace manual HMAC OTP hashing and custom `otp_codes` tables with Supabase's native, robust 6-digit Email OTP engine (backed by custom Gmail SMTP).
- Adopt full relational PostgreSQL with Row Level Security (RLS) and automated user profile provisioning triggers.

---

## 2. Target Architecture

```
                  +------------------------------------------------+
                  |            Client Application Layer            |
                  |                                                |
                  |   +-------------------+  +-----------------+   |
                  |   | Next.js Web App   |  | Capacitor App   |   |
                  |   | (Vercel Edge/SSR) |  | (Android/iOS)   |   |
                  |   +-------------------+  +-----------------+   |
                  +-----------------------+------------------------+
                                          |
                                          | HTTPS REST / Auth
                                          v
                  +------------------------------------------------+
                  |               Supabase Cloud                   |
                  |                                                |
                  |   +------------------+  +------------------+   |
                  |   |  Supabase Auth   |  | Custom Gmail     |   |
                  |   |  (6-Digit OTP,   |->| SMTP             |   |
                  |   |   Sessions, JWT) |  | (Zero Rate Limit)|   |
                  |   +--------+---------+  +------------------+   |
                  |            |                                   |
                  |            | (On auth.users INSERT trigger)    |
                  |            v                                   |
                  |   +---------------------------------------+    |
                  |   |  PostgreSQL Database (public.profiles)|    |
                  |   |  - Row Level Security (RLS)           |    |
                  |   |  - Direct Foreign Key to auth.users   |    |
                  |   +---------------------------------------+    |
                  +------------------------------------------------+
```

---

## 3. Database Schema & Security (PostgreSQL)

### 3.1 `public.profiles` Table
```sql
-- 1. Create Profiles Table referencing Supabase Auth
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  role text default 'student',
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. RLS Policies: Users can view and edit only their own profile
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 4. Automated User Profile Provisioning Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, photo_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Student'),
    new.email,
    'student',
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 4. Platform & Environment Compatibility

### 4.1 Cross-Platform Supabase Client (`src/lib/supabase.ts`)
The client must dynamically adapt whether it is running in a browser, a server route, or a Capacitor mobile WebView:
- **`persistSession: true`**: Preserves login across mobile app restarts and browser tabs.
- **`autoRefreshToken: true`**: Automatically rotates tokens before they expire.
- **`detectSessionInUrl: true`**: Captures OAuth tokens or magic link hashes from deep links.
- **Capacitor Storage Adapter**: Fallback to standard web storage with resilience against mobile OS clearing.

### 4.2 Environment Variables (`.env.local` & Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<optional-admin-key-for-server-actions>
```

---

## 5. Component Refactoring Specifications

### 5.1 Authentication Flow (`src/components/Auth.tsx`)
- **Registration**:
  - `supabase.auth.signUp({ email, password, options: { data: { name: fullName } } })`
  - If email confirmation is enabled, transitions UI to 6-digit OTP mode.
- **OTP Verification**:
  - Replaces custom Nodemailer API call with native `supabase.auth.verifyOtp({ email, token: code, type: 'signup' })`.
  - On successful verification, user session is instantly active.
- **Resend OTP**:
  - `supabase.auth.resend({ type: 'signup', email })` with existing 60-second cooldown timer.
- **Login**:
  - `supabase.auth.signInWithPassword({ email, password })`.
- **Google OAuth**:
  - `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } })`.
- **Password Reset**:
  - `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth?mode=reset' })`.

### 5.2 Dashboard & Profile (`src/components/Dashboard.tsx` & `src/components/Profile.tsx`)
- Replace `doc(db, "users", user.uid)` and `getDoc` with:
  ```typescript
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  ```
- Replace `updateDoc(userRef, { photoURL: ... })` with:
  ```typescript
  const { error } = await supabase
    .from("profiles")
    .update({ photo_url: compressedDataUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  ```
- Replace `signOut(auth)` with `supabase.auth.signOut()`.

### 5.3 Route Listeners (`src/app/auth/page.tsx` & `src/app/dashboard/page.tsx`)
- Replace `onAuthStateChanged(auth, ...)` with:
  ```typescript
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      // route to dashboard
    } else {
      // route to auth
    }
  });
  ```

---

## 6. Deprecation & Cleanup

The following legacy Firebase files and routes will be decommissioned and removed:
1. `src/lib/firebase.ts` (Replaced by `src/lib/supabase.ts`)
2. `src/app/api/auth/send-otp/route.ts` (Supabase native OTP handles this)
3. `src/app/api/auth/resend-otp/route.ts` (Supabase native resend handles this)
4. `src/app/api/auth/verify-otp/route.ts` (Supabase native verify handles this)
5. Remove `firebase` package from `package.json`.

---

## 7. Verification & Build Criteria

1. **Local Web Execution**: `npm run dev` loads `/auth` and `/dashboard` cleanly without Firebase console errors.
2. **Type Safety & Build**: `npm run build` completes with zero TypeScript or route compilation errors.
3. **Mobile Build**: `npm run build:mobile` outputs a clean static `./out` bundle and syncs with Capacitor (`npx cap sync`).
