---
trigger: model_decision
description: Native bridge rules for Next.js + Capacitor: package and plugin install protocol, platform wrapper contract, capability table, failure-proofing, custom plugin fallback. Read before any task that needs a device or browser capability.
---

# Native Bridge, Packages and Failure-Proofing

Goal: every feature works in the Android app, the mobile browser and the desktop browser, and never fails silently. Installing packages and Capacitor plugins is allowed and expected when a feature needs them, under the protocol below.

## 1. Principles
- Capability first: each device feature is a named capability in the platform wrapper, with a native implementation, a web fallback and an availability flag.
- Three runtimes must work: the Android app (WebView with Capacitor), the mobile browser and the desktop browser. A feature that works in only one is not done.
- No false success. A success state appears only after the result exists (file written, permission granted, token received, message sent).
- Failures are visible, specific and recoverable: a plain message, Retry, or a path to settings.
- Use the simplest option that works on all three runtimes. Use native only when the web API is missing, unreliable in the WebView, or looks non-native.

## 2. Install protocol (every time)
1. Check first. Read the package manifest, the lockfile, the installed Capacitor plugins, the platform wrapper and the Android project plugin list. Reuse what exists.
2. Choose in this order: (a) official Capacitor plugin, (b) maintained community plugin, (c) standard web API that works in the Android WebView on Android 15 and 16, (d) custom plugin (section 8).
3. Vet community packages: supports the installed Capacitor major version, a recent release, no open crash or Android 15/16 issues, small footprint, a permissive license. Prefer the most used, maintained option.
4. Match versions. A plugin's major version matches the installed Capacitor core major. Never upgrade Capacitor core, the Android platform package or the CLI as a side effect. Use the package manager the lockfile shows and keep its lockfile change.
5. Install the minimum, one capability at a time. After any add, remove or upgrade run the project's sync command (for example `npx cap sync android`) so the native project picks it up.
6. Native setup: apply only what the plugin documentation requires (permissions, queries, intent filters, minimum SDK, a config file). Add exactly those lines. List every native edit, and list any external credential still needed (a push or sign-in config file, for example) as Blocked with the exact item.
7. Wire it through the wrapper (section 3) with a typed function, an availability flag and a web fallback. Screens never import the plugin.
8. Verify: type check, lint, static web build, sync, Android debug build, then test in the Android app and in the browser (section 7).
9. Report: package, version, reason, native edits, tests run and results.
Remove plugins that are no longer used. Never leave a half-installed plugin.

## 3. Platform wrapper contract
- The wrapper is the only place that imports Capacitor APIs and plugins. Everything else calls its functions.
- API: `runtime()` returns native or web. `has(capability)` returns true or false. Each function returns `{ ok: true, data }` or `{ ok: false, reason, message }`. Reasons: unsupported, denied, cancelled, offline, timeout, failed. It never throws to screens.
- Load plugins lazily (dynamic import inside the function), never at module top level, so the static export build and the browser never break. No access during the build or server render. Call from effects and event handlers only.
- Timeouts: wrap non-interactive native calls (file write, network, storage) with a timeout of about 15 s. Never time out calls that wait for the user (permission dialog, share sheet, picker).
- Cancel is not an error. If the user closes a sheet or picker, return `cancelled` and show nothing or a neutral note.
- Ignore a second call while one is in flight (double tap guard).
- In development log the capability, reason and original error. Never show raw errors to users.
- Keep a short header comment in the wrapper listing each capability, its plugin and version, and its web fallback. Update it with every plugin change.

## 4. Capability table
Names marked (verify) are community examples. Check the installed Capacitor major version before installing.

| Capability | Android app | Browser fallback |
|---|---|---|
| Back, lifecycle, deep links, minimize | `@capacitor/app` | history, visibility events, normal URLs |
| Haptics | `@capacitor/haptics` | no-op |
| Keyboard | `@capacitor/keyboard` plus visual viewport | visual viewport |
| System bars, edge-to-edge | status bar plugin plus the installed Capacitor version's system bars support | theme color meta, `env()` insets |
| Splash | `@capacitor/splash-screen` | none |
| Network status | `@capacitor/network` | online and offline events |
| Small settings | `@capacitor/preferences` | local storage |
| Secrets, tokens | secure storage community plugin (verify) | short-lived memory token |
| Write and read files | `@capacitor/filesystem` | Blob and download |
| Share, export result | `@capacitor/share` | Web Share, else download or copy link |
| Save to a chosen folder | file save community plugin (verify) | download |
| External links | `@capacitor/browser` | new tab with safe `rel` |
| Clipboard | `@capacitor/clipboard` | Clipboard API |
| Dialogs, toast, action sheet | `@capacitor/dialog`, `toast`, `action-sheet` | app components |
| Camera, gallery | `@capacitor/camera` or a picker plugin | file input with `accept`, `capture` |
| File pick | file picker community plugin (verify) | file input |
| Push notifications | `@capacitor/push-notifications` plus the app's Firebase config | hide the setting |
| Local notifications | `@capacitor/local-notifications` | in-app banner or hide |
| Social sign-in | maintained social login plugin (verify) | web OAuth redirect |
| Large offline data | SQLite community plugin (verify) | IndexedDB |
| Device info, text zoom, orientation | `@capacitor/device`, `text-zoom`, `screen-orientation` | feature detection |

Add a row when a capability is added.

## 5. Failure-proofing rules
- Plugin readiness: never call a plugin before the app is ready. Await the wrapper init. "Plugin not implemented" almost always means a missing install, a missing sync, or no web fallback.
- Android lifecycle: the activity can be destroyed while a picker or camera is open. Handle restored plugin results on startup and save minimal draft state before launching an external activity.
- Network: HTTPS only, and never enable cleartext traffic. The WebView origin is the app's own origin (by default `https://localhost` on Android), so the backend must allow it in CORS, including preflight. If CORS cannot change, use Capacitor's native HTTP option for those calls as a last resort.
- Auth: prefer token headers over cookies (WebView cookie behavior differs). Keep tokens in secure storage on native.
- Large data: avoid very large base64 strings in memory. Write files in chunks and cap PDF and image sizes.
- Android storage: write to app directories (cache, documents). Do not depend on broad storage permissions. Saving to shared folders goes through the share sheet or a system file saver.
- Android 13 and later: notifications need a runtime permission. Android 15 and 16 enforce edge-to-edge, so test insets (file 03).
- Devices without Google Play Services: push and Google sign-in fail gracefully with a message and an alternative login.
- Unhandled promise rejections are bugs. Every bridge call runs inside the wrapper's guarded call.

## 6. Runtime detection and workflow
- Only the wrapper detects the runtime (Capacitor's platform check). Never use user agent sniffing and never detect in screens.
- Develop UI in the browser for speed. Before calling any native-dependent feature done, run it in the Android app. Use remote inspection for the WebView console and the device log for native errors.

## 7. Verification matrix for native features
- Android 15 and 16, gesture and 3-button navigation, mobile browser, desktop browser.
- States: first run, permission allowed, denied, denied permanently, revoked while the app is in the background, offline then online, app killed and restarted, rotation, low memory, slow network, no Play Services.
- Check the result is real (open the exported file, the notification arrives), the UI state matches reality, and there are no console errors or unhandled rejections.

## 8. Custom plugin (any language), last resort
- Use only when no official or community plugin fits, or the suitable one is unmaintained. Examples: read the system accent color, save to a shared Downloads folder, a platform-specific intent.
- Write a minimal Capacitor plugin: Kotlin for Android, a TypeScript definition and a web implementation.
- One method per need, JSON in and out, rejection with a stable error code, heavy work on a background thread. Ask for permissions inside the plugin only if needed.
- Keep it local to the project, register it as Capacitor documents, and expose it only through the wrapper with a capability flag.
- State why a custom plugin was needed in the report, and keep the native code small.

## 9. Reporting
List the capabilities added or changed, packages with versions, native edits, external configuration still required, tests run on Android and in the browser, and remaining risks.
