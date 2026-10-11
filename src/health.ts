import * as fs from "fs";
import * as path from "path";
import { AccountManager } from "./accounts.js";
import { ClientProvider, GmailClient } from "./gmail.js";

/** Google expires refresh tokens of Testing-status external apps after 7 days. */
export const TESTING_TOKEN_DAYS = 7;
export const WARN_DAYS = 2;

export interface AccountHealth {
  alias: string;
  email: string;
  status: "ok" | "warn" | "expired" | "missing";
  consentedAt?: string;
  daysLeft?: number;
  detail: string;
}

export function daysLeft(consentedAtIso: string, now: Date = new Date()): number {
  const ageDays = (now.getTime() - new Date(consentedAtIso).getTime()) / 86_400_000;
  return Math.round((TESTING_TOKEN_DAYS - ageDays) * 10) / 10;
}

/**
 * Per-account token check. Offline: age since consent only. Live (default): also one read-only
 * users.getProfile call, which fails with invalid_grant once Google has expired the refresh token.
 */
export async function checkAccounts(
  am: AccountManager = new AccountManager(),
  opts: { live?: boolean; provider?: ClientProvider; now?: Date } = {}
): Promise<AccountHealth[]> {
  const provider = opts.provider ?? new GmailClient(am);
  const out: AccountHealth[] = [];
  for (const acct of am.listAccounts()) {
    const base = { alias: acct.alias, email: acct.email };
    if (!acct.authenticated) {
      out.push({ ...base, status: "missing", detail: "not authenticated; run auth.js" });
      continue;
    }
    const metaPath = path.join(path.dirname(am.getCredentialsPath(acct.alias)), "meta.json");
    let consentedAt: string | undefined;
    if (fs.existsSync(metaPath)) consentedAt = JSON.parse(fs.readFileSync(metaPath, "utf-8")).consented_at;
    const left = consentedAt ? daysLeft(consentedAt, opts.now) : undefined;

    let liveError: string | undefined;
    if (opts.live !== false) {
      try {
        const gmail = await provider.getClient(acct.alias);
        await gmail.users.getProfile({ userId: "me" });
      } catch (e) {
        liveError = e instanceof Error ? e.message.split("\n")[0].slice(0, 120) : "error";
      }
    }
    let status: AccountHealth["status"] = "ok";
    let detail = left === undefined ? "consent date unknown" : `${left} days until the Testing token expires`;
    if (liveError) {
      status = "expired";
      detail = `Gmail call failed (${liveError}); re-consent needed`;
    } else if (left !== undefined && left <= 0) {
      status = "expired";
      detail = "past the 7-day Testing limit; re-consent needed";
    } else if (left !== undefined && left <= WARN_DAYS) {
      status = "warn";
    }
    out.push({ ...base, status, consentedAt, daysLeft: left, detail });
  }
  return out;
}
