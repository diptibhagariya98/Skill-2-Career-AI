---
trigger: model_decision
description: Capacitor 8 plugin catalogue, feature roadmap mapping, installation protocol, Android 15/16 manifest configurations, and runtime failure pitfalls for ResuMentor.
---

# Capacitor 8 Plugin Roadmap & Native Architecture Specification

ResuMentor is running **Capacitor 8.5+** (`@capacitor/core: ^8.5.3`, `@capacitor/android: ^8.5.3`, `@capacitor/cli: ^8.5.3`) targeting Android 15 (SDK 35) and Android 16 with Material 3 Expressive edge-to-edge rendering.

All native capabilities must adhere to:
1. **Version Parity**: All plugins must be verified for Capacitor 8 compatibility. Never install stale Capacitor 6/7 plugins.
2. **Platform Wrapper Isolation**: Screens and components never import plugins directly. All calls route through `src/shared/platform/` with runtime checks and web fallbacks.
3. **Graceful Multi-Runtime Degradation**: Every capability functions identically or degrades gracefully across Android Native APK, Mobile Web (Chrome/Firefox/Safari), and Desktop Web.

---

## 1. Current State & Installed Core Plugins (Capacitor 8)

The following official plugins are installed and synced in the Android project:

| Plugin | Version | Core Capability in ResuMentor | Platform Wrapper Module |
|---|---|---|---|
| `@capacitor/app` | `^8.1.2` | Hardware & gesture back button, app state, minimize, deep links | `src/shared/platform/backNavigation.ts` |
| `@capacitor/browser` | `^8.0.5` | In-app browser for external scholarship portals, job apply links, WhatsApp | `src/shared/platform/browser.ts` |
| `@capacitor/filesystem` | `^8.1.5` | Saving generated resume PDFs, interview transcripts, and backup files | `src/shared/platform/savePdf.ts`, `saveFile.ts` |
| `@capacitor/share` | `^8.0.3` | Native Android share sheet for PDF exports and job roadmaps | `src/shared/platform/share.ts` |
| `@capacitor/preferences` | `^8.0.1` | Isolated SharedPreferences (drafts, dark mode, student criteria) | `src/shared/platform/preferences.ts` |
| `@capacitor/network` | `^8.0.1` | Network status monitoring, offline/online banner, sync triggers | `src/shared/platform/network.ts` |
| `@capacitor/haptics` | `^8.0.2` | Tactile feedback for toggles, sheets, step transitions, and success states | `src/shared/platform/haptics.ts` |
| `@capacitor/keyboard` | `^8.0.6` | Dynamic keyboard height tracking (`--kb`), input bar docking, scroll-into-view | `src/shared/platform/keyboard.ts` |
| `@capacitor/status-bar` | `^8.0.4` | Edge-to-edge transparent system bar styling, light/dark icon toggles | `src/shared/platform/device.ts` |

---

## 2. Roadmap Plugin Matrix by Feature Area

### Tier 1: Immediate Shell & System Polish (Add Now)

| Feature / Need | Recommended Plugin | Capacitor 8 Package Tag | Android Manifest / Setup | Pitfalls & Mitigations |
|---|---|---|---|---|
| **Splash Screen** | `@capacitor/splash-screen` | `npm i @capacitor/splash-screen@latest-8` | Auto-configured via Capacitor. Configure `launchShowDuration: 1500`, `backgroundColor: "#030712"`. | Remove secondary web splash spinners to prevent double-splash flicker. |
| **System Bars (Edge-to-Edge)** | `@capacitor/status-bar` + `@capawesome/capacitor-android-edge-to-edge` (or Cap 8 native) | Already on `@capacitor/status-bar@^8.0.4` | Set `StatusBar.setOverlaysWebView({ overlay: true })` on init. | Android 15 enforces edge-to-edge; content must use `--sat` and `--sab` safe area insets. |
| **Text Zoom / Font Scaling** | `@capacitor/text-zoom` | `npm i @capacitor/text-zoom@latest-8` | None required. Query `TextZoom.get()` or lock webview font scale if root rem scaling handles it. | Prevents broken layouts if user has Android display text scaled to 200%. |
| **Privacy Screen** | `@capacitor/privacy-screen` | `npm i @capacitor/privacy-screen@latest-8` | None required. Hides sensitive resume/income documents in recent apps recents switcher. | Enable conditionally when on Resume Builder or Scholarship Income flow. |
| **Native Dialogs & Toast** | `@capacitor/dialog`, `@capacitor/toast` | `npm i @capacitor/dialog@latest-8 @capacitor/toast@latest-8` | None required. Native confirm dialogs for destructive actions (Delete Resume). | Never use `window.alert` or `window.confirm`. Wrapper falls back to app dialogs. |
| **Native File Opener** | `@capawesome-team/capacitor-file-opener` | `npm i @capawesome-team/capacitor-file-opener@latest` | `<queries>` for PDF viewer intents in `AndroidManifest.xml`. | The Android WebView cannot render PDFs inline. After export, invoke `FileOpener.openFile` or `@capacitor/share`. |

---

### Tier 2: AI Mock Interview Simulator

| Feature / Need | Recommended Plugin | Capacitor 8 Package Tag | Android Manifest / Setup | Pitfalls & Mitigations |
|---|---|---|---|---|
| **Spoken Questions (AI Interviewer TTS)** | `@capacitor-community/text-to-speech` | `npm i @capacitor-community/text-to-speech` (v6+ verified Cap 8 compatible) | No extra permissions required. Supports locale (`en-US`, `en-IN`, `hi-IN`). | Speech synthesis pauses when screen locks or app backgrounds. Wrap in cleanup handler. Web fallback uses `window.speechSynthesis`. |
| **Voice Answer Input (STT)** | `@capacitor-community/speech-recognition` | `npm i @capacitor-community/speech-recognition` (or `@capgo/capacitor-speech-recognition`) | Requires `<uses-permission android:name="android.permission.RECORD_AUDIO" />` in `AndroidManifest.xml`. | Android WebView does not have `window.SpeechRecognition`. Always offer a typed textarea fallback. |
| **Audio Recording for Playback** | `@capgo/capacitor-audio-recorder` | `npm i @capgo/capacitor-audio-recorder` | Requires `<uses-permission android:name="android.permission.RECORD_AUDIO" />`. | Record in `.m4a` or `.aac` for low memory footprint. Save temporary files in CacheDirectory. |
| **Experimental On-Device AI** | `@capacitor/local-llm` (Capacitor Labs) or `@capgo/capacitor-llm` | Experimental evaluation | Requires high-end Android hardware (8GB+ RAM, Vulkan NPU). | Do not block production roadmap on on-device LLM. Use Gemini server-side streaming API with graceful retry. |

---

### Tier 3: Scholarships & Document Management

| Feature / Need | Recommended Plugin | Capacitor 8 Package Tag | Android Manifest / Setup | Pitfalls & Mitigations |
|---|---|---|---|---|
| **Document Scanner (Marksheets, Income Proof)** | `@capgo/capacitor-document-scanner` | `npm i @capgo/capacitor-document-scanner` | Google Play Services Document Scanner API. Requires camera permission. | Automatically crops, flattens, and cleans up document perspective for OCR or upload. |
| **Resume & Marksheet OCR** | `@capawesome/capacitor-mlkit-text-recognition` | `npm i @capawesome/capacitor-mlkit-text-recognition` | ML Kit bundled model or unbundled Google Play Services model. | Allows parsing existing student resumes or academic transcripts directly into the builder fields. |
| **Native Date & Time Picker** | `@capawesome-team/capacitor-datetime-picker` | `npm i @capawesome-team/capacitor-datetime-picker` | Native Material 3 date picker dialog. | Web `<input type="date">` in Android WebView is inconsistent across Android 10-15. |
| **Share Target (Receive Shared Files/Links)** | `@capgo/capacitor-share-target` | `npm i @capgo/capacitor-share-target` | Add `<intent-filter>` in `AndroidManifest.xml` for `android.intent.action.SEND` with `application/pdf` and `text/plain`. | Allows students to share job postings or resume PDFs directly from Chrome or LinkedIn into ResuMentor. |

---

### Tier 4: Offline-First Data & Scheduled Engagement

| Feature / Need | Recommended Plugin | Capacitor 8 Package Tag | Android Manifest / Setup | Pitfalls & Mitigations |
|---|---|---|---|---|
| **Local Notifications (Zero-Server Reminders)** | `@capacitor/local-notifications` | `npm i @capacitor/local-notifications@latest-8` | Requires `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />` (Android 13+). | Used for scholarship application deadlines and daily interview practice streaks without server push costs. |
| **Push Notifications (Mentor Messages, Job Alerts)** | `@capacitor/push-notifications` | `npm i @capacitor/push-notifications@latest-8` | Firebase `google-services.json` in `android/app/`, Google Services Gradle plugin. | Needs runtime notification permission prompt before registering APNs/FCM token. |
| **Structured Offline Storage** | `@capacitor-community/sqlite` (or `@capgo/capacitor-fast-sql`) | `npm i @capacitor-community/sqlite` | Requires initializing SQLite connection pool on startup. | For storing full question banks, offline scholarship directory, and revision histories. |
| **Background Sync** | `@capacitor/background-runner` | `npm i @capacitor/background-runner@latest-8` | Requires WorkManager configuration. | Android aggressive battery optimization throttles background execution. Never rely on strict exact intervals. |

---

### Tier 5: Authentication, Security & Production APK Delivery

| Feature / Need | Recommended Plugin | Capacitor 8 Package Tag | Android Manifest / Setup | Pitfalls & Mitigations |
|---|---|---|---|---|
| **Biometric Auth (App Lock)** | `@aparajita/capacitor-biometric-auth` | `npm i @aparajita/capacitor-biometric-auth` | `<uses-permission android:name="android.permission.USE_BIOMETRIC" />`. | Protects user resumes and scholarship income certificates when reopening the app. |
| **Native Social Login (Google Sign-In)** | `@capgo/capacitor-social-login` | `npm i @capgo/capacitor-social-login` | Google Sign-In SDK configuration, SHA-1 fingerprint registered in Google Cloud Console. | Google disallows OAuth logins inside embedded WebViews (`disallowed_useragent`). Native SDK is mandatory. |
| **Live OTA Updates (Direct APK Release)** | `@capgo/capacitor-updater` | `npm i @capgo/capacitor-updater` | Configured with Capgo update channel or self-hosted S3/GitHub releases. | Pushes instant bugfixes and UI updates to user phones without requiring a full APK reinstall. Native plugin changes still require APK rebuild. |
| **Crash & Error Reporting** | `@sentry/capacitor` | `npm i @sentry/capacitor` | DSN configuration in `capacitor.config.ts`. | Captures uncaught native crashes, WebView white screens, and unhandled promise rejections. |

---

## 3. Official Installation Protocol for Capacitor 8

When adding any plugin from this roadmap:

```bash
# 1. Install using the Capacitor 8 release tag
npm i @capacitor/plugin-name@latest-8 --save

# For vetted community plugins:
npm i plugin-package-name --save

# 2. Sync to Android project
npx cap sync android

# 3. Verify Android plugin registration
# Inspect android/app/src/main/java/.../MainActivity.java and generated capacitor plugins
```

### Android Manifest Additions Checklist (`android/app/src/main/AndroidManifest.xml`)

When installing capabilities requiring permissions, add only the exact required declarations:

```xml
<!-- Audio Recording (Interview Practice) -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- Notifications (Android 13+ / SDK 33+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Biometric Auth -->
<uses-permission android:name="android.permission.USE_BIOMETRIC" />

<!-- Network State (Already configured) -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## 4. Platform Wrapper Integration Standard (`src/shared/platform/`)

Every plugin MUST be exposed via a specialized module in `src/shared/platform/`. Screens must NEVER import Capacitor plugins directly.

Standard wrapper signature:
```typescript
export interface PlatformResult<T> {
  ok: boolean;
  data?: T;
  reason?: "unsupported" | "denied" | "cancelled" | "offline" | "timeout" | "failed";
  message?: string;
}
```

Rules:
1. Always use dynamic `await import("@capacitor/...")` inside function bodies to safeguard Next.js static export and browser runtimes.
2. Check `isNative()` before attempting native calls.
3. Provide a robust web fallback for mobile and desktop browsers.
4. Wrap non-interactive plugin calls with a 15-second timeout.
5. Provide user-friendly error messages, never raw stack traces.
