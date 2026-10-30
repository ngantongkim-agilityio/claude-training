#!/usr/bin/env node
// The one secret-file rule shared by the Claude Code guard and CI.
// A path is secret when its basename is `.env`, `.env.*` (except the
// `.env.sample` / `.env.example` templates), `*.pem` or `id_rsa*`.
// CLI: `node secret-paths.mjs --check-tracked` lists tracked secret files on
// stderr and exits 1, or exits 0 when there are none.
// No dependencies beyond Node.js builtins.

import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const TEMPLATES = new Set([".env.sample", ".env.example"]);

// Sample names used to decide whether a glob could match a secret.
const SECRET_SAMPLES = [".env", ".env.local", "server.pem", "id_rsa"];

const GLOB_CHARS = /[*?[{]/;

// Names are compared in lower case: macOS file systems are case-insensitive,
// so `.ENV.local` opens the same file as `.env.local`.
export function isSecretPath(p) {
  if (typeof p !== "string" || p === "") return false;
  const base = path.basename(p.replace(/[\\/]+$/, "")).toLowerCase();
  if (base === ".env") return true;
  if (base.startsWith(".env.") && !TEMPLATES.has(base)) return true;
  if (base.endsWith(".pem")) return true;
  return base.startsWith("id_rsa");
}

// Convert a ripgrep-style glob (`*`, `**`, `?`, `{a,b}`) to a RegExp over
// `/`-separated paths. Returns null for syntax it cannot model exactly
// (character classes, negation, unbalanced braces).
export function globToRegExp(glob) {
  if (typeof glob !== "string" || /[[\]!\\]/.test(glob)) return null;
  let re = "";
  let depth = 0;
  for (let i = 0; i < glob.length; i += 1) {
    const ch = glob[i];
    if (ch === "*") {
      if (glob[i + 1] === "*") {
        i += 1;
        if (glob[i + 1] === "/") {
          i += 1;
          re += "(?:.*/)?";
        } else {
          re += ".*";
        }
      } else {
        re += "[^/]*";
      }
    } else if (ch === "?") {
      re += "[^/]";
    } else if (ch === "{") {
      depth += 1;
      re += "(?:";
    } else if (ch === "}" && depth > 0) {
      depth -= 1;
      re += ")";
    } else if (ch === "," && depth > 0) {
      re += "|";
    } else {
      re += ch.replace(/[.+^$()|{}]/g, "\\$&");
    }
  }
  if (depth !== 0) return null;
  return new RegExp(`^${re}$`);
}

// Does a glob token aimed at secrets match a secret name? A glob is aimed at
// secrets when its last segment starts with a dot (shell globs only match
// dotfiles that way, e.g. `.e*`) or mentions `.env`, `.pem` or `id_rsa`.
// Broad globs such as `*` are not treated as naming a secret.
function globNamesSecret(glob) {
  const last = glob.split("/").pop().toLowerCase();
  if (!last.startsWith(".") && !/\.env|\.pem|id_rsa/.test(last)) return false;
  const re = globToRegExp(last);
  if (re === null) return true; // Cannot model it — assume it can match.
  // Also try `.env` plus the glob's own suffix (`.en?.staging` →
  // `.env.staging`) and plus its last dotted part (`.*.staging`).
  const samples = [
    ...SECRET_SAMPLES,
    `.env${last.slice(4)}`,
    `.env.${last.split(".").pop()}`,
  ];
  return samples.some((name) => isSecretPath(name) && re.test(name));
}

// Does one shell token name a secret file? Handles redirects (`>.env`,
// `2>>x/.env`), option values (`--env-file=.env`) and secret-aimed globs.
export function namesSecret(token) {
  if (typeof token !== "string" || token === "") return false;
  const bare = token.replace(/^\d*[<>]+&?/, "");
  const candidates = [bare];
  const eq = bare.indexOf("=");
  if (eq !== -1) candidates.push(bare.slice(eq + 1));
  return candidates.some((c) =>
    GLOB_CHARS.test(c) ? globNamesSecret(c) : isSecretPath(c),
  );
}

const WALK_SKIP = new Set([
  "node_modules",
  ".git",
  "dist",
  ".next",
  "coverage",
  ".turbo",
]);
const DEFAULT_WALK_LIMIT = 20000;

function walkLimit() {
  const n = Number(process.env.CLAUDE_GUARD_WALK_LIMIT);
  return Number.isInteger(n) && n >= 0 ? n : DEFAULT_WALK_LIMIT;
}

// List secret files under `root` (relative, `/`-separated). Symlinks are not
// followed (a symlink with a secret name still counts). `complete` is false
// when the walk hit its entry limit or an unreadable directory.
export function findSecretsUnder(root) {
  const limit = walkLimit();
  const secrets = [];
  const stack = [""];
  let seen = 0;
  while (stack.length > 0) {
    const rel = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true });
    } catch {
      return { secrets, complete: false };
    }
    for (const entry of entries) {
      seen += 1;
      if (seen > limit) return { secrets, complete: false };
      const child = rel === "" ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!WALK_SKIP.has(entry.name)) stack.push(child);
      } else if (isSecretPath(entry.name)) {
        secrets.push(child);
      }
    }
  }
  return { secrets, complete: true };
}

export function trackedSecrets(cwd = process.cwd()) {
  const out = execFileSync("git", ["ls-files", "-z"], {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split("\0").filter((p) => p !== "" && isSecretPath(p));
}

function main(argv) {
  if (!argv.includes("--check-tracked")) {
    process.stderr.write("usage: secret-paths.mjs --check-tracked\n");
    return 2;
  }
  let found;
  try {
    found = trackedSecrets();
  } catch (err) {
    process.stderr.write(`secret-paths: git ls-files failed: ${err.message}\n`);
    return 2;
  }
  if (found.length === 0) return 0;
  process.stderr.write("Tracked secret files (remove them from git):\n");
  for (const p of found) process.stderr.write(`  ${p}\n`);
  return 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exit(main(process.argv.slice(2)));
}
