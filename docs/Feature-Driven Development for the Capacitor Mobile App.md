# Feature-Driven Development for the Capacitor Mobile App

Oct 18, 2026 · @manish

## 1. Overview and assumptions

This spec organizes the mobile app as independent features, each owning its screens, state, local data and background work, and it states what the app, the workers and the backend are each responsible for in every feature.

**How the request was read**

- "Feature-driven development" is used in two ways: as a delivery process (define features, plan, design and build one feature at a time) and as a code structure (one folder per feature with strict boundaries).
- "Worker" means background workers: work that runs off the main thread, in the background, or on the server. If you meant team roles instead, tell me and section 8 will be reworked.
- The app is taken to be ResuMentor: an offline-first Android app that packages a Next.js static export with Capacitor, with resume building, PDF export, quizzes and scholarship matching. Swap the feature rows in section 10 if this is a different app.

**Stack assumed**

| Layer | Choice | Note |
| --- | --- | --- |
| Shell | Capacitor 8 | Version 8.4.1 was the latest core release when this was written |
| UI | Next.js with `output: 'export'`, Tailwind CSS | Static files bundled inside the app, so screens work offline |
| Local data | SQLite through a Capacitor plugin, or IndexedDB | Decision in section 14 |
| Workers | Web Workers, a sync queue, optional Background Runner | See section 9 |
| Backend | NestJS API | Used for sync, content updates and push |
| Distribution | Android APK | Deployment planning covers the server side only |

**Principles**

| Principle | What it means in practice |
| --- | --- |
| One feature, one folder | A feature owns its UI, state, data access, worker tasks, tests and routes |
| No cross-feature imports | Features talk through shared modules or events, never through each other's files |
| No hidden redirects | Only the navigation layer changes routes; feature code asks it to |
| Local first | Every feature works with no network and syncs when one appears |
| Heavy work off the main thread | PDF creation, matching and parsing run in Web Workers |
| Friendly failures | Users see plain-language messages; technical detail goes to logs |
| Old apps keep working | An installed APK can be months old, so the API stays backward compatible |

## 3. Feature-driven code structure

Each feature is a self-contained folder with one public entry file, and lint rules stop features from reaching into each other, so a change in one feature cannot break or redirect another.

```text
src/
  app/                     Next.js routes: thin wrappers that render a feature screen
    (tabs)/resume/page.tsx
    (tabs)/quizzes/page.tsx
    (tabs)/scholarships/page.tsx
    (tabs)/profile/page.tsx
  features/
    resume-builder/
      index.ts             public API: the only file other code may import
      manifest.ts          id, routes, plugins, workers, dependencies, offline level
      ui/                  screens and components
      state/               store and hooks
      data/                repository: local database and API calls
      workers/             Web Worker tasks and sync jobs
      native/              Capacitor plugin calls behind an interface
      model.ts             types and validation
      tests/
    pdf-export/
    quizzes/
    scholarship-matching/
    profile-settings/
  shared/
    ui/                    design-system components: Button, Sheet, Tabs, Toast
    platform/              Capacitor wrappers: filesystem, share, haptics, network
    data/                  database client, migrations, sync engine
    navigation/            router wrapper, back-button handler, deep links
    errors/                error types, friendly-message mapper, error boundary
    workers/               worker pool and task runner
    events/                typed event bus
```

**Import rules**

| From | To | Allowed |
| --- | --- | --- |
| A feature | `shared/*` | Yes |
| A feature | Another feature's `index.ts` | Yes, if listed in `dependsOn` in its manifest, and the dependency graph has no cycles |
| A feature | Another feature's inner files | No |
| `shared/*` | Any feature | No |
| `app/*` routes | A feature's `index.ts` | Yes |
| Capacitor plugin imports | Anywhere except `native/` and `shared/platform/` | No |
| Database or API calls | Anywhere except `data/` | No |
| Changing the route | Anywhere except `shared/navigation` | No |

```js
// eslint.config.js (excerpt): features cannot import each other's internals
const features = ['resume-builder', 'pdf-export', 'quizzes', 'scholarship-matching', 'profile-settings'];

export const zones = [
  ...features.map((f) => ({
    target: `./src/features/${f}`,
    from: './src/features',
    except: [`./${f}`], // add each allowed dependency's index.ts from its manifest
  })),
  { target: './src/shared', from: './src/features' },
];
// used as: 'import/no-restricted-paths': ['error', { zones }]
```

**Feature manifest.** Every feature declares what it uses, so reviews and the matrix in section 10 stay accurate.

```ts
// features/pdf-export/manifest.ts
export const manifest = {
  id: 'pdf-export',
  owner: 'name-or-team',
  routes: ['/resume/export'],
  plugins: ['filesystem', 'share'],
  workers: ['pdf-render'],
  dependsOn: ['resume-builder'],
  offline: 'full',
} as const;
```

**Ownership rules**

- Every feature has one named owner and a short README: purpose, screens, data it stores, workers it runs, failure messages.
- A pull request touches one feature, or `shared/`, not both, unless it is a planned shared change that lists every affected feature.
- Shared code changes need a review from every owner whose feature imports the changed module.
- A feature can be switched off by a flag without breaking the rest of the app, because nothing else imports its internals.

## 5. Capacitor setup rules

The app is a folder of static files inside a native Android shell, so anything that needs a Next.js server must be designed out, and every web build must be synced into the native project before it is tested.

**Version.** [Capacitor core 8.4.1](https://github.com/ionic-team/capacitor/releases/tag/8.4.1) was marked latest on 19 June 2026. According to the [support policy](https://capacitorjs.com/docs/next/main/reference/support-policy), version 7 is in extended support until 8 December 2026, so a project still on 7 should plan its upgrade before then. Install plugins from the 8.x line and check each plugin's release notes before adding it.

**What a static export cannot do**

| Next.js feature | Status in the app | Use instead |
| --- | --- | --- |
| API routes, middleware, server actions | Not available | Call the NestJS API from the client |
| Server-side rendering, cookies and headers at request time | Not available | Render on the client, read data from the local database |
| Redirects and rewrites in `next.config` | Not applied | Redirect in the navigation layer |
| `next/image` optimization | Not available | Set `images.unoptimized: true`, ship pre-sized images |
| Dynamic routes | Need known values at build time | `generateStaticParams`, or use query parameters such as `/quiz?id=12` |

```ts
// next.config.ts
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
```

```ts
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.resumentor',
  appName: 'ResuMentor',
  webDir: 'out',
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: { launchAutoHide: false },
  },
};
export default config;
```

```json
{
  "scripts": {
    "build:mobile": "next build && cap sync android",
    "android": "cap open android"
  }
}
```

**Plugins by job** (check each is available for Capacitor 8 before adding)

| Job | Plugin family | Rule |
| --- | --- | --- |
| Back button, app state, deep links | `@capacitor/app` | One handler, owned by `shared/navigation` |
| Online and offline status | `@capacitor/network` | Wrapped in `shared/platform`, exposed as one hook |
| Files, PDF save | `@capacitor/filesystem` | Only inside `native/` of features that need it |
| Share sheet | `@capacitor/share` | Used for sharing a finished PDF |
| Haptics | `@capacitor/haptics` | Light feedback on key actions only |
| Keyboard, status bar, splash | `@capacitor/keyboard`, `@capacitor/status-bar`, `@capacitor/splash-screen` | Configured once at start-up |
| Reminders | A local notifications plugin | Only if a feature needs reminders |
| Structured offline data | A SQLite plugin | Decision in section 14 |
| Secrets and tokens | A secure-storage plugin backed by the Android Keystore | Preferences storage is not encrypted, so never put tokens there |

**Rules**

- Never ship with `server.url` set; it is for live reload on a developer device only.
- Run `cap sync` after every web build and every plugin install; commit the `android/` folder.
- Pin plugin versions in `package.json` and update them together with Capacitor.
- Test on a release build on a real device, because debug builds hide minification, permission and storage problems.
- Request only the Android permissions a feature uses, at the moment it is needed, with a short explanation first.
- Keep signing keys and keystore passwords out of the repository.
- Detect the platform through `shared/platform` so the same code runs in a desktop browser during development.
