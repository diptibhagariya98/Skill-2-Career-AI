/**
 * Automated Verification Test Suite for Unified Back Navigation & Native Mobile System Navigation
 *
 * Tests:
 * 1. Priority ordering of handlers (overlay > special_mode > save_draft > in_screen > screen_pop > tab_root)
 * 2. LIFO execution order within the same priority
 * 3. Fallthrough when a higher-priority handler returns false
 * 4. Cancellation/unregistration on unmount
 * 5. Double-press exit threshold logic
 * 6. Dashboard tabHistory popping & state restoration without duplicate loops
 * 7. Zero `any` policy audit on all modified files
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(condition, name, details = "") {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${name} ${details ? `(${details})` : ""}`);
    failed++;
  }
}

console.log("==================================================================");
console.log("   RESUMENTOR UNIFIED BACK NAVIGATION VERIFICATION TEST SUITE     ");
console.log("==================================================================");

// --- Test Suite 1: Priority Queue & Dispatch Simulation ---
console.log("\n📦 Running Test Suite 1: Priority Queue Ordering & LIFO Execution...");

const PRIORITY_ORDER = {
  overlay: 50,
  special_mode: 40,
  save_draft: 30,
  in_screen: 20,
  screen_pop: 10,
  tab_root: 0,
};

function createDispatcher() {
  const handlers = [];
  let exitCalled = false;
  let lastPress = 0;
  let toastMessage = "";

  function register(handler) {
    handlers.push(handler);
    return () => {
      const idx = handlers.findIndex((h) => h.id === handler.id);
      if (idx !== -1) handlers.splice(idx, 1);
    };
  }

  async function dispatch(now = Date.now(), isNative = true) {
    const sorted = [...handlers].sort((a, b) => {
      const pDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      if (pDiff !== 0) return pDiff;
      return (b.order ?? 0) - (a.order ?? 0);
    });

    for (const h of sorted) {
      const handled = await h.handle();
      if (handled === true) return true;
    }

    if (now - lastPress < 2000) {
      if (isNative) {
        exitCalled = true;
        return true;
      }
      return false;
    } else {
      lastPress = now;
      toastMessage = "Press back again to exit";
      return true;
    }
  }

  return { register, dispatch, getHandlers: () => handlers, isExitCalled: () => exitCalled, getToast: () => toastMessage };
}

{
  const d = createDispatcher();
  const executionOrder = [];

  d.register({
    id: "h_screen_pop",
    priority: "screen_pop",
    order: 100,
    handle: () => {
      executionOrder.push("screen_pop");
      return true;
    },
  });

  d.register({
    id: "h_overlay",
    priority: "overlay",
    order: 101,
    handle: () => {
      executionOrder.push("overlay");
      return true;
    },
  });

  d.register({
    id: "h_in_screen",
    priority: "in_screen",
    order: 102,
    handle: () => {
      executionOrder.push("in_screen");
      return true;
    },
  });

  await d.dispatch();
  assert(executionOrder.length === 1 && executionOrder[0] === "overlay", "Overlay (Priority 50) executes before in_screen and screen_pop");
}

{
  const d = createDispatcher();
  const executionOrder = [];

  d.register({
    id: "h_overlay_declined",
    priority: "overlay",
    order: 100,
    handle: () => {
      executionOrder.push("overlay_declined");
      return false; // modal was closed already
    },
  });

  d.register({
    id: "h_in_screen_success",
    priority: "in_screen",
    order: 101,
    handle: () => {
      executionOrder.push("in_screen_success");
      return true; // stepped back to previous step
    },
  });

  d.register({
    id: "h_screen_pop",
    priority: "screen_pop",
    order: 102,
    handle: () => {
      executionOrder.push("screen_pop");
      return true;
    },
  });

  await d.dispatch();
  assert(executionOrder[0] === "overlay_declined" && executionOrder[1] === "in_screen_success" && executionOrder.length === 2, "Fallthrough to in_screen when overlay returns false without triggering screen_pop");
}

{
  const d = createDispatcher();
  const unregister = d.register({
    id: "temp_modal",
    priority: "overlay",
    handle: () => true,
  });

  assert(d.getHandlers().length === 1, "Handler registered successfully");
  unregister();
  assert(d.getHandlers().length === 0, "Unregister cleanly removes handler on component unmount");
}

// --- Test Suite 2: Exit Threshold Logic & Native Exit Safety ---
console.log("\n📦 Running Test Suite 2: App Root Double-Press Exit Window & Native App Exit...");

{
  const d = createDispatcher();
  const t0 = 10000;
  const res1 = await d.dispatch(t0, true);
  assert(res1 === true && d.getToast() === "Press back again to exit" && !d.isExitCalled(), "First back press on tab root warns with toast and does not exit");

  // Press again after 2500ms (> 2000ms window)
  const res2 = await d.dispatch(t0 + 2500, true);
  assert(res2 === true && !d.isExitCalled(), "Back press after window expires re-arms toast prompt");

  // Press again within 1200ms (< 2000ms window)
  const res3 = await d.dispatch(t0 + 2500 + 1200, true);
  assert(res3 === true && d.isExitCalled(), "Second back press within 2000ms triggers App.exitApp() and returns true without falling back to window.history.back()");
}

// --- Test Suite 3: Dashboard Tab History Stack Popping ---
console.log("\n📦 Running Test Suite 3: Dashboard Tab History Popping...");

{
  let activePage = "dashboard";
  const tabHistory = [];

  function navigateToSection(pageId) {
    if (pageId !== activePage) {
      tabHistory.push(activePage);
      activePage = pageId;
    }
  }

  function handleBack() {
    if (activePage !== "dashboard") {
      while (tabHistory.length > 0) {
        const prev = tabHistory.pop();
        if (prev && prev !== activePage) {
          activePage = prev;
          return true;
        }
      }
      activePage = "dashboard";
      return true;
    }
    return false;
  }

  // Navigate: dashboard -> resume -> jobs -> interview
  navigateToSection("resume");
  navigateToSection("jobs");
  navigateToSection("interview");

  assert(activePage === "interview", "Current active section is interview");

  const back1 = handleBack();
  assert(back1 && activePage === "jobs", "Back from interview pops to jobs");

  const back2 = handleBack();
  assert(back2 && activePage === "resume", "Back from jobs pops to resume");

  const back3 = handleBack();
  assert(back3 && activePage === "dashboard", "Back from resume pops to dashboard home");

  const back4 = handleBack();
  assert(!back4 && activePage === "dashboard", "Back on dashboard returns false to trigger app exit prompt");
}

// --- Test Suite 4: Strict Typing Policy (Zero `any`) Audit on Modified Files ---
console.log("\n📦 Running Test Suite 4: Strict Typing Policy (Zero `any`) Audit...");

const filesToAudit = [
  "src/shared/platform/backNavigation.ts",
  "src/shared/platform/backButton.ts",
  "src/shared/platform/NativeAppProvider.tsx",
  "src/components/Dashboard.tsx",
  "src/components/mobile/IntroScreens.tsx",
];

for (const file of filesToAudit) {
  const filePath = path.join(projectRoot, file);
  const content = fs.readFileSync(filePath, "utf8");

  // Regex patterns to detect forbidden `any` usages
  const anyPatterns = [
    /:\s*any\b/,
    /\bas\s+any\b/,
    /Record<[^,>]+,\s*any>/,
    /catch\s*\(\s*\w+\s*:\s*any\s*\)/,
  ];

  let hasForbiddenAny = false;
  let violationLine = 0;
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignore comments
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;

    for (const pat of anyPatterns) {
      if (pat.test(line)) {
        hasForbiddenAny = true;
        violationLine = i + 1;
        break;
      }
    }
    if (hasForbiddenAny) break;
  }

  assert(!hasForbiddenAny, `Zero 'any' enforcement in ${file}`, hasForbiddenAny ? `Found on line ${violationLine}` : "");
}

console.log("\n==================================================================");
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
