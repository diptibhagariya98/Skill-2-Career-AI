# Supabase Setup & Deployment Guide for ResuMentor

This guide walks you through connecting your Supabase project so that your Next.js Vercel deployment and Capacitor mobile app work seamlessly without permissions issues or rate limits.

---

## 1. Create Your Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and click **Start your project**.
2. Sign in with GitHub.
3. Click **New project**:
   - **Name**: `resumentor` (or your preferred name)
   - **Database Password**: Choose a strong password and save it securely.
   - **Region**: Choose the region closest to you (e.g. `ap-south-1` Mumbai or your preferred region).
   - **Pricing Plan**: Free tier ($0).
4. Click **Create new project** and wait ~1 minute for it to initialize.

---

## 2. Execute the Database Migration Script
1. In your Supabase Dashboard, click on **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Copy the entire contents of [`supabase/migrations/20261018_init_profiles.sql`](file:///c:/Users/manis/DEVELOPMENT-CODES-AND-PROJECTS/Skill-2-Career-AI-1/supabase/migrations/20261018_init_profiles.sql).
4. Paste into the SQL editor and click **Run** (or `Ctrl + Enter`).
5. You should see `Success. No rows returned`.
   *(This creates the `profiles` table, enables Row Level Security, and attaches the automated trigger that creates a profile on every signup).*

---

## 3. Retrieve Your Supabase API Keys
1. In the Supabase Dashboard, click the **Settings** gear icon (bottom left) -> **API** (or **Project Settings** > **API**).
2. Copy the following values:
   - **Project URL**: `https://xxxxxxxxxxxxxxxx.supabase.co`
   - **Project API Keys - `anon` `public`**: `eyJhbGciOi...`
   - **Project API Keys - `service_role` `secret`**: `eyJhbGciOi...`
3. Add these to your local `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
   ```
4. When deploying to **Vercel**, add the exact same 3 environment variables in **Vercel Dashboard** > **Project Settings** > **Environment Variables**.

---

## 4. Connect Your Custom Gmail SMTP (Free & Unlimited OTPs)
To prevent Supabase's default email provider from rate-limiting verification emails during presentations or tests:
1. In Supabase Dashboard, go to **Authentication** > **Email Settings** (or **Providers** > **Email**).
2. Toggle on **Enable Custom SMTP**.
3. Fill in your Gmail SMTP credentials (matching your `.env.local`):
   - **Sender email**: `techsonancemarketplace@gmail.com`
   - **Sender name**: `ResuMentor`
   - **Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **User**: `techsonancemarketplace@gmail.com`
   - **Password**: `bazjfcovaowunmdy` (Gmail App Password)
4. Click **Save**.

---

## 5. Enable 6-Digit Email OTP
1. Under **Authentication** > **Email Templates**:
2. Select **Confirm signup**:
   - Subject: `Verify your ResuMentor account`
   - In the email body, make sure the 6-digit code variable is present:
     ```html
     <h2>Confirm your signup</h2>
     <p>Your verification code is: <strong>{{ .Token }}</strong></p>
     <p>This code expires in 10 minutes.</p>
     ```
3. Click **Save Changes**.

---

## 6. Verify Backend Connectivity
Once your environment variables are configured, run `npm run dev` and visit:
`http://localhost:3000/api/health/supabase`

You should receive:
```json
{
  "status": "healthy",
  "connected": true,
  "timestamp": "...",
  "provider": "supabase"
}
```
This confirms that both client and server can successfully interact with your database.
