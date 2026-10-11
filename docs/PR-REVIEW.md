# Upstream PR review (dmorrill/gmail-mcp-multi), 2026-10-11

All PRs were read as untrusted code. None contained exfiltration, eval, or network calls other than Google APIs.

| PR | Author | What | Decision |
|----|--------|------|----------|
| #15 | DaveMoudy | Owner-only (0600/0700) permissions for credentials | **Merged** |
| #13 | vzaliva | Per-account OAuth keys, standalone loopback auth script (readonly scope), `--readonly` switch | **Merged** (scopes and sign-in checks changed afterwards in our own commits) |
| #7 | dmorrill | Initial implementation: in-server OAuth, `send_email`, `modify_email` | Rejected: requests send/modify/labels scopes, implements sending, uses `require()` in an ES module, opens a browser via `exec` |
| #9 | bobbymarko | Attachments for `send_email` | Rejected: sends mail, reads any path, unsanitised headers. Idea reused for drafts with path checks |
| #10 | bobbymarko | RFC 2047 subject encoding, bundled with `send_email` | Rejected: re-adds sending. Header encoding re-implemented (plus CR/LF stripping) |
| #11 | bobbymarko | `modify_email`, labels, Gmail filters | Rejected: modify/send, and `create_filter` can auto-forward mail (exfiltration path) |
| #14 (closed) | slobrewer | `get_attachment`, `save_attachment` | Rejected: also adds `send_email`; `save_attachment` writes to any caller-supplied directory and filename. Replaced by `download_attachment` into a quarantine folder with sanitised names |
