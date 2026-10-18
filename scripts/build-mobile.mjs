import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const apiDir = path.join(projectRoot, "src", "app", "api");

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

const originalContents = new Map();

function stubRoutes() {
  const routeFiles = findRouteFiles(apiDir);
  console.log(`[build:mobile] Stubbing ${routeFiles.length} server API routes for static export...`);

  for (const filePath of routeFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    originalContents.set(filePath, content);

    // Replace with static export safe stub
    const stub = `// Auto-generated build-time stub for Next.js static mobile export\nexport const dynamic = "force-static";\nexport async function GET() {\n  return new Response(JSON.stringify({ status: "mobile-export" }), {\n    headers: { "Content-Type": "application/json" },\n  });\n}\n`;
    fs.writeFileSync(filePath, stub, "utf8");
  }
}

function restoreRoutes() {
  if (originalContents.size > 0) {
    for (const [filePath, content] of originalContents.entries()) {
      try {
        fs.writeFileSync(filePath, content, "utf8");
      } catch (err) {
        console.error(`[build:mobile] Failed to restore ${filePath}:`, err.message);
      }
    }
    console.log(`[build:mobile] Restored all ${originalContents.size} server API routes.`);
    originalContents.clear();
  }
}

process.on("SIGINT", () => {
  restoreRoutes();
  process.exit(1);
});
process.on("SIGTERM", () => {
  restoreRoutes();
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("[build:mobile] Uncaught exception:", err);
  restoreRoutes();
  process.exit(1);
});

async function runCommand(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    let cmd = command;
    let useShell = false;

    if (command === "node") {
      cmd = process.execPath;
      useShell = false;
    } else if (isWindows) {
      if (command.endsWith(".bat") || command.endsWith(".cmd")) {
        useShell = true;
      } else if (!command.endsWith(".exe")) {
        cmd = `${command}.cmd`;
        useShell = true;
      }
    }

    const proc = spawn(cmd, args, {
      cwd: projectRoot,
      stdio: "inherit",
      shell: useShell,
      env: { ...process.env, ...env },
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command ${command} failed with exit code ${code}`));
    });
  });
}

async function main() {
  try {
    stubRoutes();

    console.log("[build:mobile] Cleaning previous build artifacts...");
    const nextDir = path.join(projectRoot, ".next");
    const outDir = path.join(projectRoot, "out");
    if (fs.existsSync(nextDir)) fs.rmSync(nextDir, { recursive: true, force: true });
    if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

    console.log("[build:mobile] Starting Next.js static export build (BUILD_TARGET=mobile)...");
    await runCommand("npx", ["next", "build"], { BUILD_TARGET: "mobile" });
    console.log("[build:mobile] Static export succeeded -> ./out directory ready.");

  } finally {
    restoreRoutes();
  }

  // After export and API restore, run Capacitor sync
  console.log("[build:mobile] Running Capacitor sync...");
  try {
    await runCommand("npx", ["cap", "sync"]);
    console.log("[build:mobile] Capacitor sync completed.");
  } catch (syncError) {
    console.warn("[build:mobile] Capacitor sync notice:", syncError.message);
  }
}

main().catch((err) => {
  console.error("[build:mobile] Failed:", err);
  process.exit(1);
});
