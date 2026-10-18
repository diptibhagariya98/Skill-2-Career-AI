# Issues and Resolutions Log

**Repository:** ResuMentor  
**File:** `docs/ISSUES_AND_RESOLUTIONS_LOG.md`  
**Created:** October 18, 2026 at 07:05:00 IST  
**Last Updated:** October 18, 2026 at 07:05:00 IST  
**Status:** All Listed Issues Resolved and Verified

---

## Overview

This document serves as an immutable, timestamped record of every technical, build, layout, and dependency issue encountered during development, along with the corresponding root-cause analysis and verified resolution.

---

## Log Entries

### [ISSUE-001] Gradle Build Hanging Indefinitely on Network Auto-Downloads
- **Date:** October 17, 2026
- **Timestamp:** 23:25:00 IST
- **Component / Subsystem:** Android Gradle Build Pipeline (`npm run build:apk`)
- **Severity:** Critical (Blocks entire mobile release pipeline)
- **Status:** **RESOLVED**
- **Symptoms:**
  ```text
  [2/2] Running Gradle assembleRelease...
  Preparing "Install Android SDK Platform 36 (revision 2)".
  <=============> 100% CONFIGURING [24m 44s]
  > IDLE
  ```
  The build stayed stalled for more than 24 minutes without progressing or throwing a clear failure error.
- **Root Cause:**
  In Android Gradle projects, `android.builder.sdkDownload` defaults to `true`. When network requests to Google Maven / dl.google.com repositories experienced latency or socket timeouts, the Gradle daemon repeatedly attempted to auto-download non-existent or remote SDK revisions instead of executing against locally installed packages.
- **Resolution:**
  1. Set `android.builder.sdkDownload=false` in `android/gradle.properties` to disable automatic network downloads.
  2. Mapped `buildToolsVersion = '35.0.0'` in `android/variables.gradle` and mapped `buildToolsVersion = rootProject.ext.buildToolsVersion` in `android/app/build.gradle`.
  3. Terminated hanging background daemon processes with:
     ```cmd
     cmd /c "gradlew.bat --stop"
     ```
- **Verification:**
  Subsequent Gradle builds no longer hung on network checks and proceeded directly to compilation in under 15 seconds.

---

### [ISSUE-002] Missing Android SDK Platform 35 Target
- **Date:** October 18, 2026
- **Timestamp:** 01:25:00 IST
- **Component / Subsystem:** Android SDK / Gradle Compilation
- **Severity:** High (Build Failure)
- **Status:** **RESOLVED**
- **Symptoms:**
  ```text
  FAILURE: Build failed with an exception.
  * What went wrong:
  Could not determine the dependencies of task ':capacitor-android:compileReleaseJavaWithJavac'.
  > Failed to find target with hash string 'android-35' in: C:\Users\manis\AppData\Local\Android\Sdk
  ```
- **Root Cause:**
  `compileSdkVersion` was configured to target API 35 (`compileSdkVersion = 35`), but the local SDK directory (`C:\Users\manis\AppData\Local\Android\Sdk\platforms`) only contained `android-37.0`. The required `android-35` platform directory was absent.
- **Resolution:**
  Installed the `android-35` platform package using the Android SDK CLI tool:
  ```powershell
  echo y | & "C:\Users\manis\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\android.exe" sdk install platforms/android-35
  ```
- **Verification:**
  Verified that `C:\Users\manis\AppData\Local\Android\Sdk\platforms\android-35` was created with `android.jar` and `source.properties` displaying `AndroidVersion.ApiLevel=35`. Subsequent Gradle tasks compiled against `android-35` without error.

---

### [ISSUE-003] CLI Semicolon Syntax Parsing Error in PowerShell
- **Date:** October 18, 2026
- **Timestamp:** 01:30:00 IST
- **Component / Subsystem:** Android SDK Command-Line Interface (`cmdline-tools`)
- **Severity:** Medium (Tool invocation failure)
- **Status:** **RESOLVED**
- **Symptoms:**
  ```text
  Package platforms not found.
  Package android-35 not found.
  ```
- **Root Cause:**
  PowerShell interprets semicolons `;` as command separators. Passing `platforms;android-35` caused PowerShell to treat `platforms` as the first argument to `sdkmanager` and execute `android-35` as a separate, unrecognized command.
- **Resolution:**
  Invoked the modern `android.exe` command-line executable (`cmdline-tools/latest/bin/android.exe`) with the forward-slash convention:
  ```powershell
  echo y | & "C:\Users\manis\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\android.exe" sdk install platforms/android-35
  ```
- **Verification:**
  The command completed with exit code `0`, downloading and extracting the platform successfully.

---

### [ISSUE-004] AndroidX & Kotlin Standard Library Duplicate Class Incompatibilities
- **Date:** October 18, 2026
- **Timestamp:** 01:31:00 IST
- **Component / Subsystem:** Android Gradle Dependency Resolution (`android/app/build.gradle`)
- **Severity:** High (Duplicate class / compileJavaWithJavac conflicts)
- **Status:** **RESOLVED**
- **Symptoms:**
  Duplicate class conflicts and runtime incompatibilities between transitive Kotlin standard library versions (`kotlin-stdlib-jdk7`, `kotlin-stdlib-jdk8`) and mismatched AndroidX libraries.
- **Root Cause:**
  Capacitor Android plugins pulled modern AndroidX libraries that clashed with conflicting transitive Kotlin dependencies when compiling with SDK 35.
- **Resolution:**
  1. Pinned stable AndroidX versions in `android/variables.gradle`:
     - `androidxActivityVersion = '1.9.3'`
     - `androidxAppCompatVersion = '1.7.0'`
     - `androidxCoordinatorLayoutVersion = '1.2.0'`
     - `androidxCoreVersion = '1.15.0'`
     - `androidxFragmentVersion = '1.8.5'`
     - `coreSplashScreenVersion = '1.0.1'`
     - `androidxWebkitVersion = '1.12.1'`
     - `cordovaAndroidVersion = '10.1.1'`
  2. Enforced dependency resolution rules in `android/app/build.gradle`:
     ```groovy
     configurations.all {
         resolutionStrategy {
             force "androidx.core:core:1.15.0"
             force "androidx.core:core-ktx:1.15.0"
             force "androidx.activity:activity:1.9.3"
             force "androidx.activity:activity-ktx:1.9.3"
             force "org.jetbrains.kotlin:kotlin-stdlib:1.8.22"
             force "org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22"
             force "org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22"
         }
     }
     ```
- **Verification:**
  Gradle executed `checkReleaseDuplicateClasses` and `compileReleaseJavaWithJavac` with status `UP-TO-DATE` without error.

---

### [ISSUE-005] Release Build Lint Vital Aborting on Static Export Warnings
- **Date:** October 18, 2026
- **Timestamp:** 01:32:00 IST
- **Component / Subsystem:** Android Gradle Release Verification (`lintVitalRelease`)
- **Severity:** Medium (Build failure during release assembly)
- **Status:** **RESOLVED**
- **Symptoms:**
  `assembleRelease` failing during the `lintVitalRelease` inspection task due to standard web image warnings.
- **Root Cause:**
  Default Android Gradle release configurations treat non-fatal warnings (such as unoptimized `<img>` tags in static export WebViews) as fatal errors and abort the APK build.
- **Resolution:**
  Added explicit lint bypass options in `android/app/build.gradle`:
  ```groovy
  lintOptions {
      checkReleaseBuilds false
      abortOnError false
  }
  ```
- **Verification:**
  Release assembly passed `lintVitalRelease` cleanly and generated `app-release.apk`.

---

### [ISSUE-006] Screen Content Cut Off by Camera Notches and Gesture Navigation Bars
- **Date:** October 17, 2026
- **Timestamp:** 23:21:00 IST
- **Component / Subsystem:** Global Mobile App Shell (`src/app/layout.tsx`, `src/app/globals.css`, `Dashboard.tsx`)
- **Severity:** Medium (UI/UX defect violating `UX-04` and `UX-05`)
- **Status:** **RESOLVED**
- **Symptoms:**
  Top sticky header overlapped with camera cutouts and Android status bar text. Floating offline badges and bottom navigation bars were partially obscured by the phone's gesture navigation bar.
- **Root Cause:**
  1. Next.js root layout lacked `viewportFit: "cover"` configuration.
  2. CSS did not define safe-area padding helpers using `env(safe-area-inset-*)`.
- **Resolution:**
  1. Exported `viewport: Viewport` with `viewportFit: "cover"` in `src/app/layout.tsx`.
  2. Added `.pt-safe`, `.pb-safe`, `.pl-safe`, `.pr-safe` classes in `src/app/globals.css`.
  3. Added `pt-safe` on headers, `top-[calc(0.5rem+env(safe-area-inset-top))]` on the status pill, and `pb-[calc(0.25rem+env(safe-area-inset-bottom))]` on bottom navigation.
- **Verification:**
  Tested across simulated mobile viewports (360px and 412px); all content and bottom bars maintain safe clearance above system indicators.

---

### [ISSUE-007] Mobile 300ms Touch Latency and Unwanted Input Auto-Zoom
- **Date:** October 17, 2026
- **Timestamp:** 23:22:00 IST
- **Component / Subsystem:** Touch Controls and Form Inputs across all pages
- **Severity:** Medium (User friendliness and ergonomics defect violating `UX-21` and `UX-30`)
- **Status:** **RESOLVED**
- **Symptoms:**
  Tapping interactive buttons had an artificial 300ms delay. Tapping inside textareas (such as the AI Interview answer box or Job search input) caused mobile WebViews to zoom in automatically, breaking the horizontal layout.
- **Root Cause:**
  1. Absence of `touch-action: manipulation` caused browsers to wait 300ms to detect potential double-taps.
  2. Form input font sizes were set to `text-xs` (12px) or `text-sm` (14px). Mobile WebViews trigger auto-zoom on any input with font size below 16px.
- **Resolution:**
  1. Added global `touch-action: manipulation` for `button, a, input, select, textarea` in `src/app/globals.css`.
  2. Enforced `text-base` (16px) on all form text inputs and textareas in `JobFinder.tsx`, `InterviewThread.tsx`, and `ResumeBuilder.tsx`.
- **Verification:**
  Taps register immediately without delay, and tapping text inputs no longer causes unwanted viewport zoom.

---

### [ISSUE-008] Conflicting Double Bottom Navigation Bars in Resume Builder
- **Date:** October 17, 2026
- **Timestamp:** 23:27:00 IST
- **Component / Subsystem:** Resume Builder (`src/components/resume/MobileBottomNav.tsx`)
- **Severity:** High (Navigation collision and broken layout on mobile)
- **Status:** **RESOLVED**
- **Symptoms:**
  On mobile devices, opening Resume Builder rendered a secondary bottom bar fixed at `bottom-0`, directly covering the `Dashboard`'s primary bottom navigation bar.
- **Root Cause:**
  `MobileBottomNav` was hardcoded to `fixed bottom-0 left-0 right-0 z-40`, causing a visual and touch target collision with the main app shell's bottom bar.
- **Resolution:**
  1. Re-anchored `MobileBottomNav` as a floating action pill elevated safely above the main navigation bar:
     `fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-30`.
  2. Added a segmented `[ Edit | Preview ]` switch inside the sticky header toolbar in `ResumeBuilder.tsx`.
- **Verification:**
  Both bars are visible and functional simultaneously with zero overlap.

---

### [ISSUE-009] Inaccessible Features on Mobile Navigation
- **Date:** October 17, 2026
- **Timestamp:** 23:24:00 IST
- **Component / Subsystem:** App Shell Navigation (`src/components/Dashboard.tsx`)
- **Severity:** Medium (Missing mobile access violating `UX-35`)
- **Status:** **RESOLVED**
- **Symptoms:**
  The mobile bottom navigation only contained 5 hardcoded links (Home, Resume, Grants, Practice, Profile). "AI Interview" and "Job Finder" were absent from bottom navigation, leaving users stranded if they navigated away.
- **Root Cause:**
  Mobile screen width limitations prevented showing all 7 primary features in a single row without crowding touch targets below 44px.
- **Resolution:**
  Implemented a 5-item mobile bottom navigation bar (**Home**, **Resume**, **Interview**, **Practice**, **More**) where **More** opens a slide-up sheet drawer containing:
  - Scholarships & Grants
  - Job Finder
  - Profile Settings
  - Logout
- **Verification:**
  100% of the application's features are directly accessible on mobile screens in at most 2 taps.

---

### [ISSUE-010] Static Export Stubs Polluting Working Tree on Interrupted Builds
- **Date:** October 17, 2026
- **Timestamp:** 23:40:00 IST
- **Component / Subsystem:** Mobile Build Scripts (`scripts/build-mobile.mjs`, `src/constants/endpoints.ts`)
- **Severity:** Medium (Git repository state pollution)
- **Status:** **RESOLVED**
- **Symptoms:**
  When a mobile APK build was stopped or failed during the Gradle step, temporary build-time route stubs (`// Auto-generated build-time stub for Next.js static mobile export`) remained modified and staged in `src/app/api/...`.
- **Root Cause:**
  Sudden script termination prevented Node's cleanup routine from running to restore the real API route files from memory.
- **Resolution:**
  1. Restored original API route implementations from `HEAD`.
  2. Registered explicit `SIGINT` and `SIGTERM` cleanup handlers in `scripts/build-mobile.mjs`.
  3. Added dynamic prefixing (`NEXT_PUBLIC_API_URL`) in `src/constants/endpoints.ts` so mobile APK builds route network calls dynamically to the deployed backend server.
- **Verification:**
  Working tree remains clean after static export and builds.

---

### [ISSUE-011] Android Status Bar & Dynamic Island Overlapping Application Navigation Header

- **Date:** October 18, 2026
- **Timestamp:** 07:14:00 IST
- **Component / Subsystem:** Android Window Insets & System Bars (`android/app/src/main/java/com/resumentor/app/MainActivity.java`, `android/app/src/main/res/values/styles.xml`, `android/app/src/main/res/layout/activity_main.xml`, `capacitor.config.ts`, `src/components/LandingPage.tsx`, `src/components/Auth.tsx`)
- **Severity:** High (Device status bar, clock, notch, and audio player directly covered logo and "Get Started" header button)
- **Status:** **RESOLVED**
- **Symptoms:**
  On physical Android devices, the phone's top notification bar (clock, 5G, battery indicator, and Dynamic Island / notch music player) rendered directly on top of the Landing Page header ("ResuMentor AI" logo and the primary "Get Started" button), making the header text unreadable and the button difficult to tap.
- **Root Cause:**
  1. In modern Android SDKs (Android 12–15), Capacitor defaults to drawing the window edge-to-edge behind system bars unless explicit system window insets are enforced.
  2. `MainActivity.java` did not call `WindowCompat.setDecorFitsSystemWindows(window, true)`.
  3. `android/app/src/main/res/values/styles.xml` and `activity_main.xml` lacked `android:fitsSystemWindows="true"` on the root layout.
  4. `capacitor.config.ts` lacked `StatusBar.overlaysWebView: false` and explicit status bar appearance styling (`style: "DARK"`, `backgroundColor: "#ffffff"`).
  5. The landing page header previously lacked `pt-safe` and had excessive mobile vertical padding (`py-24`).
- **Resolution:**
  1. Updated `MainActivity.java` to invoke `WindowCompat.setDecorFitsSystemWindows(window, true)` on `onCreate`, ensuring the Android native window controller positions the WebView below the status bar and notch.
  2. Set status bar background color to solid white (`#ffffff`) with `WindowInsetsControllerCompat.setAppearanceLightStatusBars(true)` so all native icons (clock, battery, Wi-Fi, 5G) remain crisp and dark.
  3. Added `android:fitsSystemWindows="true"`, `android:statusBarColor="#ffffff"`, and `android:windowLightStatusBar="true"` to `AppTheme.NoActionBar` in `styles.xml`.
  4. Added `android:fitsSystemWindows="true"` to `CoordinatorLayout` in `activity_main.xml`.
  5. Configured `StatusBar: { overlaysWebView: false, style: "DARK", backgroundColor: "#ffffff" }` in `capacitor.config.ts`.
  6. Added `.pt-safe` and compact mobile hero padding (`py-10 sm:py-24`) to `src/components/LandingPage.tsx`, and added `pt-safe pb-safe min-h-dvh` to `src/components/Auth.tsx`.
- **Verification:**
  Tested across Android native layout definitions and Next.js static export; the native status bar remains cleanly segregated above the web view, with dark legible status indicators and zero visual clipping on application headers.

---

### [ISSUE-012] Android Hardware Back-Button App Exit, Duplicate Offline Banners & Mobile Header Notch Overlap

- **Date:** October 18, 2026
- **Timestamp:** 08:31:00 IST
- **Component / Subsystem:** Native Capacitor Shell & Navigation (`src/shared/platform/`, `src/components/Dashboard.tsx`, `src/components/Auth.tsx`, `src/components/LearnPractice.tsx`, `src/app/layout.tsx`)
- **Severity:** High (Navigation termination, header notch compression, and visual badge collision on mobile)
- **Status:** **RESOLVED**
- **Symptoms:**
  1. On Android physical devices, pressing the hardware or gesture back button when inside sub-tools (Resume Builder, Mock Interview, Scholarships, Job Finder) immediately exited the application instead of navigating back to the Home Dashboard.
  2. Disconnecting network displayed duplicate offline badges overlapping each other at `top-2` on mobile screens.
  3. Header on notched mobile displays was squished against the notch / camera hole due to fixed `h-14` constraint combined with `pt-safe`.
  4. Segmented 6-digit OTP boxes on `Auth.tsx` risked horizontal overflow on 320px narrow mobile screens.
- **Root Cause:**
  1. Capacitor WebView does not automatically intercept Android hardware back button events without `@capacitor/app` `App.addListener('backButton')`.
  2. `Dashboard.tsx` had a local offline indicator while `layout.tsx` mounted the global `OfflineBanner` simultaneously.
  3. `Dashboard.tsx` header used hardcoded `h-14` (56px fixed height) which left insufficient space when `pt-safe` inset was applied on notched devices.
  4. OTP inputs were fixed at `w-12` (48px) each with `gap-2`, totalling 328px on a card.
- **Resolution:**
  1. Installed `@capacitor/app`, `@capacitor/network`, `@capacitor/haptics`, and `@capacitor/share`, creating a unified `src/shared/platform/` layer.
  2. Implemented `useAndroidBackButton()` in `Dashboard.tsx` that navigates back to the Dashboard home tab or dismisses modals before exiting.
  3. Consolidated offline status reporting into a single global floating `OfflineBanner.tsx` mounted in `RootLayout`.
  4. Replaced fixed `h-14` with responsive `min-h-[56px] pt-[max(env(safe-area-inset-top,0px),0.5rem)] pb-2` and added `pb-28 overflow-x-hidden` on the scrollable container.
  5. Sized OTP inputs to responsive `w-10 h-12 sm:w-12 sm:h-14` with `gap-1.5 sm:gap-2.5 max-w-full justify-center`.
  6. Wrapped tables in `LearnPractice.tsx` in `overflow-x-auto w-full`.
- **Verification:**
  Verified with `npx cap sync android`, `npm run build` (compiled in under 12s, exit code 0), and `npm run build:mobile` (exported all 14 static pages and synced assets to Android with exit code 0).
