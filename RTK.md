# RTK - Rust Token Killer (Codex CLI)

Use `rtk` for shell commands when it supports the command shape. It reduces
terminal noise and keeps large outputs manageable.

Examples:

```bash
rtk git status
rtk npm run build
rtk pytest -q
```

If `rtk` intercepts or does not support a command's flags, use the absolute
system binary instead. This matters for discovery commands such as:

```bash
/usr/bin/find . -name .git -type d -prune -print
/Applications/Codex.app/Contents/Resources/rg --files
```

Prefer clean, bounded output either way.
