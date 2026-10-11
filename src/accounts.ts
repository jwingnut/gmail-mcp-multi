import * as fs from "fs";
import * as path from "path";
import { ensureSecureDir, homeDir, writeSecureFile } from "./secure.js";

export { writeSecureFile } from "./secure.js";

export interface Account {
  alias: string;
  email: string;
  authenticated: boolean;
}

export interface AccountConfig {
  alias: string;
  email: string;
}

interface Config {
  accounts: AccountConfig[];
}

const ALIAS_RE = /^[A-Za-z0-9_-]{1,32}$/;

/** Alias is used as a directory name, so it must be a plain token. */
export function assertAlias(alias: string): void {
  if (!ALIAS_RE.test(alias)) {
    throw new Error("Alias must be 1-32 characters: letters, digits, '-' or '_'");
  }
}

export class AccountManager {
  private config: Config = { accounts: [] };
  private readonly configDir: string;
  private readonly configFile: string;
  private readonly accountsDir: string;

  constructor() {
    this.configDir = homeDir();
    this.configFile = path.join(this.configDir, "config.json");
    this.accountsDir = path.join(this.configDir, "accounts");
    ensureSecureDir(this.configDir);
    ensureSecureDir(this.accountsDir);
    this.loadConfig();
  }

  private loadConfig(): void {
    if (fs.existsSync(this.configFile)) {
      this.config = JSON.parse(fs.readFileSync(this.configFile, "utf-8"));
    }
  }

  private saveConfig(): void {
    writeSecureFile(this.configFile, JSON.stringify(this.config, null, 2));
  }

  getAccountDir(alias: string): string {
    assertAlias(alias);
    return path.join(this.accountsDir, alias);
  }

  getCredentialsPath(alias: string): string {
    return path.join(this.getAccountDir(alias), "credentials.json");
  }

  getQuarantineDir(alias: string): string {
    assertAlias(alias);
    return path.join(this.configDir, "quarantine", alias);
  }

  isAuthenticated(alias: string): boolean {
    return fs.existsSync(this.getCredentialsPath(alias));
  }

  listAccounts(): Account[] {
    return this.config.accounts.map((acc) => ({
      ...acc,
      authenticated: this.isAuthenticated(acc.alias),
    }));
  }

  getAccount(aliasOrEmail: string): AccountConfig | undefined {
    const needle = aliasOrEmail.toLowerCase();
    return this.config.accounts.find(
      (acc) => acc.alias.toLowerCase() === needle || acc.email.toLowerCase() === needle
    );
  }

  addAccount(alias: string, email: string): void {
    assertAlias(alias);
    const existing = this.config.accounts.findIndex((acc) => acc.alias === alias);
    if (existing >= 0) {
      this.config.accounts[existing] = { alias, email };
    } else {
      this.config.accounts.push({ alias, email });
    }
    ensureSecureDir(this.getAccountDir(alias));
    this.saveConfig();
  }

  /** One OAuth client (Desktop app) for all accounts, or a per-account override. */
  getOAuthKeysPath(alias?: string): string {
    if (alias) {
      const perAccount = path.join(this.getAccountDir(alias), "oauth-keys.json");
      if (fs.existsSync(perAccount)) return perAccount;
    }
    return path.join(this.configDir, "oauth-keys.json");
  }
}
