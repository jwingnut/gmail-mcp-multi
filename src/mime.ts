import * as fs from "fs";
import * as path from "path";
import { encodeHeader, headerValue, safeFilename } from "./sanitize.js";
import { homeDir } from "./secure.js";

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const DENIED_SEGMENTS = new Set([".ssh", ".gnupg", ".aws", ".azure", ".kube"]);

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip",
};

export interface DraftInput {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
  attachments?: string[];
}

/** Check an attachment path the user supplied; returns the resolved path or throws. */
export function checkAttachmentPath(p: string): string {
  if (!path.isAbsolute(p)) throw new Error(`Attachment path must be absolute: ${p}`);
  const resolved = fs.realpathSync(p);
  const secrets = fs.existsSync(homeDir()) ? fs.realpathSync(homeDir()) : path.resolve(homeDir());
  const lower = (s: string) => s.toLowerCase();
  if (lower(resolved) === lower(secrets) || lower(resolved).startsWith(lower(secrets) + path.sep)) {
    throw new Error("Refusing to attach files from the credentials folder");
  }
  if (resolved.split(path.sep).some((s) => DENIED_SEGMENTS.has(s.toLowerCase()))) {
    throw new Error("Refusing to attach files from a credentials directory");
  }
  const st = fs.statSync(resolved);
  if (!st.isFile()) throw new Error(`Not a regular file: ${p}`);
  if (st.size > MAX_ATTACHMENT_BYTES) throw new Error(`Attachment over 20 MB: ${path.basename(p)}`);
  return resolved;
}

function wrap76(b64: string): string {
  return b64.replace(/(.{76})/g, "$1\r\n");
}

/** Build an RFC 822 message (multipart/mixed when there are attachments). Never sends anything. */
export function buildMime(d: DraftInput): string {
  const addr = (label: string, v?: string[]) =>
    v && v.length ? [`${label}: ${v.map(headerValue).join(", ")}`] : [];
  const headers = [
    ...addr("To", d.to),
    ...addr("Cc", d.cc),
    ...addr("Bcc", d.bcc),
    `Subject: ${encodeHeader(d.subject ?? "")}`,
    "MIME-Version: 1.0",
  ];
  const body = d.body ?? "";
  const files = (d.attachments ?? []).map(checkAttachmentPath);
  if (files.length === 0) {
    return [...headers, 'Content-Type: text/plain; charset="UTF-8"', "", body].join("\r\n");
  }
  const boundary = `=_draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  const parts = [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    body,
  ];
  for (const f of files) {
    const name = safeFilename(path.basename(f), "attachment");
    const type = MIME_TYPES[path.extname(f).toLowerCase()] ?? "application/octet-stream";
    parts.push(
      `--${boundary}`,
      `Content-Type: ${type}; name="${name}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${name}"`,
      "",
      wrap76(fs.readFileSync(f).toString("base64"))
    );
  }
  parts.push(`--${boundary}--`, "");
  return parts.join("\r\n");
}
