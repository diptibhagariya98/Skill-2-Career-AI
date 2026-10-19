---
trigger: always_on
description: Native gap audit for the Capacitor app and its browser build. Finds features that fail, do nothing or fake success because a native plugin, package, permission or configuration is missing (export, download, and more Run with file 05 on every audit.
---

# Native Gap Audit

Find every feature that will fail, silently do nothing or fake success in the Android app (or in the browser) because a native plugin, package, permission or configuration is missing. Run it inside file 05 (lens M) on every audit, after every new feature and before every release. Fix with the protocol in file 08 and the recipes in file 09.

## 1. Rules of the audit
- Assume a web-only API is broken in the native app until proven working there. Untested means failed.
- Severity: a feature that silently does nothing or shows success without a result is Critical. A feature that works in only one runtime is High. A missing browser fallback is High. A plugin that is installed but not wired is High.
- Missing external configuration (credentials, push config file, signing fingerprints, domain verification) is Blocked. Name the exact item.
- Keep two kinds of evidence apart: static verified (code scan, config check, build, sync) and device verified (ran on Android). Never call something verified if it was only checked statically. If no device is available, list the manual test steps instead.

## 2. Pass A: feature inventory
List every feature that touches the device, the OS, files, the network edge or a privileged browser API. Search UI text, routes and handlers for these triggers: export, download, save, print, share, copy, upload, attach, pick, camera, scan, voice, speak, record, link, open, call, email, WhatsApp, map, notify, remind, login, Google, biometric, pay, location, contacts, calendar, offline, sync, back, rotate, vibrate.
In this app expect at least: resume PDF export, roadmap PDF download, share, external job and scholarship links, WhatsApp group links, copy actions, Google sign-in, voice or spoken interview features if present, reminders and push, photo or file upload and resume import, offline drafts, back button and keyboard.
Create one matrix row per feature (section 6).

## 3. Pass B: code scan for web-only patterns
Search the source for each pattern. Every hit is a finding unless it already goes through the platform wrapper with a fallback.

| Pattern | Why it fails in the Android app | Use instead (via wrapper) | Browser fallback |
|---|---|---|---|
| `<a download>`, Blob URL plus click, `saveAs`, PDF library `.save()`, `window.open(blobUrl)` | WebView downloads do nothing or open blank | filesystem write plus share, file opener | Blob download |
| `window.print()` | no dialog or blank output | export PDF plus share | print dialog |
| `window.open`, `target="_blank"`, `location.href` to an external URL | replaces the app view with no way back, or does nothing | in-app browser plugin | new tab |
| `mailto:`, `tel:`, `sms:`, `whatsapp:`, `intent:` links | inconsistent handling, dead end with no handler | app launcher with a can-open check, https equivalents | normal link |
| `navigator.share` | missing or limited in the WebView | share plugin | Web Share, else copy link |
| `navigator.clipboard` | needs focus and secure context, can reject | clipboard plugin | Clipboard API |
| `navigator.vibrate` | unreliable | haptics plugin | no-op |
| `localStorage` for tokens, drafts, large data | clearable by the OS, not secure | secure storage, preferences, database | local storage for non-secrets |
| file input with `capture`, `getUserMedia` for camera or microphone | WebView permission not granted, results lost on recreate | camera or picker plugin, permission flow | file input, `getUserMedia` |
| `SpeechRecognition`, `speechSynthesis` | unsupported or unreliable in the WebView | speech recognition and text-to-speech community plugins (verify) | browser APIs where supported |
| `Notification`, service worker push | not available in the WebView | push and local notification plugins | hide the setting |
| `navigator.geolocation` | permission handling differs | geolocation plugin | browser API |
| `navigator.onLine` alone | unreliable | network plugin | online and offline events |
| cookies for auth | cookie behavior differs in the WebView | token header plus secure storage | cookies are fine |
| `history.back()` or `popstate` only | Android back exits the app | app plugin back handler | history |
| `alert`, `confirm`, `prompt` | blocked or ugly | dialog plugin or app dialog | app dialog |
| `screen.orientation.lock`, wake lock | unsupported in the WebView | orientation and keep-awake plugins (verify) | feature detection |
| CDN fonts, icons, scripts, images | fail offline and load slowly | bundled assets | bundled assets |
| `<a href="file.pdf">`, iframe or embed PDF | the Android WebView cannot render PDFs | share or file opener | new tab |
| WebAuthn, Payment Request | unsupported | biometric plugin, store billing | feature detection |
| `fetch` to `http://` or to a server without the app origin in CORS | cleartext blocked, CORS error | HTTPS, allow the app origin, native HTTP as last resort | same |

## 4. Pass C: setup and configuration scan
These fail even when the code is right:
- A plugin is imported but missing from the package manifest, or is in the manifest but the sync step was not run after the change.
- The plugin major version does not match the Capacitor core major version.
- A required Android permission or declaration is missing (notifications, microphone, camera, location, queries for external apps). Add only the documented lines.
- Missing config files or registrations: push config, sign-in client IDs, signing fingerprints (debug and release differ), the domain verification file for app links.
- The web directory in the Capacitor config does not point at the static export output, or exported assets use the wrong base path.
- The backend does not allow the app origin in CORS, an endpoint uses cleartext HTTP, or mixed content is blocked.
- External domains are blocked by a navigation allow list, if one is configured.
- Works in a debug build but fails in release: shrinking removes plugin classes, release signing differs, release-only config is missing. Always test a release build.
- Features that need Google Play Services were not tested on a device without them.

## 5. Edge cases by feature
**Export and download**
- The result must exist: file written, size above 0, valid format header. Cache cleanup can delete a file before the user opens it, so keep Open working by regenerating, or save to documents when the user chose Save.
- Non-Latin text (Gujarati, Hindi and other scripts): the PDF font must embed the glyphs or you get boxes and blanks. Test names and addresses in those scripts.
- Large or multi-page output: memory limits, chunked writes, page breaks, progress.
- Low storage, write denied, app backgrounded mid-export, duplicate taps, same filename twice, offline export (client-side generation must still work), regenerate after edits.
- A PDF cannot be previewed in the WebView. Open it with the system viewer or share it.

**Transfers (upload, download, sync)**
- JavaScript is paused when the app is in the background, so long transfers stop. Show foreground progress with retry and resume, or use a native background transfer plugin for large files.
- Network switch (Wi-Fi to mobile data), timeouts, server size limits (413), CORS preflight, retries only when idempotent, cancel, compression before upload, partial files cleaned up.

**Share and links**
- A cancelled share is not an error. Handle no available targets and long text.
- Validate URLs before opening. Never open empty or placeholder values (such as "https://none"). External pages open in the in-app browser with a way back. Custom schemes (WhatsApp, mail, phone, maps) go through the app launcher or an https equivalent, with a fallback when no app handles them.

**Sign-in**
- Google blocks sign-in inside an embedded WebView. Use a native sign-in plugin or the system browser flow, never an in-WebView redirect.
- Handle return from the external flow, token storage and refresh, cancel, and no Play Services.

**Voice, camera and files**
- The Android WebView has no browser speech recognition. Recording and speech need native plugins plus the microphone permission, and a typed-answer fallback.
- Camera and picker results can be lost if the activity is recreated. File inputs have size, type and restored-result edge cases.

**Notifications and reminders**
- Android 13 and later need a runtime permission. Create channels. Battery optimization and restricted exact alarms can delay reminders, so prefer inexact scheduling and say so in the UI.

**Timers and lifecycle**
- JavaScript timers pause in the background. Compute elapsed time from timestamps (interview timers), reconnect sockets on resume, and revalidate data.

**Storage and payments**
- Web storage can be cleared, so keep secrets in secure storage and migrate schemas. Logout wipes user data.
- Digital goods sold inside the app are subject to store billing rules and need a billing integration. Mark it Needs decision and never ship a web payment link silently.

## 6. Native feature matrix (required output)
One row per feature with these columns: Feature, Screens, Capability needed, Current implementation (web API, plugin or none), Android result, Browser result, Gap, Fix, Status.
- Results are one of: works (device verified), works (static only), fails, untested.
- Example row: Resume export, Resume editor, file write plus share, Blob download, fails (download does nothing), works (static only), Critical, file write plus share per file 09, Fixed.

## 7. Fix procedure
1. Route the feature through the platform wrapper (file 08, section 3).
2. Install any missing package or plugin with the install protocol (file 08, section 2).
3. Add the capability flag and the web fallback.
4. Add the states and messages from file 09 (progress, success only when real, error with Retry, cancel).
5. Rescan with section 3 until there are no hits.
6. Run the verification matrix (file 08, section 7) and a release build.
7. Update the matrix row and the capability table.

## 8. Acceptance
- Every inventoried feature has a row.
- Zero Critical or High gaps remain.
- Blocked items list the exact missing item.
- Each row says device verified or lists the manual test steps.

## 9. Report
Counts by severity, the matrix, packages and plugins added, native edits, configuration still needed, and the device test steps that remain.