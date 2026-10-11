# Registering gmail-mcp-multi (prepared, not applied)

Server command: `node %USERPROFILE%\gmail-mcp-multi\dist\index.js` (run `npm run build` first).
Add `--readonly` to the args to also remove the draft tools.

## Claude Code (user scope, all Claude agents)

```
claude mcp add --scope user gmail-multi -- node %USERPROFILE%\gmail-mcp-multi\dist\index.js
```

## Codex (`~/.codex/config.toml`)

```
codex mcp add gmail-multi -- node %USERPROFILE%\gmail-mcp-multi\dist\index.js
```

or the file form:

```toml
[mcp_servers.gmail-multi]
command = "node"
args = ["%USERPROFILE%\\gmail-mcp-multi\\dist\\index.js"]
startup_timeout_sec = 30
```

## Pi (`~/.pi/agent/mcp.json`)

```
pi mcp add gmail-multi --description "Read Gmail (3 accounts) and create drafts; cannot send" -- node %USERPROFILE%\gmail-mcp-multi\dist\index.js
```

Undo: `claude mcp remove --scope user gmail-multi` · `codex mcp remove gmail-multi` · `pi mcp remove gmail-multi`.
