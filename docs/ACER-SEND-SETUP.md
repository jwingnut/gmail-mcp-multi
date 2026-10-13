# Enabling send on the second machine (the Acer laptop)

Sending is off by default. This turns it on for **one machine only**. Every send still needs the user's explicit
approval: the `send_draft` tool tells the agent to show the draft first and wait for a clear yes.

Assumptions: the server folder is already cloned there and registered as an MCP server (same path as before, so
nothing is re-registered), and the secrets bundle (`secrets/`, including `oauth-keys.json`, `config.json` and
`accounts/<alias>/credentials.json`) has already been copied in. The existing tokens already include the
`gmail.compose` scope, which covers sending a draft, so no re-consent is needed.

## Steps (run in the `gmail-mcp-multi` folder)

1. Get the code: `git pull`
   - If git says the histories are unrelated (the repository was recreated clean), run
     `git fetch origin && git reset --hard origin/main` instead. It is safe: `secrets/` is git-ignored.
2. Build: `npm ci && npm run build`
3. Turn sending on for this machine only (keeps every other key in the file):
   `node -e "const f='secrets/config.json',c=require('./'+f);c.allowSend=true;require('fs').writeFileSync(f,JSON.stringify(c,null,2))"`
   The value must be the boolean `true` (no quotes). Anything else leaves sending off.
4. Check the accounts: `node dist/doctor.js` (each account should PASS).
5. Check the tool is on: `node -e "console.log(require('./dist/tools/index.js').getTools(false).map(t=>t.name).join(', '))"`
   The list should now end with `send_draft`.
6. Restart the agent session so it reloads the server. Nothing needs to be re-registered.
7. First test, no sending: ask the agent to create a draft to yourself and read it back with `get_draft`. Only say
   yes to a send when you have seen the draft and want it sent.

## Notes

- Each send is logged to `secrets/send-log.jsonl` (time, account, draft id, message id; no recipients or content).
- Keep `allowSend` false (or absent) on the desktop. If `secrets/` is copied from the desktop again, step 3 must be
  repeated, and never copy this machine's `config.json` back.
- Turn it off again: set `"allowSend": false` in `secrets/config.json` and restart the session.
