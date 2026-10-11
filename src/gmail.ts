import { google, gmail_v1 } from "googleapis";
import * as fs from "fs";
import { AccountManager, writeSecureFile } from "./accounts.js";

/** The only scopes this server ever uses. Neither is a send-only or full-access scope. */
export const ALLOWED_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
];

export interface ClientProvider {
  getClient(aliasOrEmail: string): Promise<gmail_v1.Gmail>;
}

export type ClientFactory = (
  alias: string,
  credentialsPath: string,
  accountManager: AccountManager
) => gmail_v1.Gmail;

/** Refuse tokens that carry any scope beyond readonly + compose. */
export function assertScopes(scopeField: unknown): void {
  if (typeof scopeField !== "string") return; // older token files; the auth script always records it
  const bad = scopeField.split(/\s+/).filter((s) => s && !ALLOWED_SCOPES.includes(s));
  if (bad.length) {
    throw new Error("Credentials carry scopes beyond gmail.readonly/gmail.compose; re-authenticate");
  }
}

const realFactory: ClientFactory = (alias, credentialsPath, accountManager) => {
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
  assertScopes(credentials.scope);

  const oauthKeysPath = accountManager.getOAuthKeysPath(alias);
  if (!fs.existsSync(oauthKeysPath)) {
    throw new Error("OAuth client file not found; see README setup");
  }
  const oauthKeys = JSON.parse(fs.readFileSync(oauthKeysPath, "utf-8"));
  const oauth2Client = new google.auth.OAuth2(
    oauthKeys.installed.client_id,
    oauthKeys.installed.client_secret,
    oauthKeys.installed.redirect_uris[0]
  );
  oauth2Client.setCredentials(credentials);
  oauth2Client.on("tokens", (tokens) => {
    if (tokens.refresh_token) credentials.refresh_token = tokens.refresh_token;
    credentials.access_token = tokens.access_token;
    credentials.expiry_date = tokens.expiry_date;
    writeSecureFile(credentialsPath, JSON.stringify(credentials, null, 2));
  });
  return google.gmail({ version: "v1", auth: oauth2Client });
};

export class GmailClient implements ClientProvider {
  private clients: Map<string, gmail_v1.Gmail> = new Map();

  constructor(
    private accountManager: AccountManager,
    private factory: ClientFactory = realFactory
  ) {}

  async getClient(aliasOrEmail: string): Promise<gmail_v1.Gmail> {
    const account = this.accountManager.getAccount(aliasOrEmail);
    if (!account) {
      throw new Error(`Account not found: ${aliasOrEmail}`);
    }
    const cached = this.clients.get(account.alias);
    if (cached) return cached;

    const credentialsPath = this.accountManager.getCredentialsPath(account.alias);
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Account not authenticated: ${account.alias}. Run: node dist/auth.js ${account.alias} <email>`);
    }
    const client = this.factory(account.alias, credentialsPath, this.accountManager);
    this.clients.set(account.alias, client);
    return client;
  }

  clearClient(alias: string): void {
    this.clients.delete(alias);
  }
}
