# Re-consent runbook (Testing-status Google app)

Google expires refresh tokens of External apps in Testing status after 7 days, so each account must be
re-consented about every 6 days.

## Check

`npm run doctor` (or `node dist/doctor.js [--json] [--offline]`). One line per account with days until expiry;
exit 0 = fine, 1 = within 2 days of expiry, 2 = expired, missing or failing. It makes one read-only
`users.getProfile` call per account (skipped with `--offline`) and prints no secrets. `agentctl doctor` can call it.

## Re-consent (per account: alias `alias1` = user1@example.com, `alias2` = user2@example.com)

1. In its own short call, start the sign-in listener in the background and capture its output to a temp log:
   `node dist/auth.js <alias> <email> > <tmp>/auth_<alias>.log 2>&1 &`
2. Read the `https://accounts.google.com/...` URL from the log. Open it in Chrome (Claude in Chrome, tab group
   with `tabs_context_mcp createIfEmpty`). Do not print or store the URL.
3. On "Google hasn't verified this app" click Continue. On the consent page tick Select all (view email, manage
   drafts), then Continue. The log then says `Authenticated <email> as alias '<alias>'` and `meta.json` is rewritten.
4. Delete the temp log. Run `node dist/doctor.js`: both accounts should show about 7 days.
5. If any page asks for a password, 2FA, or a "choose an account" with no matching signed-in account: stop and
   post a form item naming the account and the prompt. Never type credentials.
6. Create the next ledger task due 6 days later.

The consent for `alias3` (user3@example.com) is optional and needs the account owner's own SSO sign-in.
