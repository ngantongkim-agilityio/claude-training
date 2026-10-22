#!/usr/bin/env node
// Claude Code PostToolUse hook: formats the file affected by an Edit or Write.
// Reads JSON from stdin: { tool_input: { file_path } }
// Always exits 0 — formatting must never fail or block the original edit.
// Diagnostics go to stderr. No dependencies beyond Node.js builtins.

import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const API_DIR = path.join(PROJECT_DIR, "apps", "tax-invoice-api");

const ESLINT_EXTS = new Set(["js", "jsx", "ts", "tsx", "mjs", "cjs"]);
const PRETTIER_EXTS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "json",
  "md",
  "css",
  "yml",
  "yaml",
]);
const EXCLUDED_DIRS = new Set([
  "node_modules",
  "dist",
  "coverage",
  ".turbo",
  ".git",
]);

function fail(message) {
  process.stderr.write(`format-on-edit: ${message}\n`);
}

function main() {
  let filePath = "";
  try {
    const input = JSON.parse(fs.readFileSync(0, "utf8"));
    filePath = input?.tool_input?.file_path || "";
  } catch {
    return; // Not hook JSON — do nothing.
  }
  if (!filePath) return;

  // Normalize: resolve relative paths against the project dir.
  let norm = path.normalize(
    path.isAbsolute(filePath) ? filePath : path.join(PROJECT_DIR, filePath),
  );

  // Repository-boundary check: only format files inside the project dir.
  if (norm !== PROJECT_DIR && !norm.startsWith(PROJECT_DIR + path.sep)) return;

  // Resolve symlinks and re-check the boundary: a path inside the repo may
  // point (directly, or via a symlinked parent directory) to a file outside
  // it, which must never be formatted.
  try {
    norm = fs.realpathSync(norm);
  } catch {
    return;
  }
  if (norm !== PROJECT_DIR && !norm.startsWith(PROJECT_DIR + path.sep)) return;

  // Skip excluded directories and non-regular/missing files.
  const segments = norm.split(path.sep);
  if (segments.some((s) => EXCLUDED_DIRS.has(s))) return;
  let stat;
  try {
    stat = fs.statSync(norm);
  } catch {
    return;
  }
  if (!stat.isFile()) return;

  // Classify the file by extension.
  const ext = path.extname(norm).toLowerCase().replace(/^\./, "");
  if (!PRETTIER_EXTS.has(ext)) return;
  // The eslint flat config only resolves under apps/tax-invoice-api; other
  // trees (e.g. exercises/) get prettier only.
  const useEslint =
    ESLINT_EXTS.has(ext) &&
    (norm === API_DIR || norm.startsWith(API_DIR + path.sep));

  const localBin = (name) => path.join(API_DIR, "node_modules", ".bin", name);
  const resolveBin = (name) => {
    try {
      fs.accessSync(localBin(name), fs.constants.X_OK);
      return localBin(name);
    } catch {
      return name; // Fall back to PATH; spawn failure is handled below.
    }
  };

  const run = (bin, args, cwd) => {
    const result = spawnSync(bin, args, { cwd, encoding: "utf8" });
    if (result.error) {
      if (result.error.code === "ENOENT") {
        fail(
          `'${path.basename(bin)}' not found for ${norm} (run: pnpm install) — skipped.`,
        );
      } else {
        fail(
          `${path.basename(bin)} failed to start on ${norm}: ${result.error.message}`,
        );
      }
      return false;
    }
    if (result.status !== 0) {
      const out = `${result.stderr || ""}${result.stdout || ""}`
        .trim()
        .slice(0, 2000);
      fail(
        `${path.basename(bin)} ${args[0]} failed on ${norm}${out ? `: ${out}` : ""}`,
      );
      return false;
    }
    return true;
  };

  if (useEslint) {
    // Run from the API package dir: ESLint v9 resolves its flat config
    // from the working directory, and the hook may run from anywhere.
    run(resolveBin("eslint"), ["--fix", "--", norm], API_DIR);
  }
  run(resolveBin("prettier"), ["--write", "--", norm], API_DIR);
}

try {
  main();
} catch (err) {
  fail(`unexpected error: ${err?.message || err}`);
}
process.exit(0);
