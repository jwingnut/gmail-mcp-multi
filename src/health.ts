import * as fs from "fs";
import * as path from "path";
import { AccountManager } from "./accounts.js";
import { homeDir } from "./secure.js";
import { ClientProvider, GmailClient } from "./gmail.js";

/**
 * Google expires refresh tokens of Testing-status external apps after 7 days; apps in production have
 * no such limit. The app's status cannot be read from the API, so it is a flag in secrets/config.json:
 * {"publishingStatus": "production" | "testing"} (default "production").
 */
export const TESTING_TOKEN_DAYS = 7;
export const WARN_DAYS = 2;

export interface AccountHealth {
  alias: string;
  email: string;
  status: "ok" | "warn" | "expired" | "missing" | "unknown";
  consentedAt?: string;
  daysLeft?: number;
  detail: string;
}

export function publishingStatus(): "production" | "testing" {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(homeDir(), "config.json"), "utf-8"));
    return String(cfg.publishingStatus).toLowerCase() === "testing" ? "testing" : "production";
  } catch {
    return "production";
  }
}

export function daysLeft(consentedAtIso: string, now: Date = new Date()): number {
  const ageDays = (now.getTime() - new Date(consentedAtIso).getTime()) / 86_400_000;
  return Math.round((TESTING_TOKEN_DAYS - ageDays) * 10) / 10;
}

/**
 * Per-account token check. Validity comes from one read-only users.getProfile call (live, default),
 * which fails with invalid_grant if the refresh token is no longer valid. Only when the app is in
 * Testing status (config flag) is the 7-day age since consent also counted; offline then reports age only.
 */
export async function checkAccounts(
  am: AccountManager = new AccountManager(),
  opts: { live?: boolean; provider?: ClientProvider; now?: Date } = {}
): Promise<AccountHealth[]> {
  const provider = opts.provider ?? new GmailClient(am);
  const testing = publishingStatus() === "testing";
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
    const left = testing && consentedAt ? daysLeft(consentedAt, opts.now) : undefined;

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
    let detail = testing
      ? left === undefined ? "consent date unknown" : `${left} days until the Testing token expires`
      : opts.live === false ? "validity not checked (offline)" : "live Gmail call ok";
    if (!testing && opts.live === false) status = "unknown";
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
