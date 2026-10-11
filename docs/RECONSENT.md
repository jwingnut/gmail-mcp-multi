# Re-consent runbook (only needed if the Google app is back in Testing status)

The Google app is now In production (2026-10-11), so no periodic re-consent is needed. Google expires refresh tokens\nof External apps in Testing status after 7 days; if the app is ever moved back to Testing, set\n`{"publishingStatus": "testing"}` in `secrets/config.json` and re-consent every 6 days as below.

## Check

`npm run doctor` (or `node dist/doctor.js [--json] [--offline]`). One line per account. In production, validity is the\nresult of one live read-only Gmail call (`--offline` skips it and prints SKIP). With the Testing flag it also shows days\nuntil the 7-day expiry. Exit 0 = fine, 1 = within 2 days of expiry (Testing only), 2 = expired, missing or failing. It makes one read-only
`users.getProfile` call per account and prints no secrets. `agentctl doctor` can call it.

## Re-consent (per account: alias `alias1` = user1@example.com, `alias2` = user2@example.com)

1. In its own short call, start the sign-in listener in the background and capture its output to a temp log:
   `node dist/auth.js <alias> <email> > <tmp>/auth_<alias>.log 2>&1 &`
2. Read the `https://accounts.google.com/...` URL from the log. Open it in Chrome (Claude in Chrome, tab group
   with `tabs_context_mcp createIfEmpty`). Do not print or store the URL.
3. On "Google hasn't verified this app" click Continue. On the consent page tick Select all (view email, manage
   drafts), then Continue. The log then says `Authenticated <email> as alias '<alias>'` and `meta.json` is rewritten.
4. Delete the temp log. Run `node dist/doctor.js`: both accounts should pass (in Testing mode: about 7 days left).
5. If any page asks for a password, 2FA, or a "choose an account" with no matching signed-in account: stop and
   post a form item naming the account and the prompt. Never type credentials.
6. Create the next ledger task due 6 days later.

The `alias3` account (user3@example.com) needs the account owner's own SSO sign-in to re-consent.

