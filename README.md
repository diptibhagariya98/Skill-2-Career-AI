# 🎓 ResuMentor (Skill-2-Career-AI)
### Next-Generation AI Career Companion, Scholarship Engine & Native Mobile App

[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.5.3-blue?style=for-the-badge&logo=capacitor)](https://capacitorjs.com/)
[![Android 15/16](https://img.shields.io/badge/Android-15%20%2F%2016%20Ready-green?style=for-the-badge&logo=android)](https://developer.android.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Postgres-emerald?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%203.8%20Flash-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Material%203%20Expressive-cyan?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Zero%20Any-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## 📌 What Is ResuMentor?

> **In simple words**: ResuMentor is a free, AI-powered career helper for students and fresh graduates.
> It helps you build a resume, practice job interviews, find scholarships, and discover job opportunities — all in one place.

Each year, millions of college graduates and students face the same painful problems when they try to get their first job:

| Problem | How ResuMentor Solves It |
| :--- | :--- |
| Resumes get rejected by automated systems before a human sees them | AI scans your resume and tells you exactly what to fix |
| No idea how a real interview feels | Practice interviews with an AI that talks back like a real interviewer |
| Missing out on scholarships you qualify for | Answer a few questions and instantly see every scheme you are eligible for |
| Good jobs hidden from big job boards | Find startup and referral jobs that most students never see |
| Do not know what skills to learn next | Step-by-step career roadmaps for different tech roles |

ResuMentor runs as a **website** you open in any browser, and also as a **native Android app** you can install on your phone — built to feel like a proper Android app, not a website wrapped in a phone.

---

## System Architecture

> **New to system diagrams?** Think of the boxes below as different rooms in the app.
> The Client Layer is what you see on screen. The Backend is the server doing hidden work.
> The AI APIs are external services that power smart features.

```mermaid
graph TB
    subgraph "What You See (Client Layer)"
        UI["Your Phone or Browser Screen\nMaterial 3 Expressive UI"]
        Bridge["Platform Bridge\nsrc/shared/platform.ts\nConnects web code to Android features"]
        LocalStore["Offline Storage\nResume drafts work without internet"]
    end

    subgraph "Native Android Features"
        CapCore["Capacitor Android Shell\nPackages the web app as a real APK"]
        Haptics["Vibration Feedback"]
        BackStack["Android Back Button Handler"]
        PrintShare["Native Print and Share Dialogs"]
    end

    subgraph "Backend Server-Side"
        SupaAuth["Supabase Auth\nLogin, OTP, Password Reset"]
        SupaDB["PostgreSQL Database\nStores user data securely"]
        EdgeWorker["Next.js API Routes\nThe brain that talks to AI and DB"]
        EmailService["Email Service\nSends OTP codes to your inbox"]
    end

    subgraph "External Smart Services"
        Gemini["Google Gemini AI\nPowers Resume Scoring and Mock Interviews"]
        JSearch["JSearch via RapidAPI\nPulls real-time job listings"]
    end

    UI --> Bridge
    Bridge --> CapCore
    CapCore --> Haptics
    CapCore --> BackStack
    CapCore --> PrintShare
    UI --> LocalStore
    UI --> SupaAuth
    UI --> EdgeWorker
    EdgeWorker --> Gemini
    EdgeWorker --> JSearch
    EdgeWorker --> SupaDB
    EdgeWorker --> EmailService
```

### Key Engineering Decisions

- **One codebase, two outputs**: The same TypeScript code runs as a website AND compiles into an Android APK. No duplication.
- **Platform Bridge Pattern**: The app never calls Android-specific code directly. A bridge file (`src/shared/platform.ts`) handles it, so the website version still works perfectly.
- **Strict Typing (Zero `any`)**: Every piece of data has a defined type. This prevents entire categories of bugs before they happen.
- **Offline-first resume editing**: Your resume draft saves locally, so losing internet does not lose your work.

---

## What Can a Regular User Do?

> A **User** is anyone who signs up with their email. Here is everything you can do after logging in:

```
User Journey
─────────────────────────────────────────────────────────────────

  RESUME BUILDER
   Fill in your name, contact, skills, education, projects
   See a live A4 preview as you type
   Download as a clean PDF (ready to send to companies)
   Get an AI ATS Score — how likely a robot scanner is to
   accept your resume (score from 0-100 with tips to improve)

  MOCK INTERVIEW
   Enter a job title (e.g. Frontend Developer)
   Paste the job description from any company posting
   AI asks you realistic interview questions one by one
   You type or speak your answers
   Get instant feedback: what was good, what to improve,
   and a model perfect answer to compare against

  SCHOLARSHIP FINDER
   Answer simple questions: your state, income, marks, category
   Instantly see which government schemes you qualify for
   (e.g. Gujarat MYSY, Central Sector Scholarship)
   Get the exact list of documents needed to apply

  JOB FINDER
   Search for jobs by role and location
   See startup and referral jobs not on Naukri or LinkedIn
   Click directly to apply on the company website

  LEARN AND PRACTICE
   View career roadmaps (Frontend, Backend, DevOps, etc.)
   Take timed quizzes and get instant explanations
   Preview curriculum PDFs directly in the app

  PROFILE AND SETTINGS
   Update your name, photo, and contact details
   Change your password

─────────────────────────────────────────────────────────────────
```

---

## What Can a Super Admin Do?

> A **Super Admin** is a special account (usually the platform owner or administrator).
> The admin has access to an extra Control Center that regular users never see.

```
Admin Control Center (only visible after admin login)
─────────────────────────────────────────────────────────────────

  SWITCH VIEWS
   Toggle between Admin Portal and Student View
   to test exactly what a student sees

  SCHOLARSHIP COMPLIANCE CONSOLE
   Simulate any student situation (income, marks, state)
   and see which schemes pass or fail — useful for testing
   Review all scholarship schemes currently in the system
   Flag any scheme not verified in the last 90 days
   (staleness policy keeps data accurate)
   Edit, add, or remove scholarship scheme definitions

  SYSTEM MONITORING
   View audit logs for authentication events (logins, OTP attempts)
   Monitor failed login attempts and brute-force attempts

  ACCOUNT CONTROL
   Promote any registered user to Super Admin via SQL
   Reset the default Super Admin password via the seed script

─────────────────────────────────────────────────────────────────
```

> **How is an Admin account created?**
> Admin accounts are **not** created through the normal signup form. They are provisioned in two ways:
>
> 1. **Automated Seeder** (`npm run seed:admin`) — creates a default admin user directly in the database.
> 2. **SQL Promotion** — update a user role field in the profiles table to admin via Supabase SQL Editor.
>
> See Section 5 of the Setup Guide below for step-by-step instructions.

---

## Feature Breakdown

### 1. ATS-Friendly AI Resume Builder

**What is ATS?** ATS stands for Applicant Tracking System. It is software companies use to automatically scan resumes before a human reads them. If your resume does not have the right keywords or format, it gets rejected automatically. ResuMentor helps you avoid that.

- **Granular Section Editor**: Dedicated editors for Contact, Summary, Work Experience, Education, Projects, Skills, Certifications, and Languages.
- **Live A4 Preview**: See the final resume layout as you type — no surprises when printing.
- **100% Offline PDF Export**: Generates a pixel-perfect A4 PDF using your browser print engine. No server upload needed.
- **Gemini ATS Preflight Audit**: Sends your resume text to Google Gemini AI, which returns an overall ATS Readiness Score (0-100), keyword density feedback, and actionable improvement bullets.

---

### 2. AI Mock Interview Simulator

**What makes it special?** This is not a fixed quiz. The AI reads your job description and creates custom questions for that exact role.

- **Dynamic Question Generation**: Paste any real job description. The AI extracts the required skills and builds a tailored question set.
- **Interactive Conversation**: Questions flow one by one, with follow-ups based on your answers — like a real interview.
- **Mathematical Scoring**: Each answer is scored with a weighted formula:

  ```
  Total Score = round(
    (Accuracy x 0.40) + (Context x 0.35) + (Confidence x 0.25)
  ) x 10

  Accuracy   (40%): Did you get the facts right?
  Context    (35%): Did your answer fit the role and situation?
  Confidence (25%): Was your answer clear and structured?
  ```

- **Model Answers**: After each answer, see what an ideal response would look like.
- **Speech-to-Text**: Speak your answers instead of typing.

---

### 3. Hidden Job Finder

- **Real-Time Job Data**: Powered by JSearch via RapidAPI, pulling live job postings from across the internet.
- **Off-Portal Discovery**: Finds startup, internal, and referral openings that do not appear on Naukri.com or LinkedIn.
- **One-Tap Apply**: Direct link to the official company application page.

---

### 4. Scholarship Advisor and Rule Engine

- **Smart Eligibility Check**: Answer questions about your state, category (General/OBC/SC/ST), annual family income, marks percentage, and study level. The engine instantly checks against government scheme rules.
- **Schemes Covered**: Gujarat MYSY, Central Sector Scholarship (CSS), and more.
- **Document Checklist**: Get the exact list of documents you need with application deadlines.
- **Verified Senior Mentors**: Connect with verified students who have already received these scholarships.

---

### 5. Practice Hub, Roadmaps and Curriculum

- **Career Roadmaps**: Visual step-by-step paths for Frontend Dev, Backend Dev, Full Stack, Cloud, DevOps, and Data Engineering.
- **In-App PDF Viewer**: Preview curriculum documents without leaving the app. Download or share with native OS dialogs.
- **Interactive Quizzes**: Timed multiple-choice quizzes with instant scoring and answer explanations.

---

### 6. Super Admin Control Center

- **Compliance Console**: Admin can simulate any student profile against the scholarship rule engine to test edge cases and verify scheme accuracy.
- **90-Day Staleness Policy**: Any scheme not reviewed in 90 days gets flagged, ensuring eligibility data stays current.
- **Dual-View Toggle**: Admin switches between the admin panel and the student view with one click.

---

### 7. Authentication and Branded Emails

- **Supabase Auth with Row-Level Security**: Each user can only see their own data.
- **6-Digit OTP Verification**: When you sign up or reset your password, you receive a branded email with a 6-digit code. Codes expire in 10 minutes.
- **Anti-Brute Force Protection**: After 5 failed OTP attempts, the system locks further attempts.
- **Branded Emails**: OTP emails, welcome emails, and password reset emails are designed with the ResuMentor brand using React Email templates.

---

### 8. Native Android 15/16 Experience

- **Feels like a real Android app**: Built with Material 3 Expressive design — the same standard Google uses for its own Android apps.
- **Edge-to-Edge display**: The UI stretches under the status bar and gesture bar, using safe area CSS variables (`--sat`, `--sab`) to prevent content from being hidden.
- **Hardware Haptics**: Button presses, score reveals, and step completions trigger real phone vibrations.
- **Predictive Back Navigation**: The back button closes modals and menus in the right order before exiting screens.

---

## Technology Stack — What We Used and Why

> **Not a developer?** Think of each technology as a specialist worker on a building site.
> Each one has a specific job that no one else can do as well.

| Technology | What It Is | Why We Chose It |
| :--- | :--- | :--- |
| **Next.js 14** | The main framework that builds all the screens | Allows the same code to run as a website AND export as static files for the Android app. Built-in API routes mean no separate backend server is needed. |
| **React 18** | The library Next.js uses to build UI components | Industry-standard, component-based UI. Hooks make complex state (like interview threads) clean and manageable. |
| **TypeScript** | A stricter version of JavaScript | Catches bugs before the code even runs. We use strict mode with zero `any` types, meaning every value must be clearly defined. |
| **Tailwind CSS** | A utility-first CSS framework | Lets us style components without writing separate CSS files. Paired with Material 3 design tokens, it ensures every screen looks consistent. |
| **Capacitor** | Wraps the Next.js web app into a real Android APK | Unlike React Native, Capacitor uses the same web code — no rewrite needed. Provides native plugins (haptics, share, dialogs) via a simple API. |
| **Supabase** | Backend-as-a-Service: database and authentication | Provides a managed PostgreSQL database with Row-Level Security built in. Auth (login, OTP, password reset) is handled out of the box. No need to build a separate auth server. |
| **Google Gemini API** | The AI brain (language model) | Google Gemini 3.8 Flash is fast, accurate, and handles complex structured outputs (like JSON scoring rubrics) reliably. Used for resume scoring and interview evaluation. |
| **RapidAPI JSearch** | Real-time job data aggregator | Scrapes job postings from hundreds of sources via a single API call. No need to maintain our own job scraper. |
| **React Email + Nodemailer** | HTML email builder and SMTP sender | React Email lets us design emails as React components (same language as the UI). Nodemailer sends them via standard SMTP (Gmail app password or any provider). |
| **Radix UI** | Accessible, headless UI primitives | Provides dialog, accordion, tabs, and tooltip components that are keyboard navigable and ARIA-compliant, without imposing visual styles. |
| **Lucide React** | Icon library | Consistent, clean 24px icons throughout the app with a single import style. |
| **html2pdf.js and Print CSS** | Client-side PDF generation | Converts the resume HTML to a pixel-perfect A4 PDF directly in the browser — no server upload, no privacy concern. |

---

## Project Directory Structure

```text
Skill-2-Career-AI-1/
│
├── .agents/                    # Internal coding rules and M3 design guidelines
│   └── rules/                  # 00-native-core, 01-design-tokens, 05-self-audit, etc.
│
├── android/                    # Native Android Capacitor project (auto-generated)
│
├── blackbox-testing/           # Automated end-to-end test suites
│
├── public/                     # Static files: logos, icons, illustrations
│
├── scripts/                    # Developer utility scripts
│   ├── build-android.mjs       # Builds Android APK (debug or release)
│   ├── build-mobile.mjs        # Exports Next.js to static files for Capacitor
│   ├── ensure-android-jdk.mjs  # Checks your JDK installation automatically
│   ├── migrate.mjs             # Runs pending database schema migrations
│   └── seed-super-admin.mjs    # Creates the default Super Admin account
│
├── src/
│   ├── app/                    # Next.js App Router — pages and API routes
│   │   ├── api/                # Serverless API handlers (gemini, jobs, resume, auth)
│   │   ├── dashboard/          # Dashboard route (student and admin views)
│   │   ├── globals.css         # Global CSS: M3 tokens, safe areas, print styles
│   │   ├── layout.tsx          # HTML root shell and viewport settings
│   │   └── page.tsx            # App entry: decides whether to show Tour/Auth/Landing
│   │
│   ├── components/             # All visual screens and UI modules
│   │   ├── admin/              # Super Admin Control Center
│   │   ├── interview/          # Mock Interview (Thread, Setup, Scorecard)
│   │   ├── mobile/             # Intro tour onboarding screens (first launch)
│   │   ├── scholarships/       # Scholarship wizard, directory, admin console
│   │   ├── AIInterview.tsx     # AI Mock Interview container
│   │   ├── Auth.tsx            # Login, Register, OTP, Password Reset
│   │   ├── Dashboard.tsx       # Main authenticated dashboard and nav rail
│   │   ├── JobFinder.tsx       # Live hidden job finder
│   │   ├── LandingPage.tsx     # Public marketing page
│   │   ├── LearnPractice.tsx   # Practice hub, quizzes and career roadmaps
│   │   ├── Profile.tsx         # User profile and account settings
│   │   └── ResumeBuilder.tsx   # ATS resume builder with live A4 preview
│   │
│   ├── constants/              # Centralized values — no magic strings in code
│   │   ├── brand.theme.ts      # App colors, typography, company info
│   │   ├── endpoints.ts        # All API_ROUTES and APP_ROUTES in one place
│   │   ├── roles.ts            # UserRole, DashboardSection, STORAGE_KEYS enums
│   │   └── seedScholarships.ts # Scholarship scheme definitions
│   │
│   ├── emails/                 # Branded email templates
│   │   ├── EmailLayout.tsx     # Base email frame with ResuMentor branding
│   │   ├── ResetPasswordEmail.tsx  # OTP email for password reset
│   │   ├── VerifyEmail.tsx     # OTP email for account confirmation
│   │   └── WelcomeEmail.tsx    # Sent after successful registration
│   │
│   ├── lib/                    # Core logic — the engine room
│   │   ├── interview/          # Scoring formulas, Gemini prompt builders
│   │   ├── resume/             # Resume schema, sanitizers, version migrations
│   │   ├── scholarships/       # Deterministic eligibility rule engine
│   │   └── supabase.ts         # Supabase client singleton (shared connection)
│   │
│   ├── shared/                 # Cross-platform utilities
│   │   ├── platform.ts         # Native/web bridge: haptics, back stack, share, dialogs
│   │   └── ui/                 # Shared UI: Logo, Skeletons, BottomSheet, etc.
│   │
│   └── types/                  # TypeScript type and interface definitions
│
├── supabase/                   # Database SQL files
│   ├── complete_schema_bootstrap.sql  # Run this once to set up all tables
│   └── migrations/             # Incremental schema change files
│
├── capacitor.config.ts         # Capacitor app configuration
├── next.config.mjs             # Next.js build settings
├── package.json                # Project dependencies and npm scripts
└── tailwind.config.js          # Tailwind theme and Material 3 token mapping
```

---

## Step-by-Step Local Setup Guide

> **Complete beginner?** Follow every step in order. Do not skip.
> If you are an experienced developer, jump to the step you need.

### 1. Prerequisites — What You Need Before Starting

Install these tools on your computer first:

| Tool | Version Required | Where to Get It | How to Check |
| :--- | :--- | :--- | :--- |
| **Node.js** | 18.17.0 or higher | [nodejs.org](https://nodejs.org) | `node -v` |
| **npm** | 9.x or higher | Comes with Node.js | `npm -v` |
| **Git** | Any recent version | [git-scm.com](https://git-scm.com) | `git --version` |
| **JDK 17 or 21** | Required only for APK builds | [adoptium.net](https://adoptium.net) | `java -version` |
| **Android Studio** | SDK API 34+ | [developer.android.com](https://developer.android.com/studio) | Required only for APK builds |

You also need accounts at:

| Account | Why You Need It | Where to Sign Up |
| :--- | :--- | :--- |
| **Supabase** (free) | Database and authentication | [supabase.com](https://supabase.com) |
| **Google AI Studio** (free) | Gemini API key for AI features | [aistudio.google.com](https://aistudio.google.com) |
| **RapidAPI** (free tier) | JSearch API key for job listings | [rapidapi.com](https://rapidapi.com) |
| **Gmail App Password** | For sending OTP emails | [Google Account Settings](https://support.google.com/accounts/answer/185833) |

---

### 2. Clone and Install Dependencies

```bash
# Step 1: Download the project to your computer
git clone https://github.com/diptibhagariya98/Skill-2-Career-AI.git

# Step 2: Enter the project folder
cd Skill-2-Career-AI-1

# Step 3: Install all packages (this may take a minute or two)
npm install
```

---

### 3. Configure Environment Variables

Environment variables are **secret keys** that the app needs to connect to external services.
They go in a file called `.env.local` in the project root. This file is never committed to Git (it is in `.gitignore`).

Create a new file named `.env.local` in the root directory and fill in your values:

```env
# Google Gemini AI
# Get from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# RapidAPI JSearch (Job Finder)
# Get from: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
RAPIDAPI_KEY=your_rapidapi_key_here

# Supabase Database and Auth
# Get from: Supabase Dashboard -> Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://postgres.your-id:your-password@aws-0-region.pooler.supabase.com:6543/postgres

# Email via Gmail App Password
# Guide: https://support.google.com/accounts/answer/185833
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
MAIL_FROM=no-reply@resumentor.app

# Security — generate a random string: openssl rand -hex 16
AUTH_SECRET=your_random_32_character_hex_secret

# Mobile APK (Optional — only needed when building Android APK)
NEXT_PUBLIC_API_URL=https://your-deployed-domain.vercel.app
NEXT_PUBLIC_USE_EDGE_FUNCTIONS=false

# Super Admin (Optional — defaults used if not set)
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=superadmin@resumentor.app
```

---

### 4. Database Setup and Migrations

This step creates all the required database tables (`profiles`, `otp_codes`, `auth_audit_logs`) and sets up Row-Level Security rules in your Supabase project.

#### Option A: Run via SQL Editor — Recommended for Beginners

1. Go to your **Supabase Dashboard** and click **SQL Editor** in the left sidebar.
2. Open the file [`supabase/complete_schema_bootstrap.sql`](supabase/complete_schema_bootstrap.sql) from this project.
3. Copy the entire contents, paste into the SQL Editor, and click **Run**.
4. You should see a success message with no errors.

#### Option B: Run Migration Script

```bash
npm run db:migrate
```

---

### 5. Provisioning the Super Admin Account

> **Important**: You cannot become an Admin by signing up in the app.
> Admin accounts must be created using one of the methods below.

#### Method A: Automated Seeder CLI — Recommended

This script automatically creates a Super Admin user in both Supabase Auth and your `profiles` table.

```bash
npm run seed:admin
```

After running, log in with these credentials:

| Field | Value |
| :--- | :--- |
| **Email** | `superadmin@resumentor.app` |
| **Password** | `SuperAdmin@2026!` |

To use custom credentials instead:
```bash
SUPER_ADMIN_EMAIL=custom@domain.com SUPER_ADMIN_PASSWORD=MyPassword! npm run seed:admin
```

#### Method B: Promote Any Existing User via SQL

If you already have a regular account and want to make it an admin:

1. Go to **Supabase Dashboard** then **SQL Editor**.
2. Run this SQL (replace the email with your own):

```sql
-- Promote in the profiles table
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'your-registered-email@example.com';

-- Sync the role in Supabase Auth metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-registered-email@example.com';
```

---

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the ResuMentor landing page. Sign in with your admin credentials or create a new student account.

---

## Building the Native Android APK

> This section is for developers who want to install the app on an Android phone or emulator.

```bash
# Step 1: Verify JDK 17 or 21 is installed correctly
npm run check:jdk

# Step 2: Build the Next.js static export and sync it to Capacitor
npm run build:mobile

# Step 3: Build the APK
# Output: android/app/build/outputs/apk/release/app-release.apk
npm run build:apk

# Optional: Open Android Studio for debugging
npm run cap:android
```

---

## Available NPM Scripts

| Script | What It Does |
| :--- | :--- |
| `npm run dev` | Starts the local development server at localhost:3000 |
| `npm run build` | Compiles an optimized production web build |
| `npm run build:mobile` | Exports Next.js as static files and syncs to Capacitor |
| `npm run build:apk` | Builds a release Android APK |
| `npm run build:apk:debug` | Builds a debug Android APK for testing |
| `npm run check:jdk` | Validates your Android JDK setup |
| `npm run cap:sync` | Syncs web assets from ./out into Android |
| `npm run cap:android` | Opens Android Studio |
| `npm run lint` | Runs ESLint to check for code issues |
| `npm run seed:admin` | Creates or resets the Super Admin account |
| `npm run db:migrate` | Applies pending database schema changes |
| `npm run test:auth` | Runs end-to-end auth flow verification tests |

---

## UI/UX Design Standards

ResuMentor follows **Material 3 Expressive** — Google's official Android 15/16 design language.

| Standard | Rule Applied |
| :--- | :--- |
| **Touch Targets** | Every tappable element is at least 48x48px so thumbs never miss |
| **Sentence Case** | Button labels and badges use sentence case, not ALL CAPS |
| **Safe Areas** | Content avoids camera notches and home gesture bars automatically |
| **Contrast** | Text contrast ratio at minimum 4.5:1 (WCAG AA compliant) |
| **Focus Rings** | Keyboard users see visible focus outlines on every interactive element |
| **Dark Mode** | Full dark mode support via CSS color-scheme and data-theme attribute |
| **Font Scale** | Layout works at 200% system font size without breaking |

---

## Security Architecture

| Security Layer | How It Works |
| :--- | :--- |
| **Row-Level Security (RLS)** | Database rules ensure each user can only read and modify their own data |
| **Hashed OTP Codes** | Verification codes are SHA-256 hashed before storage — raw codes are never saved |
| **Brute-Force Protection** | After 5 failed OTP attempts, the system locks further tries |
| **Input Sanitization** | All user inputs are validated on both client and server to prevent SQL injection and XSS |
| **Short Token Windows** | OTP codes expire in 10 minutes. Password reset tokens are single-use |

---

## Contributors and Acknowledgements

- **Lead Architect and Developer**: Saikiran Rudra
- **Core Contributors**: ResuMentor Team and Community Contributors
- **Powered by**: Google Gemini API, Supabase, Next.js, and Capacitor

---

## License

This project is licensed under the **MIT License**.
You are free to use, modify, and distribute this platform for academic and commercial purposes.
