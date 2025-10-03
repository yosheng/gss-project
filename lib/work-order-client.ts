// Client-side work order service that uses secure API routes
import { WorkOrderFormData, WorkOrderResponse } from './schemas/work-order';
import { WorkOrderError, ERROR_CODES, SecureErrorLogger } from './errors';

/**
 * Client-side work order service
 * Routes requests through secure server-side API
 */
export class WorkOrderClient {
  private static readonly API_BASE = '/api/work-order';
  private static readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  /**
   * Submit work order through secure API route
   * @param formData - Form data from user input
   * @returns Promise with submission result
   */
  static async submitWorkOrder(formData: WorkOrderFormData): Promise<WorkOrderResponse> {
    const context = 'WorkOrderClient.submitWorkOrder';
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      // Log request initiation (without sensitive data)
      console.log('Client work order submission initiated', {
        timestamp: new Date().toISOString(),
        hasDescription: !!formData.description,
        hasWorkDate: !!formData.workDate
      });

      const response = await fetch(this.API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
        // Security settings
        credentials: 'same-origin',
        cache: 'no-cache',
        redirect: 'error'
      });

      clearTimeout(timeoutId);

      // Parse response
      let responseData: any;
      try {
        responseData = await response.json();
      } catch (parseError) {
        throw new WorkOrderError(
          '伺服器回應格式錯誤',
          ERROR_CODES.API_ERROR,
          response.status,
          parseError as Error
        );
      }

      // Handle error responses
      if (!response.ok) {
        throw new WorkOrderError(
          responseData.error || '提交失敗',
          responseData.code || ERROR_CODES.API_ERROR,
          response.status
        );
      }

      // Log successful submission
      console.log('Client work order submission completed', {
        timestamp: new Date().toISOString(),
        success: responseData.success
      });

      return responseData;

    } catch (error) {
      // Handle different error types
      if (error instanceof WorkOrderError) {
        SecureErrorLogger.logError(error, context);
        throw error;
      }

      // Handle abort/timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new WorkOrderError(
          '請求超時，請檢查網路連接後重試',
          ERROR_CODES.NETWORK_ERROR,
          408,
          error
        );
        SecureErrorLogger.logError(timeoutError, context);
        throw timeoutError;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new WorkOrderError(
          '網路連接錯誤，請檢查您的網路連接',
          ERROR_CODES.NETWORK_ERROR,
          0,
          error
        );
        SecureErrorLogger.logError(networkError, context);
        throw networkError;
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
   * Check API health status
   * @returns Promise with health status
   */
  static async checkHealth(): Promise<{
    status: string;
    apiAccessible: boolean;
    timestamp: string;
  }> {
    const context = 'WorkOrderClient.checkHealth';
    
    try {
      const response = await fetch(`${this.API_BASE}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'same-origin',
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new WorkOrderError(
          '健康檢查失敗',
          ERROR_CODES.API_ERROR,
          response.status
        );
      }

      return await response.json();

    } catch (error) {
      const healthError = new WorkOrderError(
        'API 健康檢查失敗',
        ERROR_CODES.API_ERROR,
        503,
        error as Error
      );
      
      SecureErrorLogger.logError(healthError, context);
      throw healthError;
    }
  }

  /**
   * Validate form data before submission
   * @param formData - Form data to validate
   * @returns boolean indicating if data is valid
   */
  static validateFormData(formData: WorkOrderFormData): boolean {
    try {
      // Basic client-side validation
      if (!formData.workDate || !formData.description) {
        return false;
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.workDate)) {
        return false;
      }

      // Validate description length
      if (formData.description.trim().length < 5) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Form validation error:', error);
      return false;
    }
  }
}