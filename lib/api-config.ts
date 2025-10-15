// Secure API configuration management
import { WorkOrderError, ERROR_CODES } from './errors';

/**
 * Secure API configuration class
 * Handles sensitive API credentials and configuration
 */
export class ApiConfig {
  private readonly apiUrl: string;

  constructor() {
    // Validate environment variables
    const apiUrl = process.env.NEXT_PUBLIC_GSS_API_URL;

    if (!apiUrl || apiUrl.trim() === '') {
      throw new WorkOrderError(
        '系統配置錯誤，請聯繫系統管理員',
        ERROR_CODES.API_ERROR,
        500
      );
    }
    
    this.apiUrl = apiUrl.trim();
  }

  /**
   * Get API URL (sanitized)
   */
  public getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Get secure headers for API requests
   * @returns Headers object with authorization and security headers
   */
  public getSecureHeaders(): Record<string, string> {
    const apiToken = typeof window !== 'undefined' ? localStorage.getItem('gss-api-auth-token') : null;
    if (!apiToken) {
      throw new WorkOrderError(
        '未找到認證令牌，請重新登入',
        ERROR_CODES.UNAUTHORIZED,
        401
      );
    }
    
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
      'accept-language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'origin': 'https://assistant.gss.com.tw',
      'priority': 'u=1, i',
      'referer': 'https://assistant.gss.com.tw/am/',
      'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin'
    };
  }

  /**
   * Validate API token format (basic security check)
   * @returns boolean indicating if token appears valid
   */
  public validateTokenFormat(): boolean {
    const apiToken = typeof window !== 'undefined' ? localStorage.getItem('gss-api-auth-token') : null;
    if (!apiToken) {
        return false;
    }
    // Basic validation - token should be a long string
    return apiToken.length > 100 && /^[A-Za-z0-9_-]+$/.test(apiToken);
  }

  /**
   * Sanitize API URL to prevent injection
   * @param url - URL to sanitize
   * @returns Sanitized URL
   */
  public static sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTPS for security
      if (urlObj.protocol !== 'https:') {
        throw new Error('Only HTTPS URLs are allowed');
      }
      
      // Validate hostname
      if (!urlObj.hostname.includes('gss.com.tw')) {
        throw new Error('Invalid API hostname');
      }
      
      return urlObj.toString();
    } catch (error) {
      console.error('URL sanitization failed:', error);
      throw new WorkOrderError(
        '無效的 API 配置',
        ERROR_CODES.API_ERROR,
        400
      );
    }
  }
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize string input to prevent injection attacks
   * @param input - Input string to sanitize
   * @param maxLength - Maximum allowed length
   * @returns Sanitized string
   */
  public static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      throw new WorkOrderError(
        '無效的輸入格式',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    // Remove potentially dangerous characters
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>]/g, '') // Remove angle brackets
      .trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Sanitize date input
   * @param dateStr - Date string to sanitize
   * @returns Sanitized date string in YYYY-MM-DD format
   */
  public static sanitizeDate(dateStr: string): string {
    if (typeof dateStr !== 'string') {
      throw new WorkOrderError(
        '無效的日期格式',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      throw new WorkOrderError(
        '日期格式必須為 YYYY-MM-DD',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    // Validate date is valid
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new WorkOrderError(
        '無效的日期',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    // Validate date is not too far in the past or future
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    if (date < oneYearAgo || date > oneYearFromNow) {
      throw new WorkOrderError(
        '日期必須在一年內的範圍',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    return dateStr;
  }

  /**
   * Validate and sanitize work order payload
   * @param payload - Payload object to validate
   * @returns Sanitized payload
   */
  public static validatePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') {
      throw new WorkOrderError(
        '無效的請求資料',
        ERROR_CODES.VALIDATION_ERROR,
        400
      );
    }

    // Validate required fields
    const requiredFields = ['sdateTime', 'edateTime', 'description'];
    for (const field of requiredFields) {
      if (!payload[field]) {
        throw new WorkOrderError(
          `缺少必要欄位: ${field}`,
          ERROR_CODES.VALIDATION_ERROR,
          400
        );
      }
    }

    // Sanitize description
    if (payload.description) {
      payload.description = this.sanitizeString(payload.description, 1000);
    }

    return payload;
  }
}