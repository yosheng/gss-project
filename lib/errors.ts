// Error types and constants for work order system

export class WorkOrderError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'WorkOrderError';
  }

  /**
   * Get safe error message for user display
   * Filters out sensitive information
   */
  public getSafeMessage(): string {
    // Remove any potential sensitive information from error messages
    let safeMessage = this.message
      .replace(/Bearer\s+[A-Za-z0-9_-]+/gi, 'Bearer [REDACTED]') // Remove tokens
      .replace(/token[:\s]+[A-Za-z0-9_-]+/gi, 'token: [REDACTED]') // Remove token values
      .replace(/password[:\s]+\S+/gi, 'password: [REDACTED]') // Remove passwords
      .replace(/key[:\s]+[A-Za-z0-9_-]+/gi, 'key: [REDACTED]') // Remove API keys
      .replace(/https?:\/\/[^\s]+/gi, '[URL_REDACTED]'); // Remove full URLs

    return safeMessage;
  }

  /**
   * Get error details for logging (includes sensitive info)
   * Should only be used server-side for debugging
   */
  public getDebugInfo(): object {
    return {
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      stack: this.stack,
      originalError: this.originalError?.message,
      timestamp: new Date().toISOString()
    };
  }
}

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CORS_ERROR: 'CORS_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SECURITY_ERROR: 'SECURITY_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Safe error message mappings for user display
export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: '網路連接錯誤，請檢查您的網路連接',
  [ERROR_CODES.API_ERROR]: 'API 調用失敗，請稍後再試',
  [ERROR_CODES.VALIDATION_ERROR]: '表單驗證失敗，請檢查輸入內容',
  [ERROR_CODES.CORS_ERROR]: '跨域請求被阻止，請聯繫系統管理員',
  [ERROR_CODES.UNAUTHORIZED]: '未授權訪問，請重新登入',
  [ERROR_CODES.SECURITY_ERROR]: '安全驗證失敗，請聯繫系統管理員',
  [ERROR_CODES.RATE_LIMIT]: '請求過於頻繁，請稍後再試',
} as const;

/**
 * Security-focused error logger
 * Logs detailed errors server-side while providing safe messages to users
 */
export class SecureErrorLogger {
  /**
   * Log error securely - detailed info to console, safe message to user
   * @param error - Error to log
   * @param context - Additional context for debugging
   */
  public static logError(error: WorkOrderError, context?: string): void {
    // Log detailed error info to console (server-side only)
    if (typeof window === 'undefined') {
      console.error(`[SECURE_ERROR_LOG] ${context || 'Unknown context'}:`, error.getDebugInfo());
    } else {
      // Client-side: only log safe information
      console.error(`[ERROR] ${context || 'Unknown context'}:`, {
        code: error.code,
        safeMessage: error.getSafeMessage(),
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Create user-safe error response
   * @param error - Original error
   * @returns Safe error object for user display
   */
  public static createSafeErrorResponse(error: WorkOrderError): {
    success: false;
    error: string;
    code: string;
  } {
    return {
      success: false,
      error: error.getSafeMessage(),
      code: error.code
    };
  }
}