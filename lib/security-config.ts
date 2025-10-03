// Security configuration and constants
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 10,
    BURST_LIMIT: 3, // Allow 3 rapid requests before rate limiting kicks in
  },

  // Request timeouts
  TIMEOUTS: {
    API_REQUEST: 30000, // 30 seconds
    HEALTH_CHECK: 10000, // 10 seconds
  },

  // Input validation
  VALIDATION: {
    MAX_DESCRIPTION_LENGTH: 1000,
    MIN_DESCRIPTION_LENGTH: 5,
    MAX_DATE_RANGE_DAYS: 365, // 1 year
  },

  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  },

  // Allowed origins for CORS
  ALLOWED_ORIGINS: [
    'https://assistant.gss.com.tw',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
  ].filter(Boolean) as string[],

  // Sensitive data patterns for redaction
  SENSITIVE_PATTERNS: [
    /Bearer\s+[A-Za-z0-9_-]+/gi,
    /token[:\s]+[A-Za-z0-9_-]+/gi,
    /password[:\s]+\S+/gi,
    /key[:\s]+[A-Za-z0-9_-]+/gi,
    /https?:\/\/[^\s]+/gi,
  ],
} as const;

/**
 * Security utilities
 */
export class SecurityUtils {
  /**
   * Redact sensitive information from strings
   * @param text - Text to redact
   * @returns Redacted text
   */
  static redactSensitiveInfo(text: string): string {
    let redacted = text;
    
    for (const pattern of SECURITY_CONFIG.SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }
    
    return redacted;
  }

  /**
   * Generate secure request ID for tracking
   * @returns Unique request ID
   */
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate request origin
   * @param origin - Request origin
   * @returns boolean indicating if origin is allowed
   */
  static isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return false;
    return SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin);
  }

  /**
   * Get security headers for responses
   * @returns Security headers object
   */
  static getSecurityHeaders(): Record<string, string> {
    return { ...SECURITY_CONFIG.SECURITY_HEADERS };
  }

  /**
   * Sanitize IP address for logging
   * @param ip - IP address to sanitize
   * @returns Partially masked IP address
   */
  static sanitizeIP(ip: string): string {
    if (!ip || ip === 'unknown') return 'unknown';
    
    // IPv4: show first two octets
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.***.***.`;
      }
    }
    
    // IPv6: show first 4 characters
    if (ip.includes(':')) {
      return ip.substring(0, 4) + ':***';
    }
    
    // Fallback: show first 4 characters
    return ip.substring(0, 4) + '***';
  }

  /**
   * Check if request is within rate limits
   * @param requestCount - Current request count
   * @param windowStart - Window start time
   * @returns boolean indicating if request is allowed
   */
  static isWithinRateLimit(requestCount: number, windowStart: number): boolean {
    const now = Date.now();
    const windowElapsed = now - windowStart;
    
    // Reset if window has passed
    if (windowElapsed > SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS) {
      return true;
    }
    
    return requestCount < SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS;
  }

  /**
   * Validate date range for security
   * @param dateStr - Date string to validate
   * @returns boolean indicating if date is within allowed range
   */
  static isValidDateRange(dateStr: string): boolean {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const maxDays = SECURITY_CONFIG.VALIDATION.MAX_DATE_RANGE_DAYS;
      
      const minDate = new Date(now.getTime() - (maxDays * 24 * 60 * 60 * 1000));
      const maxDate = new Date(now.getTime() + (maxDays * 24 * 60 * 60 * 1000));
      
      return date >= minDate && date <= maxDate;
    } catch {
      return false;
    }
  }
}