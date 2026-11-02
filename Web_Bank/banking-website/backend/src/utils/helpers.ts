import crypto from "crypto";

/** Generate a pseudo-random numeric account number. */
export function generateAccountNumber(): string {
  // 12-digit account number
  let n = "";
  for (let i = 0; i < 12; i++) n += Math.floor(Math.random() * 10).toString();
  return n;
}

/** Generate a unique transaction/transfer reference. */
export function generateReference(prefix = "TXN"): string {
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

/** Mask an account number, showing only the last 4 digits. */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return `••••${accountNumber.slice(-4)}`;
}

/** Compute SHA-256 hash (used for refresh token storage). */
export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
