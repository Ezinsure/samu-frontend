/** Mirrors the API rule (8–128 characters). */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Client-side check for "new password + confirmation" forms.
 * Returns an error message, or `null` when the pair is acceptable.
 */
export function validateNewPassword(
  password: string,
  confirm: string,
): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return "Password is too long.";
  }
  if (password !== confirm) return "The two passwords do not match.";
  return null;
}
