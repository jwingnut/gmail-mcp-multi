# Registering gmail-mcp-multi

**Register it for one dedicated email agent per machine, and for no other agent.** Other agents delegate mail work
to that agent (see [`DRAFT-REQUESTS.md`](DRAFT-REQUESTS.md)). Do not use user scope or global config, because that
gives every agent on the machine Gmail access.

Server command: `node %USERPROFILE%\gmail-mcp-multi\dist\index.js` (run `npm run build` first).
Add `--readonly` to the args to also remove the draft tools.

## Claude Code (project scope, in the email agent's own folder)

Run from the email agent's project folder, so the entry goes into that folder's `.mcp.json`:

```
cd <email-agent-folder>
claude mcp add --scope project gmail-multi -- node %USERPROFILE%\gmail-mcp-multi\dist\index.js
```

Claude Code asks for a one-time approval of project servers the first time that agent runs in the folder. Check that
other agents do not have it: `claude mcp list` run from any other project folder must not list `gmail-multi`.

## Codex (`~/.codex/config.toml`) and Pi (`~/.pi/agent/mcp.json`)

These are global configs. Add the server there only if the dedicated email agent itself runs on that tool; otherwise
leave them untouched. If you must:

```
codex mcp add gmail-multi -- node %USERPROFILE%\gmail-mcp-multi\dist\index.js
pi mcp add gmail-multi --description "Gmail read and drafts (email agent only)" -- node %USERPROFILE%\gmail-mcp-multi\dist\index.js
```

Undo: `claude mcp remove --scope project gmail-multi` (from the folder) · `codex mcp remove gmail-multi` ·
`pi mcp remove gmail-multi`.
