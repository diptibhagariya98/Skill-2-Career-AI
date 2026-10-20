import { spawn, execSync } from "child_process";

// ANSI colors for readable terminal formatting
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";

console.log(`${BOLD}${CYAN}\n======================================================${RESET}`);
console.log(`${BOLD}${CYAN}   ResuMentor Android Live Logger & Process Monitor   ${RESET}`);
console.log(`${BOLD}${CYAN}======================================================${RESET}\n`);

// 1. Check for adb
let adbCmd = "adb";
try {
  execSync("adb version", { stdio: "ignore" });
} catch {
  const localSdkAdb = "C:\\Users\\manis\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe";
  try {
    execSync(`"${localSdkAdb}" version`, { stdio: "ignore" });
    adbCmd = `"${localSdkAdb}"`;
  } catch {
    console.error(`${RED}[Error] 'adb' command not found in PATH or Android SDK platform-tools.${RESET}`);
    console.error(`Please ensure Android SDK Platform-Tools are installed.`);
    process.exit(1);
  }
}

// 2. Check connected devices
try {
  const devicesOutput = execSync(`${adbCmd} devices`).toString();
  const lines = devicesOutput
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("List of devices"));

  const connectedDevices = lines.filter((l) => l.includes("\tdevice"));
  const unauthorizedDevices = lines.filter((l) => l.includes("\tunauthorized"));

  if (unauthorizedDevices.length > 0) {
    console.warn(`${YELLOW}[Warning] Device detected but Unauthorized!${RESET}`);
    console.warn(`Please check your phone screen and tap "Always allow from this computer" for USB Debugging.\n`);
  }

  if (connectedDevices.length === 0) {
    console.log(`${YELLOW}No authorized Android device currently detected.${RESET}\n`);
    console.log(`${BOLD}Quick Setup Steps:${RESET}`);
    console.log(` 1. Connect your Android phone via USB cable.`);
    console.log(` 2. On your phone: Settings -> About Phone -> Tap "Build Number" 7 times to enable Developer Options.`);
    console.log(` 3. Go to Settings -> Developer Options -> Enable ${BOLD}"USB Debugging"${RESET}.`);
    console.log(` 4. When the pop-up appears on your phone, tap ${BOLD}"Allow"${RESET}.\n`);
    console.log(`${DIM}Waiting for device to connect (Press Ctrl+C to stop)...${RESET}\n`);
  } else {
    console.log(`${GREEN}✓ Connected Device:${RESET} ${connectedDevices[0].split("\t")[0]}\n`);
  }
} catch (e) {
  console.warn(`${YELLOW}Could not verify devices:${RESET} ${e.message}`);
}

console.log(`${BOLD}Streaming live logs from ResuMentor (Capacitor + Chromium + Process):${RESET}`);
console.log(`${DIM}(Press Ctrl+C to stop)${RESET}\n`);

// Clear previous log buffer before starting live streaming
try {
  execSync(`${adbCmd} logcat -c`, { stdio: "ignore" });
} catch {
  // ignore
}

// Stream logcat with filter
// Capacitor tags: Capacitor, Capacitor/Plugin, Capacitor/Console, chromium, AndroidRuntime
const args = [
  "logcat",
  "-v",
  "time",
  "Capacitor:V",
  "Capacitor/Console:V",
  "Capacitor/Plugin:V",
  "chromium:V",
  "AndroidRuntime:E",
  "*:S", // Suppress other noisy system logs
];

const proc = spawn(adbCmd.replace(/^"|"$/g, ""), args, {
  shell: true,
  stdio: ["inherit", "pipe", "pipe"],
});

proc.stdout.on("data", (data) => {
  const text = data.toString();
  const lines = text.split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;

    // Detect Web Console logs from Chromium
    if (line.includes("chromium") || line.includes("Capacitor/Console")) {
      if (line.includes("tile memory limits exceeded")) {
        console.log(`${YELLOW}[GPU WARN]  ${line.trim()} (Chromium tile compositor pool exceeded - non-fatal)${RESET}`);
      } else if (line.includes("ERROR") || line.includes("ERR_") || line.includes("Uncaught")) {
        console.log(`${RED}[WEB ERROR] ${line.trim()}${RESET}`);
      } else if (line.includes("WARN")) {
        console.log(`${YELLOW}[WEB WARN]  ${line.trim()}${RESET}`);
      } else {
        console.log(`${BLUE}[WEB LOG]   ${line.trim()}${RESET}`);
      }
    }
    // Detect Capacitor Plugin Bridge invocations
    else if (line.includes("Capacitor") || line.includes("Capacitor/Plugin")) {
      console.log(`${CYAN}[BRIDGE]    ${line.trim()}${RESET}`);
    }
    // Detect Android native errors / crashes
    else if (line.includes("AndroidRuntime") || line.includes("FATAL EXCEPTION")) {
      console.log(`${RED}${BOLD}[CRASH]     ${line.trim()}${RESET}`);
    } else {
      console.log(`${DIM}${line.trim()}${RESET}`);
    }
  }
});

proc.stderr.on("data", (data) => {
  const errText = data.toString().trim();
  if (errText) {
    console.error(`${RED}[ADB] ${errText}${RESET}`);
  }
});

proc.on("close", (code) => {
  console.log(`\n${DIM}Logger exited with code ${code}.${RESET}`);
});

process.on("SIGINT", () => {
  proc.kill();
  process.exit(0);
});
