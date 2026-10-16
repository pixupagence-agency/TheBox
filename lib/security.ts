/**
 * Security utilities for input sanitization, HTML escaping,
 * URL validation, and prevention of injection attacks.
 */

/**
 * Escapes characters that are sensitive in HTML to prevent HTML injection and XSS in emails or views.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Strips carriage return and newline characters to prevent Email Header Injection (CRLF),
 * and bounds the maximum length.
 */
export function sanitizeSubject(subject: string | null | undefined, maxLength = 200): string {
  if (!subject) return "";
  return subject
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates and normalizes an email address.
 * Enforces standard length limits (RFC 5321 specifies max 254 characters).
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Sanitizes plain text input, bounding length and trimming extra whitespace.
 */
export function sanitizeText(text: string | null | undefined, maxLength = 5000): string {
  if (!text) return "";
  return String(text).trim().slice(0, maxLength);
}

/**
 * Validates a return URL to prevent Open Redirect vulnerabilities.
 * Only allows relative paths (starting with '/' but not '//') or absolute URLs
 * whose origin strictly matches the application's base URL / origin.
 */
export function validateSafeReturnUrl(
  returnUrl: string | null | undefined,
  appOrigin: string
): string {
  if (!returnUrl || typeof returnUrl !== "string") {
    return appOrigin;
  }

  const trimmed = returnUrl.trim();

  // Allow safe relative paths
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    try {
      const resolved = new URL(trimmed, appOrigin);
      if (resolved.origin === new URL(appOrigin).origin) {
        return resolved.toString();
      }
    } catch {
      return appOrigin;
    }
  }

  // If absolute URL, ensure the origin matches appOrigin exactly
  try {
    const targetUrl = new URL(trimmed);
    const expectedOrigin = new URL(appOrigin).origin;
    if (targetUrl.origin === expectedOrigin) {
      return targetUrl.toString();
    }
  } catch {
    // Malformed URL
  }

  return appOrigin;
}

/**
 * Validates whether an email matches the authorized root bootstrap administrator.
 * Prevents arbitrary string substring matches (such as email.includes("pixup"))
 * which lead to privilege escalation.
 */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  return email.trim().toLowerCase() === "pixup.agence@gmail.com";
}

