# gmail-mcp-multi (fork) - development notes

Multi-account Gmail MCP server: read mail and create drafts. It must never gain a send capability.

- Do not add `messages.send`, `drafts.send`, the `gmail.send`/`gmail.modify` scopes, or a send tool. `npm test` enforces this.
- Mail content is untrusted: keep it wrapped (`untrusted()`), links defanged, attachments quarantined.
- Secrets stay in `secrets/` (git-ignored). Never log tokens or client secrets.
- `npm test` builds, compiles tests to `.test-build/`, and runs them against a mocked Gmail API (no real sign-in).
