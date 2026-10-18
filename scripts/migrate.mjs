import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// 1. Load .env.local variables
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

const env = loadEnv();
const dbPassword = env.DATABASE_PASSWORD || "k2OqCvQJls3Sa4cs";

// Extract projectRef dynamically from NEXT_PUBLIC_SUPABASE_URL or DATABASE_URL
const urlMatch = (env.NEXT_PUBLIC_SUPABASE_URL || "").match(/https:\/\/([^.]+)\.supabase\.co/);
const dbMatch = (env.DATABASE_URL || "").match(/postgres\.([^:]+):/);
const projectRef = urlMatch ? urlMatch[1] : (dbMatch ? dbMatch[1] : "nefflnvyoimondewpfwc");

// Connection strings to try (Pooler with IPv4 support first)
const connectionCandidates = [
  env.DATABASE_URL,
  projectRef ? `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres` : null,
  projectRef ? `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres` : null,
].filter(Boolean);

async function connectToDatabase() {
  let lastErr = null;
  for (const connStr of connectionCandidates) {
    try {
      const client = new Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });
      await client.connect();
      return client;
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`Failed to connect to Supabase PostgreSQL database: ${lastErr?.message || "All connection candidates failed."}`);
}

async function runMigrations() {
  console.log("🚀 Initializing Supabase automated migration runner...");
  const client = await connectToDatabase();
  console.log("✅ Successfully connected to Supabase PostgreSQL database.");

  try {
    // 2. Ensure schema migrations tracking table exists
    await client.query(`
      create table if not exists public._schema_migrations (
        version varchar(255) primary key,
        applied_at timestamptz default now()
      );
    `);

    // 3. Find all migration files
    const migrationsDir = path.join(projectRoot, "supabase", "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log("📁 No migrations directory found at supabase/migrations.");
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const { rows: appliedRows } = await client.query("select version from public._schema_migrations");
    const appliedSet = new Set(appliedRows.map((r) => r.version));

    let appliedCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏩ [Skipping] ${file} (already applied)`);
        continue;
      }

      console.log(`⚡ [Applying] ${file}...`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), "utf8");

      await client.query("BEGIN");
      try {
        await client.query(sqlContent);
        await client.query("insert into public._schema_migrations (version) values ($1)", [file]);
        await client.query("COMMIT");
        console.log(`✅ [Applied] ${file}`);
        appliedCount++;
      } catch (migrationErr) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} failed: ${migrationErr.message}`);
      }
    }

    if (appliedCount === 0) {
      console.log("🎉 Database schema is already completely up to date!");
    } else {
      console.log(`🎉 Successfully applied ${appliedCount} new migration(s).`);
    }
  } finally {
    await client.end();
  }
}

runMigrations().catch((err) => {
  console.error("❌ Migration error:", err.message);
  process.exit(1);
});
