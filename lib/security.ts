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

/**
 * In-memory sliding window rate limiter to protect against request flooding,
 * spamming and brute-force abuse.
 */
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale rate limit entries every 5 minutes
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 3600000);
      if (record.timestamps.length === 0) {
        rateLimitMap.delete(key);
      }
    }
  }, 300000);
  if (timer.unref) timer.unref();
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const now = Date.now();
  let record = rateLimitMap.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(key, record);
  }

  // Remove timestamps outside window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
  };
}

/**
 * Extracts client IP safely from forwarded headers or connection.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

/**
 * Validates whether the incoming request origin matches the server host
 * to protect against Cross-Site Request Forgery (CSRF).
 */
export function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return true;
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

/**
 * Checks for honeypot bot trap fields.
 * If an automated bot filled a hidden field like `website_url` or `_hp_check`, it returns true.
 */
export function isBotDetected(body: any): boolean {
  if (!body || typeof body !== "object") return false;
  return Boolean(body.website_url || body._hp_check);
}


