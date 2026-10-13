import * as fs from "fs";
import * as path from "path";
import { gmail_v1 } from "googleapis";
import { homeDir } from "./secure.js";

/**
 * The ONLY place in the project that sends mail. It is reachable only through the `send_draft` tool,
 * which exists only when policy.sendAllowed() is true (secrets/config.json: "allowSend": true).
 * It sends an existing draft by id; it cannot compose or send a new message.
 */
export async function sendExistingDraft(
  client: gmail_v1.Gmail,
  account: string,
  draftId: string
): Promise<{ messageId?: string | null; threadId?: string | null }> {
  const res = await client.users.drafts.send({ userId: "me", requestBody: { id: draftId } });
  // Audit trail: when, which account, which draft. No recipients, subject or body.
  const line = JSON.stringify({ at: new Date().toISOString(), account, draftId, messageId: res.data.id }) + "\n";
  fs.appendFileSync(path.join(homeDir(), "send-log.jsonl"), line, { mode: 0o600 });
  return { messageId: res.data.id, threadId: res.data.threadId };
}
