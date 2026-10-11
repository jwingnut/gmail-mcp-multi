import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";

const DIR_MODE = 0o700;
const FILE_MODE = 0o600;

/** Project root (parent of dist/ or src/). */
export const PROJECT_ROOT = path.resolve(__dirname, "..");

/**
 * Where config, OAuth client, tokens and quarantined attachments live.
 * Defaults to <project>/secrets (git-ignored); GMAIL_MCP_HOME overrides it (used by tests).
 */
export function homeDir(): string {
  return process.env.GMAIL_MCP_HOME
    ? path.resolve(process.env.GMAIL_MCP_HOME)
    : path.join(PROJECT_ROOT, "secrets");
}

/** On Windows chmod is a no-op, so strip inherited ACLs and grant only the current user. */
function restrictWindowsAcl(target: string): void {
  if (process.platform !== "win32") return;
  const user = process.env.USERNAME;
  if (!user) return;
  try {
    execFileSync("icacls", [target, "/inheritance:r", "/grant:r", `${user}:(OI)(CI)F`], {
      stdio: "ignore",
    });
  } catch {
    // Best effort; the folder is also git-ignored and inside the user's profile.
  }
}

export function ensureSecureDir(dirPath: string): void {
  const created = !fs.existsSync(dirPath);
  if (created) fs.mkdirSync(dirPath, { recursive: true, mode: DIR_MODE });
  fs.chmodSync(dirPath, DIR_MODE);
  if (created) restrictWindowsAcl(dirPath);
}

/** Write a file only the owner can read (mode applies on create, chmod tightens old files). */
export function writeSecureFile(filePath: string, data: string | Buffer): void {
  fs.writeFileSync(filePath, data, { mode: FILE_MODE });
  fs.chmodSync(filePath, FILE_MODE);
}
