#!/bin/sh
# Claude Code PreToolUse hook: blocks git push to main and force pushes.
# Reads JSON from stdin: { tool_name, tool_input: { command } }
# Exit 2 = block (with stderr message), exit 0 = allow.

cmd=$(python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("tool_input",{}).get("command",""))' 2>/dev/null)

# Fallback: if python3 unavailable or input is not JSON, allow (do not false-block)
if [ -z "$cmd" ]; then
  exit 0
fi

# Only inspect git push commands
case "$cmd" in
  *"git push"*) ;;
  *) exit 0 ;;
esac

# Block pushes targeting main: "push ... main", "push ... HEAD:main", "push main"
if echo "$cmd" | grep -qE 'git push.*(^|[[:space:]:])main([[:space:]]|$)'; then
  echo "Blocked: direct pushes to main are not allowed (use a feature branch and a merge request)." >&2
  exit 2
fi

# Block force variants: --force, --force-with-lease, standalone -f flag for push
if echo "$cmd" | grep -qE -- '--force'; then
  echo "Blocked: force pushes are not allowed." >&2
  exit 2
fi
if echo "$cmd" | grep -qE '(^|[[:space:]])push[[:space:]]+(-[a-zA-Z]*f)'; then
  echo "Blocked: force pushes are not allowed." >&2
  exit 2
fi
if echo "$cmd" | grep -qE '[[:space:]]-f([[:space:]]|$)'; then
  # Only treat -f as force when git push is present (already gated above)
  echo "Blocked: force pushes are not allowed." >&2
  exit 2
fi

exit 0
