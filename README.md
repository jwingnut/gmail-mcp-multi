# gmail-mcp-multi (fork): read mail and create drafts, cannot send

Fork of [dmorrill/gmail-mcp-multi](https://github.com/dmorrill/gmail-mcp-multi), reworked so an AI agent can
search and read several Gmail accounts and save drafts (with attachments), but **cannot send mail**.

## Safety model

- **No send code.** There is no send tool and no `messages.send` / `drafts.send` call anywhere. `npm test`
  greps the built `dist/` and `src/` and fails if either appears.
- **Scopes:** `gmail.readonly` + `gmail.compose` only. Compose is the minimum Google offers for drafts and
  technically allows sending, which is why the ban is in code. Tokens with any other scope are refused at load.
- **Mail is untrusted.** Tool output is wrapped in an untrusted-content banner, URLs are reduced to `[link: host]`
  (paths and query strings such as reset tokens are dropped), and attachments are saved only into a quarantine
  folder and never opened.
- **Secrets** live in `secrets/` inside the project (git-ignored, owner-only permissions; on Windows the ACL is
  reduced to the current user). They are never logged or echoed; error text is scrubbed of token patterns.
- Attachments for drafts must be absolute paths, at most 20 MB, and cannot come from `secrets/`, `.ssh`, `.aws`, etc.
- `--readonly` (or `GMAIL_MCP_READONLY=1`) also removes the draft tools.

## Setup

1. `npm install && npm run build`
2. Google Cloud console: enable the Gmail API, add scopes `gmail.readonly` and `gmail.compose`, publish the app
   ("In production", so tokens do not expire weekly), create an OAuth client of type **Desktop app**, download its
   JSON and save it as `secrets/oauth-keys.json`. One client serves every account.
3. For each mailbox: `node dist/auth.js <alias> <email>`. Open the printed URL, sign in as that account, allow
   access. The script aborts if you sign in as a different account than `<email>`.
4. Register `node <path>/dist/index.js` as a stdio MCP server in your client.

## Tools

`list_accounts`, `authenticate` (instructions only), `search_emails`, `read_email`, `list_labels`,
`download_attachment` (to quarantine), `create_draft`, `update_draft`. Every tool except `list_accounts` takes an
`account` (alias or email address).

## Upstream PRs

Merged: #15 (owner-only credential permissions), #13 (per-account OAuth keys, standalone auth script,
`--readonly`). Not merged (they add or enable sending, or filter creation which can auto-forward mail):
#7, #9, #10, #11, #14. See `docs/PR-REVIEW.md`.
