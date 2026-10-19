import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const apiDir = path.join(projectRoot, "src", "app", "api");
const appDir = path.join(projectRoot, "src", "app");

// Sentinel cache directory: stores original file contents during build.
// Persists across crashes so the next run can always auto-recover.
const CACHE_DIR = path.join(projectRoot, ".mobile-build-cache");
const STUB_MARKER = "Auto-generated build-time stub for Next.js static mobile export";

// ---------------------------------------------------------------------------
// Crash recovery: if a previous build died before restoring, do it now.
// ---------------------------------------------------------------------------
function recoverFromCrash() {
  if (!fs.existsSync(CACHE_DIR)) return;

  const entries = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json"));
  if (entries.length === 0) return;

  console.log(`[build:mobile] ⚠ Detected ${entries.length} unrestored file(s) from a previous crashed build. Auto-recovering...`);

  for (const entry of entries) {
    const cachePath = path.join(CACHE_DIR, entry);
    try {
      const { originalPath, content } = JSON.parse(fs.readFileSync(cachePath, "utf8"));
      fs.writeFileSync(originalPath, content, "utf8");
      fs.unlinkSync(cachePath);
      console.log(`[build:mobile]   ✓ Restored: ${path.relative(projectRoot, originalPath)}`);
    } catch (e) {
      console.error(`[build:mobile]   ✗ Failed to recover ${entry}:`, e.message);
    }
  }

  // Remove cache dir if now empty
  try {
    if (fs.readdirSync(CACHE_DIR).length === 0) fs.rmdirSync(CACHE_DIR);
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// File finders
// ---------------------------------------------------------------------------
function findRouteFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findRouteFiles(fullPath, fileList);
    } else if (file === "route.ts" || file === "route.js") {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// Find all page files that use "force-dynamic" (incompatible with static export)
function findForceDynamicPages(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findForceDynamicPages(fullPath, fileList);
    } else if (file === "page.tsx" || file === "page.js" || file === "page.ts") {
      const content = fs.readFileSync(fullPath, "utf8");
      if (content.includes('dynamic = "force-dynamic"') || content.includes("dynamic = 'force-dynamic'")) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

// ---------------------------------------------------------------------------
// Cache helpers — write original content to disk before mutating
// ---------------------------------------------------------------------------
const originalContents = new Map();

function cacheAndMutate(filePath, newContent) {
  const original = fs.readFileSync(filePath, "utf8");
  originalContents.set(filePath, original);

  // Persist to crash-recovery cache
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cacheKey = Buffer.from(filePath).toString("base64").replace(/[/+=]/g, "_");
  fs.writeFileSync(
    path.join(CACHE_DIR, `${cacheKey}.json`),
    JSON.stringify({ originalPath: filePath, content: original }),
    "utf8"
  );

  fs.writeFileSync(filePath, newContent, "utf8");
}

// ---------------------------------------------------------------------------
// Stub / restore
// ---------------------------------------------------------------------------
function stubRoutes() {
  const routeFiles = findRouteFiles(apiDir);
  console.log(`[build:mobile] Stubbing ${routeFiles.length} server API routes for static export...`);

  for (const filePath of routeFiles) {
    const stub = `// ${STUB_MARKER}\nexport const dynamic = "force-static";\nexport async function GET() {\n  return new Response(JSON.stringify({ status: "mobile-export" }), {\n    headers: { "Content-Type": "application/json" },\n  });\n}\n`;
    cacheAndMutate(filePath, stub);
  }

  // Patch pages that use "force-dynamic" (not allowed in static export mode)
  const dynamicPages = findForceDynamicPages(appDir);
  if (dynamicPages.length > 0) {
    console.log(`[build:mobile] Patching ${dynamicPages.length} page(s) with force-dynamic -> force-static for static export...`);
    for (const filePath of dynamicPages) {
      const content = fs.readFileSync(filePath, "utf8");
      const patched = content
        .replace(/export const dynamic = "force-dynamic"/g, 'export const dynamic = "force-static"')
        .replace(/export const dynamic = 'force-dynamic'/g, "export const dynamic = 'force-static'");
      cacheAndMutate(filePath, patched);
    }
  }
}

function restoreRoutes() {
  if (originalContents.size > 0) {
    for (const [filePath, content] of originalContents.entries()) {
      try {
        fs.writeFileSync(filePath, content, "utf8");

        // Remove from crash-recovery cache
        const cacheKey = Buffer.from(filePath).toString("base64").replace(/[/+=]/g, "_");
        const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      } catch (err) {
        console.error(`[build:mobile] Failed to restore ${filePath}:`, err.message);
      }
    }
    console.log(`[build:mobile] Restored all ${originalContents.size} stubbed/patched file(s).`);
    originalContents.clear();

    // Remove cache dir if now empty
    try {
      if (fs.existsSync(CACHE_DIR) && fs.readdirSync(CACHE_DIR).length === 0) {
        fs.rmdirSync(CACHE_DIR);
      }
    } catch { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// Signal / error handlers
// ---------------------------------------------------------------------------
process.on("SIGINT", () => { restoreRoutes(); process.exit(1); });
process.on("SIGTERM", () => { restoreRoutes(); process.exit(1); });
process.on("uncaughtException", (err) => {
  console.error("[build:mobile] Uncaught exception:", err);
  restoreRoutes();
  process.exit(1);
});

const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const capBin = path.join(projectRoot, "node_modules", "@capacitor", "cli", "bin", "capacitor");

async function runNodeScript(scriptPath, args, env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [scriptPath, ...args], {
      cwd: projectRoot,
      stdio: "inherit",
      shell: false,
      env: { ...process.env, ...env },
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Script ${path.basename(scriptPath)} failed with exit code ${code}`));
    });
  });
}

function safeCleanDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
    } catch (e) {
      console.warn(`[build:mobile] Notice: ${path.basename(dirPath)} cleanup deferred (${e.code || e.message}), proceeding with build.`);
    }
  }
}

async function main() {
  // Always attempt crash recovery first, before doing anything else
  recoverFromCrash();

  try {
    stubRoutes();

    console.log("[build:mobile] Cleaning previous static export directory...");
    const outDir = path.join(projectRoot, "out");
    safeCleanDir(outDir);
    fs.mkdirSync(path.join(projectRoot, ".next", "server", "pages"), { recursive: true });

    console.log("[build:mobile] Starting Next.js static export build (BUILD_TARGET=mobile)...");
    await runNodeScript(nextBin, ["build"], { BUILD_TARGET: "mobile" });
    console.log("[build:mobile] Static export succeeded -> ./out directory ready.");

  } finally {
    restoreRoutes();
  }

  // After export and API restore, run Capacitor sync
  console.log("[build:mobile] Running Capacitor sync...");
  try {
    await runNodeScript(capBin, ["sync"]);
    console.log("[build:mobile] Capacitor sync completed.");
  } catch (syncError) {
    console.warn("[build:mobile] Capacitor sync notice:", syncError.message);
  }
}

main().catch((err) => {
  console.error("[build:mobile] Failed:", err);
  process.exit(1);
});
