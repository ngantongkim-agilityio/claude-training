#!/usr/bin/env node
// Claude Code Stop hook: shows a macOS desktop notification when Claude finishes.
// Always exits 0 — notification failures must never block Claude Code.
// No dependencies beyond Node.js builtins.

import { spawnSync } from "node:child_process";

function notify() {
  if (process.platform !== "darwin") return;
  const result = spawnSync(
    "osascript",
    [
      "-e",
      'display notification "Claude Code finished" with title "Claude Code"',
    ],
    { encoding: "utf8", timeout: 10000 },
  );
  if (result.error) {
    process.stderr.write(
      `notify-on-finish: osascript failed to start: ${result.error.message}\n`,
    );
    return;
  }
  if (result.status !== 0) {
    const out = `${result.stderr || ""}${result.stdout || ""}`
      .trim()
      .slice(0, 500);
    process.stderr.write(
      `notify-on-finish: osascript exited ${result.status}${out ? `: ${out}` : ""}\n`,
    );
  }
}

try {
  notify();
} catch (err) {
  process.stderr.write(
    `notify-on-finish: unexpected error: ${err?.message || err}\n`,
  );
}
process.exit(0);
