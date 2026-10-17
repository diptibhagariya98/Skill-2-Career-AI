Making ResuMentor a True Mobile Application (Android & iOS)

To practically, technically, and legally be a **real mobile application** (compiled into a genuine `.apk` / `.aab` package for Android and `.ipa` for iOS, installable on mobile phones and publishable to Google Play and Apple App Store), the industry standard solution for Next.js/React is **Capacitor** (by Ionic).

#### How it works:
1. **Native Mobile Shell**: Capacitor embeds your existing Next.js application into a native Android (Java/Kotlin) and iOS (Swift) project.
2. **Genuine Mobile App Output**: It generates a standard `android/` project containing `AndroidManifest.xml`, Gradle scripts, app icons, splash screens, and generates an installable `.apk` file that can be side-loaded onto any phone or published to the Google Play Store.
3. **Native Device Hardware Access**: Enables native camera, biometric auth, push notifications, and offline storage.
4. **Zero Code Duplication**: Your existing React/TypeScript components, Firebase Auth, and UI remain 100% shared.

---

### Implementation Plan

1. **Install Capacitor Dependencies**:
   - `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
2. **Configuration (`capacitor.config.ts`)**:
   - Set App ID (`com.resumentor.app`), App Name (`ResuMentor`), and asset configuration.
3. **Mobile Build Script**:
   - Add automated npm scripts (`build:mobile`, `cap:sync`, `cap:android`).
4. **Generate Android Project**:
   - Run `npx cap add android` to generate the native Android Studio project with all manifests and Gradle configurations.

