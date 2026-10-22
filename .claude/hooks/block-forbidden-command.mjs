#!/usr/bin/env node
// Claude Code PreToolUse hook: blocks forbidden Bash commands before execution.
// Reads JSON from stdin: { tool_input: { command } }
// Exit 2 + stderr message = block, exit 0 = allow.
// Rules enforce this repository's policies: never push to main, never
// force-push (see .claude/rules/git-conventions.md).
// No dependencies beyond Node.js builtins.

import path from "node:path";
import fs from "node:fs";
import { spawnSync, execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// ---------------------------------------------------------------------------
// 1. Command parsing: shell-aware splitting and tokenizing (not regex alone).
// ---------------------------------------------------------------------------

const SEPARATORS = new Set([";", "&", "|", "(", ")"]);

function isSeparatorChar(ch) {
  return (
    ch === ";" ||
    ch === "&" ||
    ch === "|" ||
    ch === "(" ||
    ch === ")" ||
    ch === "\n"
  );
}

// Split a shell command line into top-level command segments plus any nested
// commands from $(...) and `...` substitutions (evaluated by the shell).
// Returns { segments: string[], nested: string[] } or null when the line
// cannot be parsed reliably (e.g. unbalanced quotes). Unparseable input is
// left alone by the caller: the shell itself would reject it too.
export function splitCommands(line) {
  const segments = [];
  const nested = [];
  let current = "";
  let quote = null;
  let escaped = false;
  let parenDepth = 0;
  let i = 0;

  const pushSegment = () => {
    if (current.trim() !== "") segments.push(current.trim());
    current = "";
  };

  while (i < line.length) {
    const ch = line[i];

    if (escaped) {
      current += ch;
      escaped = false;
      i += 1;
      continue;
    }
    if (ch === "\\" && quote !== "'") {
      escaped = true;
      current += ch;
      i += 1;
      continue;
    }
    if (quote) {
      if (ch === quote) quote = null;
      current += ch;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
      i += 1;
      continue;
    }
    // Command substitution: $(...) — but not arithmetic $((...)).
    if (ch === "$" && line[i + 1] === "(") {
      if (line[i + 2] === "(") {
        current += "$((";
        i += 3;
        continue;
      }
      const inner = readBalanced(line, i + 2, "(", ")");
      if (inner === null) return null;
      nested.push(inner.content);
      current += " ";
      i = inner.end + 1;
      continue;
    }
    // Command substitution: `...` (no nesting inside POSIX backticks).
    if (ch === "`") {
      let j = i + 1;
      let body = "";
      let found = false;
      while (j < line.length) {
        if (line[j] === "\\" && j + 1 < line.length) {
          body += line[j + 1];
          j += 2;
          continue;
        }
        if (line[j] === "`") {
          found = true;
          break;
        }
        body += line[j];
        j += 1;
      }
      if (!found) return null;
      nested.push(body);
      current += " ";
      i = j + 1;
      continue;
    }
    if (ch === "(" || ch === ")") {
      if (ch === "(") parenDepth += 1;
      else {
        if (parenDepth === 0) {
          pushSegment();
          i += 1;
          continue;
        }
        parenDepth -= 1;
      }
      pushSegment();
      i += 1;
      continue;
    }
    if (isSeparatorChar(ch)) {
      // Collapse multi-char operators (&&, ||, ;;, 2>, |&); details do not
      // matter here — each side becomes its own segment.
      pushSegment();
      i += 1;
      continue;
    }
    current += ch;
    i += 1;
  }

  if (quote !== null || escaped) return null;
  pushSegment();
  return { segments, nested };
}

// Read a balanced (...) region starting after the opening paren.
// Returns { content, end } (end = index of closing paren) or null.
function readBalanced(line, start, open, close) {
  let depth = 1;
  let quote = null;
  let escaped = false;
  let content = "";
  for (let i = start; i < line.length; i += 1) {
    const ch = line[i];
    if (escaped) {
      content += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\" && quote !== "'") {
      escaped = true;
      content += ch;
      continue;
    }
    if (quote) {
      if (ch === quote) quote = null;
      content += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      content += ch;
      continue;
    }
    if (ch === open) depth += 1;
    if (ch === close) {
      depth -= 1;
      if (depth === 0) return { content, end: i };
    }
    content += ch;
  }
  return null;
}

// Quote-aware argv split. Returns null when quotes are unbalanced.
export function tokenize(segment) {
  const argv = [];
  let current = "";
  let quote = null;
  let escaped = false;
  let hasToken = false;

  for (const ch of segment) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      hasToken = true;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      hasToken = true;
      continue;
    }
    if (ch === " " || ch === "\t") {
      if (hasToken) {
        argv.push(current);
        current = "";
        hasToken = false;
      }
      continue;
    }
    current += ch;
    hasToken = true;
  }
  if (quote !== null || escaped) return null;
  if (hasToken) argv.push(current);
  return argv;
}

// ---------------------------------------------------------------------------
// 2. Rule checking against this repository's Git policies.
// ---------------------------------------------------------------------------

const SHELLS = new Set(["sh", "bash", "dash", "zsh"]);

// Prefix wrappers whose own flags/values must be skipped to reach the real
// command: { flags taking a separate value } + skipPositional count.
const WRAPPER_RULES = {
  sudo: {
    values: new Set([
      "-u",
      "-g",
      "-h",
      "-p",
      "-r",
      "-t",
      "-C",
      "-D",
      "-R",
      "-T",
      "-U",
    ]),
    skipPositional: 0,
  },
  env: { values: new Set(["-u", "-C", "-S"]), skipPositional: 0 },
  command: { values: new Set(["-v", "-V"]), skipPositional: 0 },
  nice: { values: new Set(["-n"]), skipPositional: 0 },
  nohup: { values: new Set(), skipPositional: 0 },
  time: { values: new Set(), skipPositional: 0 },
  exec: { values: new Set(["-a"]), skipPositional: 0 },
  timeout: { values: new Set(["-s", "-k"]), skipPositional: 1 }, // timeout DURATION cmd
};

// Long wrapper options taking a separate value (besides --opt=value form).
const WRAPPER_LONG_VALUES = new Set([
  "--user",
  "--group",
  "--hosts",
  "--prompt",
  "--role",
  "--type",
  "--close-from",
  "--directory",
  "--chdir",
  "--unset",
  "--signal",
  "--kill-after",
  "--adjustment",
]);

// Short/long options of `git push` that consume the following token as a
// value, so it is never mistaken for a flag or refspec.
const VALUE_OPTIONS = new Set([
  "--repo",
  "--receive-pack",
  "--exec",
  "-o",
  "--push-option",
]);

// Strip VAR=x assignments and prefix wrapper commands (sudo, env, timeout,
// ...) including their flags, to reach the real command. `eval ...` joins its
// arguments into a new command for recursive checking.
// Returns { argv } to check, or { nested } for recursive checking.
function unwrap(argv) {
  let rest = argv;
  for (;;) {
    if (rest.length === 0) return { argv: [] };
    const [head, ...tail] = rest;
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(head)) {
      rest = tail; // VAR=x environment prefix
      continue;
    }
    const base = path.basename(head);
    if (base === "eval") {
      return { nested: tail.join(" ") }; // eval runs its args as a command
    }
    const rule = WRAPPER_RULES[base];
    if (rule) {
      rest = skipWrapperArgs(tail, rule);
      continue;
    }
    if (SHELLS.has(base)) {
      const cIndex = tail.findIndex(
        (t) => t === "-c" || t === "-ec" || t === "-ce",
      );
      if (cIndex !== -1 && cIndex + 1 < tail.length) {
        return { nested: tail[cIndex + 1] }; // sh -c '...' runs this command
      }
      return { argv: [] }; // sh script.sh — not inspectable, allow
    }
    return { argv: rest };
  }
}

// Skip a wrapper's flags (and their values) plus fixed positional args
// (e.g. timeout's DURATION) so the wrapped command is next.
function skipWrapperArgs(args, rule) {
  let rest = args;
  for (;;) {
    if (rest.length === 0) return rest;
    const [head, ...tail] = rest;
    if (head === "--") return tail;
    if (!head.startsWith("-") || head === "-") break;
    if (head.includes("=")) {
      rest = tail; // --opt=value
      continue;
    }
    if (rule.values.has(head) || WRAPPER_LONG_VALUES.has(head)) {
      rest = tail.slice(1); // flag with a separate value
      continue;
    }
    rest = tail; // value-less flag
  }
  return rest.slice(rule.skipPositional);
}

function stripForcePrefix(ref) {
  return ref.startsWith("+") ? ref.slice(1) : ref;
}

// Does this refspec update the remote `main` branch?
function targetsMain(refspec, branch) {
  const ref = stripForcePrefix(refspec);
  if (!ref.includes(":")) {
    // Bare word: `git push <remote> main` means remote "main" by position,
    // but blocking matches long-standing hook behavior and is the safe side.
    // A bare `HEAD` follows the current branch.
    if (ref === "HEAD") return branch === "main";
    return ref === "main" || ref === "refs/heads/main";
  }
  const [, dst] = ref.split(":");
  if (dst === "") return false;
  if (dst === "HEAD") return branch === "main";
  return dst === "main" || dst === "refs/heads/main";
}

function currentBranch() {
  try {
    const out = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: PROJECT_DIR,
      encoding: "utf8",
      timeout: 10000,
    }).trim();
    if (out === "" || out === "HEAD") return null;
    return out;
  } catch {
    return null; // Not a repo or git unavailable — allow, do not false-block.
  }
}

// Check one unwrapped argv. Returns a block reason or null (allow).
// `branch` is the current branch name, or null when unknown.
export function checkArgv(argv, branch) {
  if (argv.length === 0) return null;
  if (path.basename(argv[0]) !== "git") return null;

  // Skip git global options to find the subcommand: every dash-token here
  // is an option (never the subcommand). Value-taking globals consume theirs.
  let i = 1;
  for (; i < argv.length; i += 1) {
    const t = argv[i];
    if (!t.startsWith("-") || t === "-") break; // subcommand found
    if (t === "-C" || t === "--git-dir" || t === "--work-tree" || t === "-c") {
      i += 1; // consume the option's value
      continue;
    }
    if (t.startsWith("-C") || t.includes("=")) continue; // attached value
    // Other globals (--no-pager, --bare, ...) take no value.
  }
  if (i >= argv.length || argv[i] !== "push") return null;
  i += 1;

  let deleteMode = false;
  let seenMirror = false;
  let seenAll = false;
  let dryRun = false;
  const positionals = [];
  for (; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === "--") {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    // Any --force* spelling git accepts belongs to the force family
    // (including unambiguous abbreviations like --forc or --force-w).
    if (t.startsWith("--force")) {
      return "Blocked: force pushes are not allowed.";
    }
    if (t === "--mirror" || t.startsWith("--mirr")) {
      seenMirror = true;
      continue;
    }
    if (t === "--delete" || t === "-d" || t.startsWith("--del")) {
      deleteMode = true;
      continue;
    }
    if (t === "--dry-run" || t === "-n") {
      dryRun = true; // dry-run changes nothing on the remote
      continue;
    }
    if (VALUE_OPTIONS.has(t)) {
      i += 1; // consume option value
      continue;
    }
    if (t.includes("=") && t.startsWith("--")) continue; // --opt=value
    if (t.startsWith("--")) continue; // other long flags (e.g. --tags, --all)
    if (t.startsWith("-") && t.length > 1) {
      // Short-flag bundle: only `f` is forbidden (e.g. -f, -vf).
      if ([...t.slice(1)].includes("f")) {
        return "Blocked: force pushes are not allowed.";
      }
      continue;
    }
    positionals.push(t);
  }

  if (dryRun) return null; // dry-run previews without changing the remote

  if (seenMirror) {
    return "Blocked: mirror pushes rewrite remote refs and are not allowed.";
  }

  // positionals[0] is the remote (or the only refspec); the rest are refspecs.
  const refspecs = positionals.length > 1 ? positionals.slice(1) : positionals;
  const targets = refspecs.filter((r) => targetsMain(r, branch));
  if (targets.length > 0) {
    if (deleteMode) {
      return "Blocked: deleting the remote main branch is not allowed.";
    }
    return "Blocked: direct pushes to main are not allowed (use a feature branch and a merge request).";
  }

  // Bare `git push` (or `... HEAD` with no other refspecs) follows the
  // current branch — block only when it is provably main.
  const bare =
    positionals.length === 0 ||
    (positionals.length === 1 && positionals[0] === "HEAD");
  if (bare && branch === "main") {
    return "Blocked: pushing the main branch is not allowed (use a feature branch and a merge request).";
  }

  return null;
}

// ---------------------------------------------------------------------------
// 3. Blocking logic: check every segment and nested command; first hit wins.
// ---------------------------------------------------------------------------

export function checkCommand(command, branch) {
  const parsed = splitCommands(command);
  if (parsed === null) return null; // Unparseable — the shell would fail too.
  const queue = [...parsed.segments, ...parsed.nested];
  const resolvedBranch = branch === undefined ? currentBranch() : branch;

  while (queue.length > 0) {
    const item = queue.shift();
    const argv = tokenize(item);
    if (argv === null) continue; // Unparseable segment — shell would fail too.
    const unwrapped = unwrap(argv);
    if (unwrapped.nested) {
      const inner = splitCommands(unwrapped.nested);
      if (inner !== null) queue.push(...inner.segments, ...inner.nested);
      continue;
    }
    const reason = checkArgv(unwrapped.argv, resolvedBranch);
    if (reason !== null) return reason;
  }
  return null;
}

function main() {
  let command = "";
  try {
    const input = JSON.parse(fs.readFileSync(0, "utf8"));
    command = input?.tool_input?.command || "";
  } catch {
    return 0; // Not hook JSON — allow.
  }
  if (typeof command !== "string" || command.trim() === "") return 0;

  const reason = checkCommand(command);
  if (reason !== null) {
    process.stderr.write(`${reason}\n`);
    return 2; // Block.
  }
  return 0; // Allow.
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exit(main());
}
