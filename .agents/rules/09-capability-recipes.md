---
trigger: model_decision
description: Capability recipes built on file 08: file export and share (PDF), storage, permissions, push, sign-in, camera and files, connectivity, deep links, and a symptom-to-fix table for common native failures
---

# Capability Recipes

Each recipe works in the Android app and in the browser, through the platform wrapper (file 08).

## 1. Export, download and share a file (for example a resume PDF)
Generation:
- Build a real PDF with selectable text (required for ATS). Never export an image of the preview. Embed fonts. Respect the chosen page size (A4 or Letter) and margins. Single-column layout.
- Check the data first: required fields present, empty fields omitted, no placeholder values ("https://none", "undefined", guest or test data) in the file, separators only between non-empty parts.
- If the server generates it: send the auth token header, request binary data, require status 200 and `application/pdf`, never parse it as JSON, and handle 401, 413, server errors and timeouts with a clear message.
- File name: remove `' " / \ : * ? < > |` and control characters, replace spaces with underscores, keep the extension, limit to 80 characters (`Max's Resume` becomes `Max_Resume.pdf`).

Android app:
1. Write the bytes to the app cache directory with the filesystem plugin (in chunks for large files).
2. Verify the file exists, its size is above 0 and it starts with `%PDF`.
3. Open the share sheet with the file's URI (the user can save, send or open). If a save-to-folder plugin is installed, also offer "Save to device".
4. Success only after the file is verified and shared or saved. A closed share sheet is `cancelled`, not an error, and shows no error message.

Browser:
- Create a Blob and a temporary object URL and trigger a download from the user's click. Revoke the URL after about a minute. Where Web Share with files is supported (most mobile browsers), prefer it. If a popup blocker or an unsupported browser stops the download, open the PDF in a new tab with a clear note.
- Do not call print as an export. Do not rely on `window.open` after an async gap without a fallback.

State flow and UI:
- idle (button "Export") → preparing (spinner in the button, disabled, determinate progress if known) → saving or sharing → success (snackbar "Saved as Max_Resume.pdf" with Open and Share) → idle. Or error (snackbar with the reason and Retry), or cancelled (back to idle quietly).
- Any content edit after a successful export returns the button to "Export". Never leave a past-tense label such as "Exported" on the button.
- Ignore a second tap while busy. Time out preparation after about 30 s with a message.
- Tests: export on Android and open the file on the device (text selectable), export in the mobile and desktop browsers, empty optional fields, long names, offline (client-generated export still works).

## 2. Storage
- Tokens and secrets: secure storage on native. Settings and small caches: preferences on native, local storage on the web. Drafts: autosave locally (debounced) and sync to the server.
- Large offline data: the SQLite plugin on native and IndexedDB on the web, behind one data-access layer. Version the schema and migrate, never wipe on upgrade.
- Treat all local storage as clearable by the OS or the user. Recover from empty storage by refetching.
- Logout clears the user's tokens, caches and drafts. Never put secrets in plain web storage on native.

## 3. Permissions
- Ask in context, just before the feature needs it, after a short reason (a sheet or dialog). Never ask at launch.
- Flow: check, then rationale, then request. Granted: continue. Denied: explain and offer Retry. Denied permanently: explain and offer "Open settings".
- Recheck permissions when the app returns to the foreground.
- Prefer system pickers that need no permission (photo picker, document picker, share sheet).
- Notifications on Android 13 and later need a runtime permission.
- In the browser use the browser's prompts and show the same denied states.

## 4. Push notifications
- Needs the app's Firebase config file in the Android project. If it is missing, mark Blocked with that exact item.
- Flow: ask permission in context, register, send the token to the backend, and handle foreground (in-app banner), tap (deep link to the right screen with a valid back stack) and token refresh.
- Create the notification channel on Android. Hide the setting in browsers where it is unsupported.
- Test: foreground, background, app killed, permission denied, no Play Services.

## 5. Sign-in
- Social sign-in through a maintained native plugin on Android and a web OAuth redirect in browsers. Both end in the same token flow.
- It needs external configuration (client IDs, signing fingerprints). If missing, mark Blocked with the exact item.
- Cancel is quiet. Network, missing Play Services and misconfiguration show plain messages and an email login alternative.
- Tokens go to secure storage. Returning from the external flow lands on the right screen.

## 6. Camera, gallery and files
- Use system pickers. Limit type and size, compress images before upload, show progress, allow cancel.
- Handle the activity being recreated by restoring pending plugin results at startup.
- Browser: a file input with `accept` (and `capture` where wanted). Validate on the client and the server with clear errors.

## 7. Connectivity
- The network plugin and online or offline events drive an offline snackbar and disable only network-dependent actions.
- Use timeouts, and retries with backoff for safe requests only. Show Retry on failure.
- Queue safe writes (drafts, saves) when offline if the project supports it. Otherwise explain clearly.

## 8. Deep links and external links
- Internal navigation never leaves the app. External links open in the in-app browser on native and a new tab in the browser.
- App links need intent filters in the Android project and a verified domain file on the server. If missing, mark Blocked with the exact item. Route the URL to the screen with a valid back stack.

## 9. Common failures: symptom, likely cause, fix
| Symptom | Likely cause | Fix |
|---|---|---|
| Works in the browser, nothing in the app | plugin not installed or not synced, called before ready, CORS, cleartext | install per file 08, sync, await wrapper init, allow the app origin, use HTTPS |
| "Plugin not implemented" | missing sync, wrong platform, no web fallback | sync, add a fallback, check `has()` |
| Download does nothing in the app | blob or anchor download in the WebView | write the file and open the share sheet (section 1) |
| File saved but cannot open | wrong directory or URI, empty file, wrong type | verify size and header, use the URI the plugin returns |
| White screen at launch | JS error, wrong asset path in the static export, plugin version mismatch | remote console, check the export output, align plugin versions |
| Keyboard covers the input | resize mode, input outside the scroller | file 03, section 6 |
| Back exits the app | no central handler | file 03, section 3 |
| Content under the status bar | no inset variables | file 03, section 1 |
| Sign-in fails with a network error | no connectivity check, missing config, no Play Services | check network and config, offer a fallback |
| No push token | permission, missing Firebase file, no Play Services | section 4 |
| Camera result lost | activity recreated | restore the pending result |
| Data missing after restart | storage cleared or never persisted | refetch, persist drafts, secure storage |
| Build fails after a plugin install | version mismatch or missing sync | match the Capacitor major, sync, clean build |

## 10. Done check
- Works on Android 15 and 16 and in the mobile and desktop browsers.
- Success states are honest and failure states are visible.
- Denied, offline and cancel paths are tested.
- The report lists packages, native edits and external configuration still required.
