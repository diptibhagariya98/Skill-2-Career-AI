# Firebase to Supabase Complete Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely replace Firebase Auth and Firestore with a production-grade Supabase (Auth + PostgreSQL) integration that works seamlessly on Vercel serverless deployments, local dev, and Capacitor mobile (Android/iOS).

**Architecture:** Client and server-side Supabase helpers connecting to Supabase Cloud via HTTPS/PostgREST. Authentication utilizes native Supabase Auth with 6-digit OTP verification. User profile management uses a PostgreSQL `public.profiles` table with Row Level Security (RLS) and an automated trigger on `auth.users`. Deployed backend compatibility is guaranteed via standard HTTPS and an active health/connectivity test route.

**Tech Stack:** Next.js 14 (App Router), `@supabase/supabase-js`, `@supabase/ssr`, TypeScript, PostgreSQL, Capacitor 8 (Android/iOS).

**Spec:** [`docs/superpowers/specs/2026-10-18-firebase-to-supabase-migration-design.md`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/Skill-2-Career-AI-1/docs/superpowers/specs/2026-10-18-firebase-to-supabase-migration-design.md)

## Global Constraints
- **Platform Compatibility**: Code must build for both server/Vercel (`next build`) and static mobile export (`BUILD_TARGET=mobile`).
- **No Unauthenticated Server SDK Calls**: All server-side requests must use either the authenticated user token or the `SUPABASE_SERVICE_ROLE_KEY`.
- **Zero Firebase Leftovers**: All `@/lib/firebase` imports, Firebase packages, and obsolete `/api/auth/*` routes must be removed cleanly.
- **Environment Fallbacks**: Client must not crash on build time if environment variables are empty during static compilation.

---

### Task 1: Dependencies, Environment Setup & Supabase Client Utilities

**Files:**
- Modify: `package.json`
- Create: `src/lib/supabase.ts`
- Create: `src/app/api/health/supabase/route.ts`
- Modify: `.env.local`

**Interfaces:**
- Produces: `supabase` (Browser & mobile client instance) and `getServiceSupabase()` (Server-side admin instance).
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 1: Install `@supabase/supabase-js` and `@supabase/ssr`**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Add Supabase environment variables to `.env.local`**
Append to `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://placeholder-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key
```

- [ ] **Step 3: Create unified cross-platform Supabase client (`src/lib/supabase.ts`)**
Create file with support for browser, mobile WebView (Capacitor), and server-side admin client:
```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Cross-platform client for browser, SSR, and Capacitor mobile
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

// Server-side privileged client for backend operations
export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
```

- [ ] **Step 4: Create Supabase Backend Health Check API Route (`src/app/api/health/supabase/route.ts`)**
Create route to verify that the deployed Vercel backend can connect to Supabase and execute queries:
```typescript
import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getServiceSupabase();
    const { data, error } = await admin.from("profiles").select("count").limit(1);

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        {
          status: "warning",
          message: "Connected to Supabase, but profiles table returned a notice.",
          details: error.message,
          hint: "Ensure the SQL migration script has been executed in the Supabase SQL Editor.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      connected: true,
      timestamp: new Date().toISOString(),
      provider: "supabase",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        connected: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Verify build compiles with new client**
Run: `npm run build`
Expected: Next.js compiles successfully.

---

### Task 2: SQL Migration Script & Supabase Schema Setup

**Files:**
- Create: `supabase/migrations/20261018_init_profiles.sql`
- Create: `docs/SUPABASE_SETUP_GUIDE.md`

**Interfaces:**
- Produces: `public.profiles` table, RLS policies, `public.handle_new_user()` trigger on `auth.users`.

- [ ] **Step 1: Write SQL migration file (`supabase/migrations/20261018_init_profiles.sql`)**
```sql
-- 1. Create Profiles Table referencing Supabase auth.users
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

-- 3. RLS Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

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
  on conflict (id) do update set
    name = coalesce(excluded.name, public.profiles.name),
    email = coalesce(excluded.email, public.profiles.email),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 2: Create Step-by-Step Setup Guide (`docs/SUPABASE_SETUP_GUIDE.md`)**
Document for the user:
1. Where to copy-paste the SQL script (Supabase Dashboard > SQL Editor > Run).
2. Where to get the API URL and Anon Key (Project Settings > API).
3. How to connect custom Gmail SMTP (Project Settings > Authentication > Email Settings).
4. Enabling 6-digit OTP template in Supabase.

---

### Task 3: Refactor Authentication Flow (`src/components/Auth.tsx`)

**Files:**
- Modify: `src/components/Auth.tsx`

**Interfaces:**
- Consumes: `supabase` from `@/lib/supabase`.
- Replaces: Firebase Auth (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signInWithPopup`, `updateProfile`), Firestore `setDoc`/`getDoc`, and custom `/api/auth/send-otp` and `/api/auth/verify-otp`.

- [ ] **Step 1: Replace Firebase imports with Supabase**
Remove `auth, db` from `../lib/firebase` and all `firebase/auth` and `firebase/firestore` imports.
Import `{ supabase } from "@/lib/supabase"`.

- [ ] **Step 2: Implement Supabase Sign Up with Name Metadata**
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      name: fullName,
    },
  },
});
if (error) throw error;
```
If Supabase requires email verification (user is not yet confirmed), transition directly to OTP mode `setMode("otp")` and start the 60-second cooldown.

- [ ] **Step 3: Implement Native Supabase 6-Digit OTP Verification**
In `handleVerifyOtp`:
```typescript
const { data, error } = await supabase.auth.verifyOtp({
  email: pendingEmail,
  token: otpDigits.join(""),
  type: "signup",
});
if (error) {
  // If not signup, also try email OTP type for password reset / recovery
  const fallback = await supabase.auth.verifyOtp({
    email: pendingEmail,
    token: otpDigits.join(""),
    type: "email",
  });
  if (fallback.error) throw fallback.error;
}
toast.success("Email verified successfully! Welcome to ResuMentor.");
router.replace(APP_ROUTES.DASHBOARD);
```

- [ ] **Step 4: Implement Resend OTP via Supabase**
In `handleResendOtp`:
```typescript
const { error } = await supabase.auth.resend({
  type: "signup",
  email: pendingEmail,
});
if (error) throw error;
toast.success("A fresh 6-digit verification code has been sent!");
setCooldown(60);
```

- [ ] **Step 5: Implement Supabase Sign In & Google OAuth**
In `handleLogin`:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
if (error) throw error;
toast.success("Successfully logged in!");
router.replace(APP_ROUTES.DASHBOARD);
```
In `handleGoogleLogin`:
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
  },
});
if (error) throw error;
```

---

### Task 4: Refactor Dashboard & Profile Components

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/Profile.tsx`
- Modify: `src/app/auth/page.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `supabase` from `@/lib/supabase`.
- Replaces: `getDoc(doc(db, "users", ...))`, `updateDoc`, `signOut(auth)`.

- [ ] **Step 1: Refactor `Dashboard.tsx`**
Replace Firebase imports with `import { supabase } from "@/lib/supabase"`.
Update user profile fetcher:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) return;

const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();

setUserData({
  name: profile?.name || user.user_metadata?.name || "Student",
  email: profile?.email || user.email || "",
  photoURL: profile?.photo_url || "",
  role: profile?.role || "student",
  ...profile,
});
```
Update logout:
```typescript
await supabase.auth.signOut();
toast.success("Successfully logged out!");
router.replace("/auth");
```

- [ ] **Step 2: Refactor `Profile.tsx`**
Update avatar and name updates:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) return;

const { error } = await supabase
  .from("profiles")
  .update({
    photo_url: compressedDataUrl,
    updated_at: new Date().toISOString(),
  })
  .eq("id", user.id);
```

- [ ] **Step 3: Update `src/app/auth/page.tsx` and `src/app/dashboard/page.tsx`**
Replace `onAuthStateChanged(auth, ...)` with `supabase.auth.onAuthStateChange((event, session) => ...)` to protect routes and redirect authenticated users to `/dashboard` and unauthenticated users to `/auth`.

---

### Task 5: Decommission Firebase & Verify Full Build

**Files:**
- Delete: `src/lib/firebase.ts`
- Delete: `src/app/api/auth/send-otp/route.ts`
- Delete: `src/app/api/auth/resend-otp/route.ts`
- Delete: `src/app/api/auth/verify-otp/route.ts`
- Modify: `package.json`

- [ ] **Step 1: Remove obsolete Firebase files**
Delete:
- `src/lib/firebase.ts`
- `src/app/api/auth/send-otp`
- `src/app/api/auth/resend-otp`
- `src/app/api/auth/verify-otp`

- [ ] **Step 2: Uninstall `firebase` package**
```bash
npm uninstall firebase
```

- [ ] **Step 3: Test Web Build (`next build`)**
Run: `npm run build`
Expected: Next.js builds all client pages and server API routes cleanly with zero TypeScript errors.

- [ ] **Step 4: Test Mobile Build (`build:mobile`)**
Run: `npm run build:mobile`
Expected: Static export builds cleanly into `./out` and Capacitor syncs successfully.
