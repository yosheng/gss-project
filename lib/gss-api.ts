import { WorkOrderFormData, WorkOrderPayload, WorkOrderResponse } from './schemas/work-order';
import { WorkOrderError, ERROR_CODES, SecureErrorLogger } from './errors';
import { ApiConfig, InputSanitizer } from './api-config';

// Fixed payload structure for GSS API
const FIXED_PAYLOAD_BASE: Omit<WorkOrderPayload, 'sdateTime' | 'edateTime' | 'description'> = {
  actNo: null,
  actTypeId: "Be",
  custNo: "GSS",
  caseContNo: "O202502047",
  prdPjtNo: "內部專案-2025020600007 - Vital  Casebridge產品計畫書_2025年",
  ttlHours: 8,
  isPrnToCust: "Be099",
  attachFileName: null,
  isAttachFile: "00200",
  isPrdOrPjt: "J",
  message: null,
  status: false,
  favoriteContOppId: "7016",
  suppDeptItems: "U236"
};

export class WorkOrderService {
  private static apiConfig: ApiConfig;
  private static requestCount: Map<string, { count: number; lastRequest: number }> = new Map();
  private static readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private static readonly MAX_REQUESTS_PER_WINDOW = 10;

  /**
   * Initialize API configuration
   */
  private static getApiConfig(): ApiConfig {
    if (!this.apiConfig) {
      this.apiConfig = ApiConfig.getInstance();
    }
    return this.apiConfig;
  }

  /**
   * Rate limiting check
   * @param identifier - Request identifier (e.g., user ID or IP)
   */
  private static checkRateLimit(identifier: string = 'default'): void {
    const now = Date.now();
    const userRequests = this.requestCount.get(identifier);

    if (!userRequests) {
      this.requestCount.set(identifier, { count: 1, lastRequest: now });
      return;
    }

    // Reset count if window has passed
    if (now - userRequests.lastRequest > this.RATE_LIMIT_WINDOW) {
      this.requestCount.set(identifier, { count: 1, lastRequest: now });
      return;
    }

    // Check if rate limit exceeded
    if (userRequests.count >= this.MAX_REQUESTS_PER_WINDOW) {
      throw new WorkOrderError(
        '請求過於頻繁，請稍後再試',
        ERROR_CODES.RATE_LIMIT,
        429
      );
    }

    // Increment count
    userRequests.count++;
    userRequests.lastRequest = now;
  }

  /**
   * Format date and time for GSS API
   * @param date - Date string in YYYY-MM-DD format
   * @param timeStr - Time string in THH:mm:ss.sssZ format
   * @returns Formatted datetime string
   */
  static formatDateTime(date: string, timeStr: string): string {
    // Sanitize inputs
    const sanitizedDate = InputSanitizer.sanitizeDate(date);
    return sanitizedDate + timeStr;
  }

  /**
   * Create payload for GSS API from form data
   * @param formData - Form data from user input
   * @returns Complete payload for GSS API
   */
  static createPayload(formData: WorkOrderFormData): WorkOrderPayload {
    try {
      // Sanitize and validate input data
      const sanitizedDate = InputSanitizer.sanitizeDate(formData.workDate);
      const sanitizedDescription = InputSanitizer.sanitizeString(formData.description, 1000);

      const payload = {
        ...FIXED_PAYLOAD_BASE,
        sdateTime: this.formatDateTime(sanitizedDate, 'T00:30:00.000Z'),
        edateTime: this.formatDateTime(sanitizedDate, 'T09:30:00.000Z'),
        description: sanitizedDescription
      };

      // Validate the complete payload
      return InputSanitizer.validatePayload(payload);
    } catch (error) {
      if (error instanceof WorkOrderError) {
        throw error;
      }
      
      throw new WorkOrderError(
        '資料驗證失敗',
        ERROR_CODES.VALIDATION_ERROR,
        400,
        error as Error
      );
    }
  }

  /**
   * Submit work order to GSS API
   * @param formData - Form data from user input
   * @param userIdentifier - Optional user identifier for rate limiting
   * @returns Promise with submission result
   */
  static async submitWorkOrder(
    formData: WorkOrderFormData, 
    userIdentifier?: string
  ): Promise<WorkOrderResponse> {
    const context = 'WorkOrderService.submitWorkOrder';
    
    try {
      // Rate limiting check
      this.checkRateLimit(userIdentifier);

      // Get secure API configuration
      const apiConfig = this.getApiConfig();
      
      // Validate API configuration
      if (!apiConfig.validateTokenFormat()) {
        throw new WorkOrderError(
          '系統配置錯誤',
          ERROR_CODES.SECURITY_ERROR,
          500
        );
      }

      // Create and validate payload
      const payload = this.createPayload(formData);
      
      // Sanitize API URL
      const apiUrl = ApiConfig.sanitizeUrl(apiConfig.getApiUrl());
      
      // Log request (without sensitive data)
      console.log('Submitting work order request', {
        timestamp: new Date().toISOString(),
        payloadSize: JSON.stringify(payload).length,
        userIdentifier: userIdentifier || 'anonymous'
      });

      // Make secure API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: apiConfig.getSecureHeaders(),
        body: JSON.stringify(payload),
        mode: 'cors',
        // Security headers
        credentials: 'omit', // Don't send cookies
        cache: 'no-cache', // Don't cache sensitive requests
        redirect: 'error' // Don't follow redirects for security
      });

      // Log response status (without sensitive data)
      console.log('API response received', {
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        // Handle different HTTP error codes securely
        let errorMessage: string;
        let errorCode: string;

        switch (response.status) {
          case 401:
            errorMessage = '認證失敗，請聯繫系統管理員';
            errorCode = ERROR_CODES.UNAUTHORIZED;
            break;
          case 403:
            errorMessage = '權限不足，請聯繫系統管理員';
            errorCode = ERROR_CODES.UNAUTHORIZED;
            break;
          case 429:
            errorMessage = '請求過於頻繁，請稍後再試';
            errorCode = ERROR_CODES.RATE_LIMIT;
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = '伺服器暫時無法處理請求，請稍後再試';
            errorCode = ERROR_CODES.API_ERROR;
            break;
          default:
            errorMessage = 'API 調用失敗，請稍後再試';
            errorCode = ERROR_CODES.API_ERROR;
        }

        const apiError = new WorkOrderError(
          errorMessage,
          errorCode,
          response.status
        );

        SecureErrorLogger.logError(apiError, context);
        throw apiError;
      }

      // Parse response safely
      let responseData: any;
      try {
        const responseText = await response.text();
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        throw new WorkOrderError(
          'API 回應格式錯誤',
          ERROR_CODES.API_ERROR,
          500,
          parseError as Error
        );
      }

      // Log successful submission (without sensitive data)
      console.log('Work order submitted successfully', {
        timestamp: new Date().toISOString(),
        responseReceived: !!responseData
      });

      return {
        success: true,
        message: '工作單提交成功！'
      };

    } catch (error) {
      // Secure error handling
      if (error instanceof WorkOrderError) {
        SecureErrorLogger.logError(error, context);
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        const corsError = new WorkOrderError(
          '網路連接錯誤：請檢查您的網路連接。注意：由於CORS政策，可能無法直接連接到外部API。',
          ERROR_CODES.CORS_ERROR,
          0,
          error
        );
        SecureErrorLogger.logError(corsError, context);
        throw corsError;
      }
      
      // Handle other errors
      const unknownError = new WorkOrderError(
        '系統發生未預期錯誤，請稍後再試',
        ERROR_CODES.API_ERROR,
        500,
        error as Error
      );
      
      SecureErrorLogger.logError(unknownError, context);
      throw unknownError;
    }
  }

  /**
   * Validate network connectivity and CORS (secure version)
   * @returns Promise<boolean> indicating if API is accessible
   */
  static async validateApiAccess(): Promise<boolean> {
    const context = 'WorkOrderService.validateApiAccess';
    
    try {
      const apiConfig = this.getApiConfig();
      const apiUrl = ApiConfig.sanitizeUrl(apiConfig.getApiUrl());
      
      // Simple HEAD request to check API accessibility
      const response = await fetch(apiUrl, {
        method: 'HEAD',
        headers: {
          'Origin': 'https://assistant.gss.com.tw',
          'Referer': 'https://assistant.gss.com.tw/am/'
        },
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
        redirect: 'error'
      });
      
      const isAccessible = response.ok || response.status === 405; // 405 Method Not Allowed is acceptable for HEAD
      
      console.log('API access validation result', {
        accessible: isAccessible,
        status: response.status,
        timestamp: new Date().toISOString()
      });
      
      return isAccessible;
    } catch (error) {
      const validationError = new WorkOrderError(
        'API 連接驗證失敗',
        ERROR_CODES.NETWORK_ERROR,
        0,
        error as Error
      );
      
      SecureErrorLogger.logError(validationError, context);
      return false;
    }
  }

  /**
   * Clear rate limiting data (for testing or admin purposes)
   */
  static clearRateLimit(identifier?: string): void {
    if (identifier) {
      this.requestCount.delete(identifier);
    } else {
      this.requestCount.clear();
    }
  }

  /**
   * Get current rate limit status for identifier
   * @param identifier - Request identifier
   * @returns Rate limit status
   */
  static getRateLimitStatus(identifier: string = 'default'): {
    requestCount: number;
    windowStart: number;
    isLimited: boolean;
  } {
    const userRequests = this.requestCount.get(identifier);
    const now = Date.now();
    
    if (!userRequests) {
      return {
        requestCount: 0,
        windowStart: now,
        isLimited: false
      };
    }

    const isWindowExpired = now - userRequests.lastRequest > this.RATE_LIMIT_WINDOW;
    const isLimited = !isWindowExpired && userRequests.count >= this.MAX_REQUESTS_PER_WINDOW;

    return {
      requestCount: isWindowExpired ? 0 : userRequests.count,
      windowStart: userRequests.lastRequest,
      isLimited
    };
  }
}