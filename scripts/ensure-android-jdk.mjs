import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const androidDir = path.join(projectRoot, "android");
const gradlePropsPath = path.join(androidDir, "gradle.properties");
const localJdkDir = path.join(androidDir, ".jdk");

/**
 * Checks a specific java binary and returns its major version integer (e.g. 17, 21, 26)
 */
function getJavaVersion(javaExecutable) {
  try {
    const output = execSync(`"${javaExecutable}" -version 2>&1`, { encoding: "utf8" });
    const match = output.match(/(?:version|build) "([0-9]+)(?:\.([0-9]+))?/i);
    if (match) {
      const v1 = parseInt(match[1], 10);
      const v2 = match[2] ? parseInt(match[2], 10) : 0;
      // Handle old 1.8 style
      return v1 === 1 ? v2 : v1;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Android Gradle Plugin (AGP) 8.x + Gradle 8.14 compatible range:
 * Java 17 up to Java 21 (LTS). Java 25+ or < 17 causes Gradle Groovy syntax crashes.
 */
function isCompatibleVersion(major) {
  return major !== null && major >= 17 && major <= 21;
}

/**
 * Scans standard system and IDE directories for an existing compatible JDK
 */
function findExistingCompatibleJdk() {
  const candidates = [];
  const homeDir = os.homedir();

  // 1. Project local .jdk
  if (fs.existsSync(localJdkDir)) {
    const entries = fs.readdirSync(localJdkDir);
    for (const entry of entries) {
      candidates.push(path.join(localJdkDir, entry));
    }
    candidates.push(localJdkDir);
  }

  // 2. User .jdks (Android Studio / IntelliJ default)
  const userJdks = path.join(homeDir, ".jdks");
  if (fs.existsSync(userJdks)) {
    try {
      const entries = fs.readdirSync(userJdks);
      for (const entry of entries) {
        candidates.push(path.join(userJdks, entry));
      }
    } catch {}
  }

  // 3. Windows Program Files
  if (process.platform === "win32") {
    const pf = process.env["ProgramFiles"] || "C:\\Program Files";
    const roots = [
      path.join(pf, "Eclipse Adoptium"),
      path.join(pf, "Microsoft"),
      path.join(pf, "Java"),
      path.join(pf, "Amazon Corretto"),
      path.join(pf, "Android", "Android Studio", "jbr"),
    ];

    for (const root of roots) {
      if (fs.existsSync(root)) {
        try {
          const stats = fs.statSync(root);
          if (stats.isDirectory()) {
            candidates.push(root);
            const subEntries = fs.readdirSync(root);
            for (const sub of subEntries) {
              candidates.push(path.join(root, sub));
            }
          }
        } catch {}
      }
    }
  }

  // 4. macOS standard locations
  if (process.platform === "darwin") {
    const macJvm = "/Library/Java/JavaVirtualMachines";
    if (fs.existsSync(macJvm)) {
      try {
        const sub = fs.readdirSync(macJvm);
        for (const s of sub) {
          candidates.push(path.join(macJvm, s, "Contents", "Home"));
        }
      } catch {}
    }
  }

  // 5. Linux standard locations
  if (process.platform === "linux") {
    const linuxJvm = "/usr/lib/jvm";
    if (fs.existsSync(linuxJvm)) {
      try {
        const sub = fs.readdirSync(linuxJvm);
        for (const s of sub) {
          candidates.push(path.join(linuxJvm, s));
        }
      } catch {}
    }
  }

  // Evaluate each candidate
  for (const candidate of candidates) {
    const javaBin = path.join(candidate, "bin", process.platform === "win32" ? "java.exe" : "java");
    if (fs.existsSync(javaBin)) {
      const ver = getJavaVersion(javaBin);
      if (isCompatibleVersion(ver)) {
        return { path: candidate, version: ver };
      }
    }
  }

  return null;
}

export function configureGradleJavaHome(jdkPath) {
  if (!fs.existsSync(gradlePropsPath)) return;

  const normalizedPath = jdkPath.replace(/\\/g, "/");
  let content = fs.readFileSync(gradlePropsPath, "utf8");

  const propRegex = /^org\.gradle\.java\.home=.*$/m;
  const newPropLine = `org.gradle.java.home=${normalizedPath}`;

  if (propRegex.test(content)) {
    content = content.replace(propRegex, newPropLine);
  } else {
    content += `\n# Project-local JDK configured by ResuMentor build pipeline\n${newPropLine}\n`;
  }

  fs.writeFileSync(gradlePropsPath, content, "utf8");
  console.log(`[ResuMentor Env] Configured android/gradle.properties with project-local JDK:\n  -> ${normalizedPath}`);
}

export async function ensureCompatibleJdk() {
  console.log("[ResuMentor Env] Checking active Java environment for Android builds...");

  // Check current system java
  const systemJava = process.platform === "win32" ? "java.exe" : "java";
  const systemVer = getJavaVersion(systemJava);

  if (isCompatibleVersion(systemVer)) {
    console.log(`[ResuMentor Env] ✓ Active system Java (Version ${systemVer}) is fully compatible with Gradle 8.14.`);
    return { success: true, path: null, version: systemVer };
  }

  console.log(`[ResuMentor Env] Active system Java is Version ${systemVer || "Unknown"} (Android Gradle requires Java 17 - 21).`);
  console.log("[ResuMentor Env] Searching for existing compatible JDK locally to avoid modifying global system PATH...");

  const existing = findExistingCompatibleJdk();
  if (existing) {
    console.log(`[ResuMentor Env] ✓ Found compatible JDK ${existing.version} at: ${existing.path}`);
    configureGradleJavaHome(existing.path);
    return { success: true, path: existing.path, version: existing.version };
  }

  console.warn("\n" + "=".repeat(75));
  console.warn("[ResuMentor Notice] No local Java 17 or 21 JDK was detected on this machine.");
  console.warn("To keep your system Java version untouched for other projects, install a local JDK:");
  console.warn("\nOption A (Fastest via Android Studio):");
  console.warn("  1. Open project in Android Studio (npm run cap:android)");
  console.warn("  2. File -> Settings -> Build Tools -> Gradle -> Gradle JDK -> Download JDK (Pick 21 or 17)");
  console.warn("\nOption B (Direct Command):");
  console.warn("  winget install EclipseAdoptium.Temurin.21.JDK");
  console.warn("=".repeat(75) + "\n");

  return { success: false, path: null, version: systemVer };
}

// Allow direct script execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureCompatibleJdk().catch((err) => {
    console.error("[ResuMentor Env] Error during JDK check:", err);
  });
}
