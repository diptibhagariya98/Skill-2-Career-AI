import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const apiDir = path.join(projectRoot, "src", "app", "api");
const backupApiDir = path.join(projectRoot, "src", ".api-backup");

function restoreApi() {
  if (fs.existsSync(backupApiDir)) {
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true, force: true });
    }
    fs.renameSync(backupApiDir, apiDir);
    console.log("[build:mobile] Restored src/app/api from backup.");
  }
}

process.on("SIGINT", () => {
  restoreApi();
  process.exit(1);
});
process.on("SIGTERM", () => {
  restoreApi();
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("[build:mobile] Uncaught exception:", err);
  restoreApi();
  process.exit(1);
});

async function runCommand(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const cmd = isWindows ? `${command}.cmd` : command;
    const proc = spawn(cmd, args, {
      cwd: projectRoot,
      stdio: "inherit",
      shell: isWindows,
      env: { ...process.env, ...env },
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command ${command} failed with exit code ${code}`));
    });
  });
}

async function main() {
  let moved = false;
  try {
    if (fs.existsSync(apiDir)) {
      if (fs.existsSync(backupApiDir)) {
        fs.rmSync(backupApiDir, { recursive: true, force: true });
      }
      fs.renameSync(apiDir, backupApiDir);
      moved = true;
      console.log("[build:mobile] Temporarily moved src/app/api to exclude server routes from static export.");
    }

    console.log("[build:mobile] Cleaning previous build artifacts...");
    const nextDir = path.join(projectRoot, ".next");
    const outDir = path.join(projectRoot, "out");
    if (fs.existsSync(nextDir)) fs.rmSync(nextDir, { recursive: true, force: true });
    if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

    console.log("[build:mobile] Starting Next.js static export build (BUILD_TARGET=mobile)...");
    await runCommand("npx", ["next", "build"], { BUILD_TARGET: "mobile" });
    console.log("[build:mobile] Static export succeeded -> ./out directory ready.");

  } finally {
    if (moved) {
      restoreApi();
    }
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
