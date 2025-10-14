// Work Order List API Client
import { ApiConfig, InputSanitizer } from './api-config';
import { WorkOrderError, SecureErrorLogger, ERROR_CODES } from './errors';
import { WorkOrderListResponse, WorkOrderListFilter, WorkOrderListItem } from './types/work-order-list';

export class WorkOrderListClient {
  /**
   * Fetch work order list from the API
   * @param payload - The request payload
   * @returns A promise that resolves to an array of work order list items
   */
  public static async fetchWorkOrderList(payload: FetchWorkOrderListPayload): Promise<WorkOrderListItem[]> {
    const apiConfig = new ApiConfig();
    const url = `${apiConfig.getApiUrl()}/rest/v1/pmis/work-order/list`;
    const headers = apiConfig.getSecureHeaders();

    try {
      // Validate API configuration
      if (!this.apiConfig.validateTokenFormat()) {
        throw new WorkOrderError(
          'API 配置無效',
          ERROR_CODES.API_ERROR,
          500
        );
      }

      // Create default filter with date range (last 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const defaultFilter: WorkOrderListFilter = {
        pageIndex: 0,
        pageSize: 50,
        sortField: "",
        sortExpression: "",
        arg: {
          actNo: null,
          empNo: null,
          caseContNo: null,
          isPrdOrPjt: null,
          prdPjtNo: null,
          sdateTime: thirtyDaysAgo.toISOString(),
          edateTime: now.toISOString(),
          ttlHours: null,
          actTypeId: null,
          isPrnToCust: null,
          description: null,
          log: null,
          isAttachFile: null,
          place: null,
          attachFileName: null,
          nextActionDesc: null,
          includePmisWorklog: true,
          custNo: null
        },
        clientPagging: false,
        keyField: null,
        requiredKeyItems: false
      };

      // Merge with provided filter
      const finalFilter = {
        ...defaultFilter,
        ...filter,
        arg: {
          ...defaultFilter.arg,
          ...filter.arg
        }
      };

      // Sanitize filter inputs
      if (finalFilter.arg.description) {
        finalFilter.arg.description = InputSanitizer.sanitizeString(finalFilter.arg.description);
      }
      if (finalFilter.arg.caseContNo) {
        finalFilter.arg.caseContNo = InputSanitizer.sanitizeString(finalFilter.arg.caseContNo);
      }
      if (finalFilter.arg.prdPjtNo) {
        finalFilter.arg.prdPjtNo = InputSanitizer.sanitizeString(finalFilter.arg.prdPjtNo);
      }

      const apiUrl = this.apiConfig.getApiUrl();
      const headers = this.apiConfig.getSecureHeaders();

      console.log('Fetching work order list', {
        timestamp: new Date().toISOString(),
        pageSize: finalFilter.pageSize,
        dateRange: {
          start: finalFilter.arg.sdateTime,
          end: finalFilter.arg.edateTime
        }
      });

      const response = await fetch(`${apiUrl}/AMApi/AMMaintainWeb/filter/AMMaintainWeb`, {
        method: 'POST',
        headers,
        body: JSON.stringify(finalFilter),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        throw new WorkOrderError(
          `API 請求失敗: ${response.status} ${response.statusText}`,
          ERROR_CODES.API_ERROR,
          response.status
        );
      }

      const data: WorkOrderListResponse = await response.json();

      if (data.status !== 200) {
        throw new WorkOrderError(
          data.message || 'API 回應錯誤',
          ERROR_CODES.API_ERROR,
          data.status
        );
      }

      console.log('Work order list fetched successfully', {
        timestamp: new Date().toISOString(),
        totalRecords: data.data.total,
        returnedRecords: data.data.rows.length
      });

      return data.data.rows;

    } catch (error) {
      if (error instanceof WorkOrderError) {
        SecureErrorLogger.logError(error, 'WorkOrderListClient.fetchWorkOrderList');
        throw error;
      }

      const unknownError = new WorkOrderError(
        '獲取工作單列表時發生未預期錯誤',
        ERROR_CODES.API_ERROR,
        500,
        error as Error
      );

      SecureErrorLogger.logError(unknownError, 'WorkOrderListClient.fetchWorkOrderList');
      throw unknownError;
    }
  }

  /**
   * Format date for display
   * @param dateString - ISO date string
   * @returns Formatted date string
   */
  public static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  }

  /**
   * Format duration in hours
   * @param hours - Number of hours
   * @returns Formatted duration string
   */
  public static formatDuration(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)} 分鐘`;
    }
    return `${hours} 小時`;
  }

  /**
   * Truncate long text for display
   * @param text - Text to truncate
   * @param maxLength - Maximum length
   * @returns Truncated text
   */
  public static truncateText(text: string, maxLength: number = 100): string {
    if (!text || text.length <= maxLength) {
      return text || '';
    }
    return text.substring(0, maxLength) + '...';
  }
}