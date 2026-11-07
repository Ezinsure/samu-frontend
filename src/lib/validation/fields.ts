/** Digits only, at most 16 (Rwanda national ID length). */
export function normalizeNidDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 16);
}

/**
 * Normalize common Rwanda mobile formats to `07XXXXXXXX`.
 * Accepts 07…, 7…, +2507…, 2507…
 */
export function normalizeRwandaMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("250") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith("07") && digits.length === 10) return digits;
  if (digits.startsWith("7") && digits.length === 9) return `0${digits}`;
  return digits;
}

export function isValidNid(raw: string, opts?: { exact16?: boolean }): boolean {
  const digits = normalizeNidDigits(raw);
  if (!/^\d{1,16}$/.test(digits)) return false;
  if (opts?.exact16) return digits.length === 16;
  return digits.length >= 1;
}

export function isValidRwandaMobile(raw: string): boolean {
  return /^07\d{8}$/.test(normalizeRwandaMobile(raw));
}

/** Client/evidence phones stay loose (length + safe chars). */
export function isValidLoosePhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length < 7 || trimmed.length > 32) return false;
  return !/[<>;'"`\\]/.test(trimmed);
}

export function nidInputProps() {
  return {
    inputMode: "numeric" as const,
    maxLength: 16,
    pattern: "\\d{1,16}",
    autoComplete: "off" as const,
  };
}

export function rwandaPhoneInputProps() {
  return {
    inputMode: "tel" as const,
    maxLength: 16,
    placeholder: "07XXXXXXXX",
    autoComplete: "tel" as const,
  };
}
