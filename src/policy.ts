import * as fs from "fs";
import * as path from "path";
import { homeDir } from "./secure.js";

/**
 * Sending is OFF unless secrets/config.json contains the boolean `"allowSend": true`.
 * Anything else (missing, false, the string "true") means off. Read on every call so a change takes effect at once.
 */
export function sendAllowed(): boolean {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(homeDir(), "config.json"), "utf-8"));
    return cfg.allowSend === true;
  } catch {
    return false;
  }
}
