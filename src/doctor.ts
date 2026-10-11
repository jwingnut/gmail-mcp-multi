#!/usr/bin/env node
/**
 * Token self-check. Usage: node dist/doctor.js [--json] [--offline]
 * Production (default): validity comes from one live read-only Gmail call per account. Testing
 * (set {"publishingStatus": "testing"} in secrets/config.json): also counts the 7-day token limit.
 * Exit code: 0 all ok, 1 some account within 2 days of expiry (Testing only), 2 expired/missing/failing.
 * Prints no secrets. Safe to call from `agentctl doctor`.
 */
import { checkAccounts, publishingStatus } from "./health.js";

async function main() {
  const json = process.argv.includes("--json");
  const results = await checkAccounts(undefined, { live: !process.argv.includes("--offline") });
  if (json) {
    console.log(JSON.stringify({ publishingStatus: publishingStatus(), accounts: results }, null, 2));
  } else if (results.length === 0) {
    console.log("FAIL no accounts configured");
  } else {
    for (const r of results) {
      const tag = r.status === "ok" ? "PASS" : r.status === "warn" ? "WARN" : r.status === "unknown" ? "SKIP" : "FAIL";
      console.log(`${tag} ${r.alias} <${r.email}>: ${r.detail}`);
    }
  }
  const worst = results.length === 0 ? 2 : results.some((r) => r.status === "expired" || r.status === "missing") ? 2 : results.some((r) => r.status === "warn") ? 1 : 0;
  process.exit(worst);
}

main().catch((e) => {
  console.error(`FAIL doctor error: ${e instanceof Error ? e.message.split("\n")[0] : e}`);
  process.exit(2);
});
