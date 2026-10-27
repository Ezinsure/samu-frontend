/** Shared password policy for register, reset, and change-password. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

/**
 * Rules shown on the register form. Keep in sync with the API `passwordSchema`
 * so a password that looks valid here is accepted by the server.
 */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "lower",
    label: "One lowercase letter (a–z)",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "upper",
    label: "One uppercase letter (A–Z)",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "One number (0–9)",
    test: (password) => /\d/.test(password),
  },
  {
    id: "special",
    label: "One special character (!@#$…)",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export function getPasswordChecklist(password: string) {
  return PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(password),
  }));
}

export function isPasswordStrong(password: string): boolean {
  if (password.length > PASSWORD_MAX_LENGTH) return false;
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

/**
 * Client-side check for "new password + confirmation" forms.
 * Returns an error message, or `null` when the pair is acceptable.
 */
export function validateNewPassword(
  password: string,
  confirm: string,
): string | null {
  if (password.length > PASSWORD_MAX_LENGTH) {
    return "Password is too long.";
  }
  const unmet = PASSWORD_RULES.find((rule) => !rule.test(password));
  if (unmet) return unmet.label;
  if (password !== confirm) return "The two passwords do not match.";
  return null;
}
