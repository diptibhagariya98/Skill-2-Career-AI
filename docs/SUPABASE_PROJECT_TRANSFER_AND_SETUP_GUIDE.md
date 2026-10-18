# Supabase Project Transfer & Setup Guide (For Future Reference)

This guide provides the exact step-by-step instructions to transfer this project to **another Supabase account**, connect a fresh Supabase project, run migrations, and deploy the serverless Edge Functions on the free tier.

---

## Architecture Overview

```text
                      +---------------------------------------+
                      |       Client: Web & Mobile APK        |
                      +-------------------+-------------------+
                                          |
                +-------------------------+-------------------------+
                |                                                   |
      Direct Client SDK                                   Serverless Workers
   (Database, Auth, Sync)                              (AI, Jobs, Processing)
                |                                                   |
                v                                                   v
   Supabase PostgreSQL & Auth                         Supabase Edge Functions
  (profiles, otp_codes, RLS)                       (/functions/v1/gemini, /jobs)
```

The codebase is engineered with **zero hardcoded project IDs**—the entire backend connection is dynamically controlled by environment variables in `.env.local`.

---

## Step-by-Step Transfer Checklist

### Step 1: Create New Supabase Project

1. Go to [supabase.com](https://supabase.com) and log in to your new or target account.
2. Click **New Project** and select your organization.
3. Choose a project name (e.g. `resumentor-prod`), choose a region close to your users (e.g., `Mumbai / ap-south-1` or `Tokyo / ap-northeast-1`), and set a **strong Database Password**.
   > [!IMPORTANT]
   > Save the Database Password securely—you will need it for the database connection string.
4. Once the project dashboard is ready, note your **Project Reference ID** (e.g., `abcdefghijklmnopqrst`, visible in the URL: `https://supabase.com/dashboard/project/<project-ref>`).

---

### Step 2: Retrieve API Keys from Supabase

Navigate to **Project Settings** $\rightarrow$ **API**:

1. **Project URL**: `https://<your-project-ref>.supabase.co`
2. **Project API keys**:
   * `anon` / `public`: The publishable key safe for client-side usage.
   * `service_role` / `secret`: The elevated admin key used by serverless scripts and admin routes.

Navigate to **Project Settings** $\rightarrow$ **Database** $\rightarrow$ **Connection string**:

* Select **URI** and **Session / Transaction Pooler** (Port `6543` or `5432`).
* Copy the connection string:
  `postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`

---

### Step 3: Update `.env.local`

Open your local `.env.local` and update the Supabase section:

```env
# ==========================================
# Supabase Configuration (Update with new project)
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://<your-new-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...<your-new-anon-key>
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...<your-new-service-role-key>

DATABASE_URL=postgresql://postgres.<your-new-project-ref>:<your-db-password>@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
DATABASE_PASSWORD=<your-db-password>

# Serverless Worker Settings
NEXT_PUBLIC_USE_EDGE_FUNCTIONS=true
```

---

### Step 4: Run Database Migrations in 1 Command

Run the built-in automated migration script:

```bash
npm run db:migrate
```

**What this script does automatically:**

1. Connects to your new Supabase PostgreSQL instance using the pooler connection string.
2. Creates the `profiles` table with JSONB resume storage and user roles (`student`, `candidate`, `admin`).
3. Creates the `otp_codes` table with expiration tracking and HMAC hashing.
4. Enables Row Level Security (RLS) policies protecting user data.
5. Verifies database read/write access.

---

### Step 5: Configure Supabase Auth & Custom SMTP

1. In the Supabase Dashboard, go to **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **Email**:
   * Ensure **Enable Email provider** is turned **ON**.
   * Toggle **Confirm email** as per your preference (OTP handles verification).
2. Go to **Authentication** $\rightarrow$ **Email Templates**:
   * Customize email templates if desired.
3. In **Project Settings** $\rightarrow$ **Authentication** $\rightarrow$ **SMTP Settings**:
   * Enable Custom SMTP using your Gmail, Resend, or AWS SES credentials:
     * **Host**: `smtp.gmail.com`
     * **Port**: `587`
     * **Sender Name**: `ResuMentor`
     * **Sender Email**: your configured email
     * **User**: your email
     * **Password**: your app-specific password

---

### Step 6: Authenticate CLI & Deploy Edge Functions (Serverless Workers)

Deploy the free-tier serverless workers to your new project:

#### 1. Generate Access Token & Authenticate CLI

Before the Supabase CLI can deploy functions or manage secrets, it requires your Personal Access Token.

**Option A: Interactive Login (Recommended)**

```bash
npx supabase login
```

* Press **Enter**. This opens your browser to: [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
* Click **"Generate new token"**, name it (e.g., `resumentor-cli`), and copy the generated token (starts with `sbp_...`).
* Paste the token back into your terminal prompt and press **Enter**.

**Option B: Set Token via Environment Variable (PowerShell / Windows)**

```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_YOUR_COPIED_TOKEN_HERE"
```

*(On macOS/Linux: `export SUPABASE_ACCESS_TOKEN="sbp_YOUR_COPIED_TOKEN_HERE"`)*

---

#### 2. Link the CLI to your Project

```bash
npx supabase link --project-ref <your-new-project-ref>
```

*(When prompted for your database password, enter the password you set in Step 1).*

---

#### 3. Set the Worker Secrets in Supabase

The Edge Functions need your Gemini and RapidAPI keys stored in Supabase's encrypted vault:

```bash
npx supabase secrets set GEMINI_API_KEY="AIzaSy..." RAPIDAPI_KEY="ac20ef..." --project-ref <your-new-project-ref>
```

---

#### 4. Deploy the Edge Functions

Deploy both serverless workers:

```bash
npx supabase functions deploy gemini --project-ref <your-new-project-ref>
npx supabase functions deploy jobs --project-ref <your-new-project-ref>
```

The workers are now live and accessible at:

* `https://<your-new-project-ref>.supabase.co/functions/v1/gemini`
* `https://<your-new-project-ref>.supabase.co/functions/v1/jobs`

---

### Step 7: Deploy Web App & Build Mobile APK

#### Web App (Vercel)

1. In your Vercel Dashboard, go to **Project Settings** $\rightarrow$ **Environment Variables**.
2. Add the same variables from your updated `.env.local`:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`
   * `NEXT_PUBLIC_USE_EDGE_FUNCTIONS=true`
   * `GEMINI_API_KEY`
   * `RAPIDAPI_KEY`
   * `DATABASE_URL`
3. Trigger a redeploy on Vercel.

#### Mobile App (Android APK)

Build the new release APK pointing to the new project:

```bash
npm run build:apk
```

* The static export automatically bakes the new `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` into the client APK.
* Output location: `android/app/build/outputs/apk/release/app-release.apk`.

---

## Troubleshooting & Verification Matrix

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| `Access token not provided` | Supabase CLI is not logged in | Run `npx supabase login` or set `$env:SUPABASE_ACCESS_TOKEN="sbp_..."` before deploying functions. |
| `npm run db:migrate` fails to connect | Wrong password or IPv6 pooler issue | Check `DATABASE_PASSWORD` in `.env.local`. The script automatically tries port `6543` (IPv4 pooler) and port `5432`. |
| 401 Unauthorized on Edge Functions | Missing Anon Key header | The client [`src/lib/apiClient.ts`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/Skill-2-Career-AI-1/src/lib/apiClient.ts) automatically attaches `apikey` and `Authorization: Bearer <anon_key>`. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is present in `.env.local`. |
| CORS error in browser console | Origin blocked by Supabase | Edge Functions use [`supabase/functions/_shared/cors.ts`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/Skill-2-Career-AI-1/supabase/functions/_shared/cors.ts) which sets `Access-Control-Allow-Origin: *`. Ensure the functions are redeployed after any changes. |
| Missing Secrets in Edge Function | `Deno.env.get` returns undefined | Run `npx supabase secrets set GEMINI_API_KEY=... RAPIDAPI_KEY=... --project-ref <ref>`. |
