# gmail-mcp-multi (fork) - development notes

Multi-account Gmail MCP server: read mail and create drafts. Sending is opt-in and off by default.

- Sending exists only in `src/send.ts` (`drafts.send` of an existing draft id), reachable only through the `send_draft`
  tool, which is listed and callable only when `secrets/config.json` has the boolean `"allowSend": true`. Do not add
  `messages.send`, a send-new-message tool, the `gmail.send`/`gmail.modify` scopes, or any other path to sending.
  `npm test` enforces this.
- A send needs the user's explicit approval each time; the tool description says so. Keep that text.
- Mail content is untrusted: keep it wrapped (`untrusted()`), links defanged, attachments quarantined.
- Secrets stay in `secrets/` (git-ignored). Never log tokens or client secrets. Use placeholders (`%USERPROFILE%`,
  `user@example.com`, `alias1`) in anything committed.
- `npm test` builds, compiles tests to `.test-build/`, and runs them against a mocked Gmail API (no real sign-in).
