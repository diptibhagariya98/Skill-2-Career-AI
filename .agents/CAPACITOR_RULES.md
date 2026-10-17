# CAPACITOR_RULES.md

**Project:** ResuMentor (offline-first mobile app)
**Applies to:** Everyone who touches `capacitor.config.ts`, `android/`, `ios/`, native plugins, or any code that runs inside the Capacitor WebView.
**Companion file:** `NEXTJS_RULES.md` (read it first; Capacitor only packages what Next.js exports).

**Keywords:** MUST / MUST NOT = non-negotiable, a PR violating it is rejected. SHOULD = default, deviation needs a written reason in the PR.
Each rule has an ID (e.g. `CAP-07`) so reviewers can cite it in PR comments.

---

## 0. TL;DR (the 12 rules that prevent most incidents)

1. The app is a **static bundle in the APK/IPA**. There is no Next.js server inside the app. (`CAP-01`)
2. Always build with `npm run build:mobile`, then `npx cap sync`. Never run `cap sync` on a stale `out/`. (`CAP-04`)
3. **Never ship** a `server.url` in `capacitor.config.ts`. (`CAP-03`)
4. **No secrets** in the bundle. Anything `NEXT_PUBLIC_*` is public. Gemini/Firebase admin keys live on the server only. (`CAP-20`)
5. Do not hand-edit generated web assets inside `android/` or `ios/`. (`CAP-05`)
6. Every browser/native API call is guarded: `Capacitor.isNativePlatform()` and `typeof window !== "undefined"`. (`CAP-08`)
7. Offline is a **normal state**, not an error. Detect it, tell the user, never crash. (`CAP-14`)
8. User data (resumes) is **PII**. Treat storage as untrusted and breakable: version it, back it up, export it. (`CAP-16`)
9. PDF export = generate on device, write with `@capacitor/filesystem`, open with `@capacitor/share`. Test on real devices. (`CAP-12`)
10. Pin all `@capacitor/*` packages to the **same major version**. (`CAP-02`)
11. Test every release in **airplane mode on a real low-end Android phone and a real iPhone**. (`CAP-30`)
12. `appId`, signing keystore and `versionCode` are forever. Back them up and never change them casually. (`CAP-26`)

---

## 1. Architecture rules

### CAP-01: The app is a static bundle
- Capacitor loads files from the device (`webDir`) inside a native WebView.
- Anything needing a Node server (API routes, SSR, middleware, server actions, image optimizer) **does not exist in the app**. See `NEXTJS_RULES.md`.
- Code that needs a server calls a **remote, hosted API** (e.g. Vercel deployment) through the API base URL.

```
Phone (APK/IPA)                         Cloud (only when online)
├── out/ (HTML/CSS/JS/fonts/quizzes)    ├── /api/resume/analyze  (Gemini)
├── Capacitor native bridge             ├── /api/jobs
└── Local storage (resumes, progress)   └── Firebase / Firestore sync
```

### CAP-02: Version alignment
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios` MUST share the same **major** version, and official plugins MUST match that major.
- Upgrades happen in a dedicated PR/branch, never mixed with feature work. Follow the official migration guide for that major and re-test all native flows.
- Commit `package-lock.json`. Use `npm ci` in CI.

### CAP-03: `capacitor.config.ts` is production configuration
Recommended baseline:

```ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yourcompany.resumentor", // REPLACE. Permanent once published (CAP-26)
  appName: "ResuMentor",
  webDir: "out",
  server: {
    androidScheme: "https", // origin becomes https://localhost on Android
    // NEVER commit: url, cleartext: true
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
```

- MUST NOT commit `server.url` (live-reload dev server). A build with it loads a remote/dev server instead of bundled assets and breaks offline completely. If you need live reload locally, use a **separate, uncommitted** config or env switch and verify before every release that it is absent.
- MUST NOT set `cleartext: true` or `allowMixedContent: true` in production.
- MUST NOT use wildcard `server.allowNavigation` (e.g. `["*"]`). List exact trusted hosts only, and prefer none.
- `webDir` MUST match the Next.js export folder (`out`).

---

## 2. Build and sync workflow

### CAP-04: The only approved build pipeline

```bash
npm ci
npm run lint && npm run typecheck
npm run build:mobile      # BUILD_TARGET=mobile next build -> ./out
npx cap sync              # copies ./out into android/ and ios/ and updates plugins
```

- `cap sync` = `copy` + `update`. Use it after **any** web change or plugin install/remove.
- Never run `cap sync` without a fresh `build:mobile`. A stale `out/` ships stale code.
- After sync, open the native IDE (`npx cap open android` / `npx cap open ios`) to run or archive. Do not build release binaries from a dirty working tree.

### CAP-05: Generated files are not source
- `android/app/src/main/assets/public/` and `ios/App/App/public/` are **generated** from `out/`. MUST NOT edit them by hand and SHOULD NOT commit them (confirm they are in `.gitignore`).
- Native project files (`AndroidManifest.xml`, `Info.plist`, Gradle files, Xcode project) **are** source. Commit them, and review changes carefully.
- Run `cap sync` after pulling changes that touch plugins, since native dependencies may differ.

### CAP-06: Add a platform once, never regenerate it
- `npx cap add android|ios` is run once. Re-running or deleting the folders destroys signing, permission and manifest customisations.
- Customisations made in native files MUST be documented in the PR description.

### CAP-07: Scripts expected in `package.json`

```json
{
  "scripts": {
    "build:mobile": "cross-env BUILD_TARGET=mobile next build",
    "cap:sync": "npm run build:mobile && cap sync",
    "cap:android": "npm run cap:sync && cap open android",
    "cap:ios": "npm run cap:sync && cap open ios"
  }
}
```

---

## 3. Writing code that runs in the WebView

### CAP-08: Platform and SSR guards
Next.js still pre-renders pages at build time, so browser/native code can crash the build.

```ts
import { Capacitor } from "@capacitor/core";

export const isNative = () =>
  typeof window !== "undefined" && Capacitor.isNativePlatform();
```

- Native plugins MUST be called only from client code (`"use client"`, `useEffect`, event handlers), never during render or at module top level of a server-rendered file.
- Every feature MUST have a **web fallback** (browser download for PDF, `navigator.share` or copy link for share) so the same code works in `npm run dev`.

### CAP-09: Plugins: adding and trusting
- Prefer **official `@capacitor/*` plugins**. Community plugins need: recent releases, compatibility with our Capacitor major, and an acceptable licence. Record the reason in the PR.
- Installing a plugin = `npm i`, `npx cap sync`, then check that the native permissions/entries it needs were added.
- Request the **minimum permissions**. Never add a permission "just in case" (Play Store and App Store reviewers check this).
- Wrap every plugin in a thin module (e.g. `lib/native/files.ts`) so screens never import plugins directly. This keeps the web fallback and mocking in one place.

### CAP-10: Mobile UI requirements
- Respect **safe areas** (notch, home indicator): use `env(safe-area-inset-*)` and `viewport-fit=cover`.
- Handle the **Android hardware back button** (`@capacitor/app` `backButton` listener). Never leave users trapped or exit the app unexpectedly from a form with unsaved data.
- Handle the **on-screen keyboard** so inputs are not covered (check `@capacitor/keyboard` behaviour on both OSes).
- Touch targets SHOULD be at least 44x44 px. Do not rely on `:hover`.
- Disable accidental text selection/zoom only where it harms UX. Do not block accessibility zoom globally.
- Support system font scaling and dark mode, or explicitly lock to one theme and test it.

### CAP-11: Assets must be local
- Fonts, icons, images, quiz banks, templates and PDF libraries MUST be bundled. **No CDN links for anything required offline** (Google Fonts via `<link>`, CDN scripts, remote images).
- Use `next/font` (self-hosted at build time) and local assets in `public/`.
- Remote images (profile photos from the web) need a fallback placeholder.

---

## 4. Files, PDF and sharing

### CAP-12: PDF export flow (offline)
1. Generate the PDF **client-side** (dynamic-import the PDF library with `ssr: false`).
2. Convert to base64.
3. Write with `@capacitor/filesystem`.
4. Open the share sheet with `@capacitor/share` using the returned `uri`.

```ts
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onloadend = () => resolve(String(r.result).split(",")[1] ?? "");
    r.readAsDataURL(blob);
  });

export async function savePdf(blob: Blob, fileName: string) {
  // Web fallback
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const data = await blobToBase64(blob);
  const { uri } = await Filesystem.writeFile({
    path: fileName,
    data,
    directory: Directory.Documents,
    recursive: true,
  });

  await Share.share({ title: fileName, url: uri, dialogTitle: "Share your resume" });
}
```

Precautions:
- **Do not promise** "saved to the Downloads folder". Where a file is visible to the user differs by OS and OS version (Android scoped storage, iOS app sandbox). Phrase the UI as "Saved. Choose where to open or share it" and let the share sheet do the work.
- On iOS, files in `Documents` are inside the app sandbox and not visible in the Files app unless file sharing is enabled in `Info.plist`. The share sheet ("Save to Files") is the reliable path.
- Sanitise file names (remove `/ \ : * ? " < > |`, limit length, include a timestamp or name).
- Wrap in try/catch. Surface a clear message on failure (storage full, user cancelled share) and never fail silently.
- `Share.share` rejects when the user dismisses the sheet on some platforms. Treat cancel as a normal outcome.
- Large or image-heavy PDFs can exhaust WebView memory on low-end phones. Compress images before embedding (cap at roughly 1000-1600 px on the long edge) and test with a long resume plus photo.

### CAP-13: Photo/file picking
- Use `@capacitor/camera` (or a file input) and **downscale and compress immediately**. Do not keep multi-megabyte originals in storage.
- Handle permission denial gracefully, with an explanation and a path to settings.
- Declare usage descriptions on iOS (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`) in plain language. Missing strings cause crashes or App Store rejection.

---

## 5. Offline, network and data

### CAP-14: Offline is a first-class state
- Use `@capacitor/network` (`Network.getStatus()` and the `networkStatusChange` listener) on native, `navigator.onLine` plus `online/offline` events on web. Wrap in one hook (`useNetworkStatus`).
- **`onLine === true` does not mean the internet works** (captive Wi-Fi, no data balance, blocked DNS). Every network call MUST have a timeout (`AbortController`, e.g. 15 s), error handling, and a user-readable failure state.
- Features that need the cloud (AI ATS scoring, live jobs) MUST show the offline banner and never throw a raw `Failed to fetch`.
- Offline-capable features MUST never `await` a network call on their critical path.

### CAP-15: Remote API calls and CORS
- All remote calls use `NEXT_PUBLIC_API_URL` through one API client (see `NEXTJS_RULES.md`). No hard-coded hosts.
- The WebView origin is **`https://localhost`** (Android, with `androidScheme: "https"`) or **`capacitor://localhost`** (iOS). The server's CORS allowlist MUST include both, plus the web origin. Missing this is the #1 cause of "works in browser, fails in app".
- Production API MUST be HTTPS only.
- Do not rely on cookies for auth across origins. Use token-based auth (`Authorization` header).
- Rate-limit and authenticate the AI endpoints server-side. Anyone can extract the API URL from the app bundle.

### CAP-16: Local storage rules (resumes are PII)
- `localStorage` / IndexedDB inside the WebView **can be cleared by the OS** under storage pressure or when the user clears app data. Never treat them as the only copy of anything valuable.
- Use `@capacitor/preferences` for small settings and flags. Use IndexedDB (via a small wrapper) or SQLite for larger structured data like resumes and progress.
- Every stored object MUST carry a `schemaVersion` and go through a migration function on load. A crash on an old-format record after an app update is a release blocker.
- Provide **"Export backup" / "Import backup"** (JSON file via Filesystem + Share) for resumes.
- Auto-save MUST be **debounced** (e.g. 300-800 ms) and written atomically (write, then swap). Do not write on every keystroke synchronously.
- Sensitive data (phone, address, DOB, ID numbers) SHOULD be minimised. Do not log it, do not put it in analytics, do not put it in URLs.
- Consider encrypted/secure storage plugins for tokens (never store auth tokens in plain `localStorage` if a secure option exists).

### CAP-17: Cloud sync (Firebase)
- Local data is the **source of truth while offline**. Sync is queued and idempotent. Define a conflict rule (last-write-wins with timestamp, or merge per section) and document it.
- Never block UI on sync. Show a subtle "synced / pending" indicator.
- Firebase Auth popup and redirect flows are **unreliable inside a WebView**. Use a native-compatible approach (e.g. a Capacitor-aware Firebase auth plugin or the SDK's supported native flow) and test sign-in on real devices on both OSes.
- Firestore offline persistence in a WebView needs testing. IndexedDB-based persistence can be disabled or fail in some contexts. Fall back gracefully.

---

## 6. Security

### CAP-20: No secrets in the app
- Everything in the JS bundle and in native resources can be extracted. **Gemini keys, service-account JSON, admin SDK keys, private signing secrets MUST NOT be in the repo's client code or `.env` files that get inlined**.
- Only `NEXT_PUBLIC_*` values that are designed to be public (API base URL, Firebase web config) may be in the app. Restrict Firebase web keys with security rules and App Check where possible.

### CAP-21: WebView hardening
- Disable WebView debugging in release (`android:debuggable` must be false, which release builds do by default; verify).
- Set `android:allowBackup="false"` (or configure rules) so resume data is not extracted via ADB/cloud backup unintentionally.
- Set a **Content Security Policy** `<meta>` suited to the bundle (self + your API host + Firebase hosts). Avoid `unsafe-eval` unless a dependency requires it (and document why).
- Never render untrusted HTML with `dangerouslySetInnerHTML`. User resume text is data, not markup.
- Validate and whitelist any deep-link / intent parameters before using them.

### CAP-22: Supply chain
- Run `npm audit` in CI and review high/critical issues before release.
- New dependencies need a justification (size, maintenance, licence). Prefer fewer, smaller libraries because every KB is parsed on the phone.
- Lock plugin and Gradle/CocoaPods versions. Do not use `latest`.

---

## 7. Performance

### CAP-23: Targets
- Cold start to interactive: under ~2 s on a mid-range Android phone (budget devices will be slower. Test on one).
- Initial JS: keep as small as possible, with route-level code splitting and lazy-loaded heavy modules (PDF engine, charts, quiz banks per subject).
- Avoid large synchronous JSON parses on startup. Load question banks per topic, not all at once.
- Animations: prefer `transform` / `opacity`. Test Framer Motion-heavy screens on low-end hardware and respect `prefers-reduced-motion`.
- Large lists MUST be virtualised or paginated.

---

## 8. Android release rules

### CAP-24: Android
- Set `minSdk` / `targetSdk` per current Google Play requirements. `targetSdk` requirements change yearly, so check before each release.
- Release builds are **AAB** (Play Store), signed with the upload key. Use **Play App Signing**.
- Increment `versionCode` on **every** upload. `versionName` is the human-readable version.
- Enable code shrinking only after testing (R8/ProGuard can strip plugin classes. Keep rules where plugins document them).
- Declare only needed permissions in `AndroidManifest.xml`. Provide an accurate Data Safety form (the app handles personal info).
- Test on Android API levels at both ends of the supported range (storage behaviour differs between 9, 10, 11+ and 13+).

### CAP-25: iOS
- Provide every `NS*UsageDescription` string for permissions the app can request, written for end users.
- Keep `ITSAppUsesNonExemptEncryption` accurate to avoid export-compliance prompts.
- Include the **privacy manifest** and accurate App Privacy details. Third-party SDKs may have their own required entries.
- **App Store guideline risk:** a thin web wrapper can be rejected as "minimum functionality". Our native-feeling offline features (local storage, file save/share, offline quizzes) are the justification. Keep them working and mention them in review notes.
- Test on a physical device. The simulator hides file-system, keyboard and memory problems.

### CAP-26: Identity and keys (irreversible)
- `appId` (bundle ID / application ID) cannot change after publishing without creating a different app. Decide once.
- Store the Android **keystore and passwords** and the iOS signing certificates in a secure team vault, with at least two people having access. **Losing the upload key is painful, and losing a legacy signing key can be fatal for updates.**
- Never commit keystores, `.p12`, provisioning profiles, `google-services.json` with private data, or passwords.

---

## 9. Live updates (OTA)

### CAP-27: Rules if we ever use OTA web updates
- Only **web assets** (JS/HTML/CSS) may be updated OTA. Never change app purpose or add native behaviour via OTA. Both stores restrict this.
- Updates MUST be versioned, signed/verified, roll-back capable, and compatible with the installed native shell (keep a `minNativeVersion` check).
- Do not decide on OTA until storage-migration (CAP-16) is solid, because OTA multiplies migration risks.

---

## 10. Testing

### CAP-30: Mandatory pre-release test matrix

| Test | Android (real, low-end) | iPhone (real) |
| :-- | :-- | :-- |
| Fresh install, airplane mode from first launch | ☐ | ☐ |
| Create resume, kill app, reopen, data intact | ☐ | ☐ |
| Update from previous version, data migrated | ☐ | ☐ |
| Export PDF offline, open and share | ☐ | ☐ |
| Quiz and scholarship flows offline | ☐ | ☐ |
| Go offline mid-AI-request, graceful message | ☐ | ☐ |
| Back online, sync completes, no duplicates | ☐ | ☐ |
| Low storage: save fails with clear message | ☐ | ☐ |
| Permission denied (camera/photos), no crash | ☐ | ☐ |
| Rotate / split screen / font scale 130% | ☐ | ☐ |
| Android back button / iOS swipe-back behaviour | ☐ | ☐ |
| Sign-in flow works in WebView | ☐ | ☐ |
| Release build has no `server.url`, no debug flags | ☐ | ☐ |

---

## 11. Pre-release checklist

- [ ] `capacitor.config.ts`: no `server.url`, no cleartext, `webDir: "out"`, correct `appId`
- [ ] `npm run build:mobile` succeeds on a clean checkout (`npm ci`)
- [ ] `npx cap sync` run on a fresh `out/`
- [ ] `NEXT_PUBLIC_API_URL` points at the **production** HTTPS API
- [ ] Server CORS allows `https://localhost` and `capacitor://localhost`
- [ ] No secrets in bundle (search for key prefixes and `.env` contents)
- [ ] Versions bumped (`versionCode` / `versionName`, iOS build number)
- [ ] Permissions and usage strings reviewed
- [ ] Storage migration tested from the previous released version
- [ ] Pre-release test matrix (CAP-30) completed
- [ ] Store listing, privacy policy URL and data-safety/privacy forms accurate
- [ ] Keystore/certificates backed up

---

## 12. Troubleshooting quick reference

| Symptom | Likely cause | Fix |
| :-- | :-- | :-- |
| App shows old UI after code change | Stale `out/` or skipped sync | `npm run build:mobile && npx cap sync`, rebuild native |
| White screen on launch | JS error at startup, or wrong `webDir`, or SSR-only code at top level | Inspect with Chrome `chrome://inspect` / Safari Web Inspector, fix guards (CAP-08) |
| Works in browser, API fails in app | CORS missing the Capacitor origin | Allow `https://localhost` and `capacitor://localhost` (CAP-15) |
| App tries to load a remote site | `server.url` left in config | Remove it, `cap sync`, rebuild |
| Deep route returns 404 after navigation/refresh | Export without `trailingSlash` or missing static params | See `NEXTJS_RULES.md` (NJS-07, NJS-08) |
| `window is not defined` during build | Browser code run during prerender | Guard or move into `useEffect` / `ssr:false` dynamic import |
| PDF export crashes on old phones | Memory pressure from big images/canvas | Downscale images, reduce canvas scale, test low-end devices |
| Plugin method "not implemented" | Running on web, or plugin not synced | Add web fallback, run `cap sync` |
| Data lost after update | Missing migration or storage cleared | Add `schemaVersion` migration, backup/restore (CAP-16) |
| Google sign-in popup does nothing | WebView blocks popup flow | Use native-capable auth flow (CAP-17) |

---

## 13. Pull-request rules for anything Capacitor-related

A PR touching `capacitor.config.ts`, `android/`, `ios/`, or plugins MUST include:
1. What changed and why. Mention the affected platforms.
2. Evidence it was tested on a real device (screenshot or short recording).
3. Offline behaviour confirmed (airplane mode).
4. Permission/privacy impact, if any.
5. Rollback note (what to revert if it breaks).
