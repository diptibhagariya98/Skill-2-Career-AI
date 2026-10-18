/**
 * Super Admin Seeder Script
 * Creates or updates the Super Admin user in Supabase Auth & public.profiles
 *
 * Usage:
 *   npm run seed:admin
 *   SUPER_ADMIN_EMAIL=custom@domain.com SUPER_ADMIN_PASSWORD=MySecretPassword! npm run seed:admin
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// 1. Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(projectRoot, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
      env[key] = val;
    }
  }
  return env;
}

const fileEnv = loadEnv();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// 2. Super Admin default credentials (overridable via process.env)
const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || fileEnv.SUPER_ADMIN_EMAIL || "superadmin@resumentor.app").trim().toLowerCase();
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || fileEnv.SUPER_ADMIN_PASSWORD || "SuperAdmin@2026!";
const SUPER_ADMIN_NAME = (process.env.SUPER_ADMIN_NAME || fileEnv.SUPER_ADMIN_NAME || "Super Admin").trim();

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedSuperAdmin() {
  console.log("=================================================");
  console.log("🚀  ResuMentor Super Admin Seeding Script");
  console.log("=================================================");
  console.log(`📡 Connecting to Supabase: ${supabaseUrl}`);
  console.log(`👤 Target Super Admin Email: ${SUPER_ADMIN_EMAIL}`);

  try {
    // Step 1: Check if user already exists in auth.users
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listError) {
      throw new Error(`Failed to query Supabase Auth users: ${listError.message}`);
    }

    let existingUser = userList?.users?.find(
      (u) => (u.email || "").trim().toLowerCase() === SUPER_ADMIN_EMAIL
    );

    let userId = "";

    if (existingUser) {
      userId = existingUser.id;
      console.log(`🔍 Existing account located (ID: ${userId}). Updating credentials & role...`);

      const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
        password: SUPER_ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          ...existingUser.user_metadata,
          name: SUPER_ADMIN_NAME,
          full_name: SUPER_ADMIN_NAME,
          role: "admin",
        },
      });

      if (updateErr) {
        throw new Error(`Failed to update auth credentials: ${updateErr.message}`);
      }
      console.log("✅ Supabase Auth user updated with password and role: admin.");
    } else {
      console.log("✨ Account does not exist yet. Creating new Super Admin account...");

      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: SUPER_ADMIN_NAME,
          full_name: SUPER_ADMIN_NAME,
          role: "admin",
        },
      });

      if (createErr || !created?.user) {
        throw new Error(`Failed to create Super Admin user: ${createErr?.message}`);
      }

      userId = created.user.id;
      console.log(`✅ Supabase Auth Super Admin created (ID: ${userId}).`);
    }

    // Step 2: Ensure public.profiles table has role = 'admin'
    console.log("📝 Upserting into public.profiles database table...");
    const { error: profileErr } = await supabase.from("profiles").upsert({
      id: userId,
      email: SUPER_ADMIN_EMAIL,
      name: SUPER_ADMIN_NAME,
      role: "admin",
      updated_at: new Date().toISOString(),
    });

    if (profileErr) {
      console.warn(`⚠️ Warning when updating public.profiles: ${profileErr.message}`);
    } else {
      console.log("✅ public.profiles updated with role = 'admin'.");
    }

    // Step 3: Print summary
    console.log("\n=================================================");
    console.log("🎉  SUPER ADMIN SEEDED SUCCESSFULLY!");
    console.log("=================================================");
    console.log("🔑  Login Credentials:");
    console.log(`    Email:    ${SUPER_ADMIN_EMAIL}`);
    console.log(`    Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log(`    Role:     admin`);
    console.log(`    Name:     ${SUPER_ADMIN_NAME}`);
    console.log("=================================================\n");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
}

seedSuperAdmin();
