import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ensureCompatibleJdk } from "./ensure-android-jdk.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const androidDir = path.join(projectRoot, "android");

async function runCommand(command, args, cwd = projectRoot, env = {}) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    let cmd = command;
    let spawnCmd = command;
    let spawnArgs = args;

    if (command === "node") {
      spawnCmd = process.execPath;
    } else if (isWindows) {
      if (command.endsWith(".bat") || command.endsWith(".cmd")) {
        spawnCmd = "cmd.exe";
        spawnArgs = ["/d", "/s", "/c", command, ...args];
      } else if (!command.endsWith(".exe")) {
        spawnCmd = "cmd.exe";
        spawnArgs = ["/d", "/s", "/c", `${command}.cmd`, ...args];
      }
    }

    const proc = spawn(spawnCmd, spawnArgs, {
      cwd,
      stdio: "inherit",
      shell: false,
      env: { ...process.env, ...env },
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command ${command} failed with exit code ${code}`));
    });
  });
}

async function main() {
  const mode = process.argv[2] === "debug" ? "debug" : "release";
  const gradleTask = mode === "debug" ? "assembleDebug" : "assembleRelease";

  console.log(`\n======================================================`);
  console.log(`  ResuMentor Mobile Android Build Pipeline (${mode.toUpperCase()})`);
  console.log(`======================================================\n`);

  // Step 1: Detect or auto-configure compatible project-local JDK
  const jdkResult = await ensureCompatibleJdk();
  if (!jdkResult.success) {
    console.error(`\n[Build Aborted] Please configure a local JDK 17 or 21 before building the Android APK.`);
    console.error(`See docs/MOBILE_SETUP_AND_BUILD_GUIDE.md for details.`);
    process.exit(1);
  }

  // Step 2: Build Next.js Static Export & Sync Capacitor Assets
  console.log("\n[1/2] Compiling Next.js static export bundle & syncing assets...");
  await runCommand("node", ["scripts/build-mobile.mjs"]);

  // Step 3: Run Gradle
  console.log(`\n[2/2] Running Gradle ${gradleTask}...`);
  const isWindows = process.platform === "win32";
  const gradlewCmd = isWindows ? ".\\gradlew.bat" : "./gradlew";

  const customEnv = {};
  if (jdkResult.path) {
    customEnv.JAVA_HOME = jdkResult.path;
  }

  await runCommand(gradlewCmd, [gradleTask], androidDir, customEnv);

  // Success output summary
  const apkRelativePath = mode === "release"
    ? "android/app/build/outputs/apk/release/app-release.apk"
    : "android/app/build/outputs/apk/debug/app-debug.apk";

  const fullApkPath = path.join(projectRoot, apkRelativePath);

  console.log(`\n======================================================`);
  console.log(`  ✓ SUCCESS: Android APK Generated Successfully!`);
  console.log(`======================================================`);
  if (fs.existsSync(fullApkPath)) {
    const stats = fs.statSync(fullApkPath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`\n  Output APK:  ${apkRelativePath} (${sizeMb} MB)`);
    console.log(`  Full Path:   ${fullApkPath}`);
  }
  console.log(`\nTo install on your connected device:\n  adb install -r ${apkRelativePath}\n`);
}

main().catch((err) => {
  console.error(`\n[Build Error]:`, err.message);
  process.exit(1);
});
