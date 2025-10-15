// Work Order List API Client
import { ApiConfig, InputSanitizer } from './api-config';
import { WorkOrderError, SecureErrorLogger, ERROR_CODES } from './errors';
import { WorkOrderListResponse, WorkOrderListFilter, WorkOrderListItem } from './types/work-order-list';

// Define the payload type for fetching the work order list
export type FetchWorkOrderListPayload = Partial<Omit<WorkOrderListFilter, 'arg'>> & {
  arg?: Partial<WorkOrderListFilter['arg']>;
};

export class WorkOrderListClient {
  /**
   * Fetch work order list from the API
   * @param payload - The request payload to override default filters
   * @returns A promise that resolves to an array of work order list items
   */
  public static async fetchWorkOrderList(payload: FetchWorkOrderListPayload = {}): Promise<WorkOrderListItem[]> {
    const apiConfig = new ApiConfig();
    // Correct the URL to match the cURL command
    const url = `${apiConfig.getApiUrl()}/AMApi/AMMaintainWeb/filter/AMMaintainWeb`;
    const headers = apiConfig.getSecureHeaders();

    try {
      // Validate API token format using the local apiConfig instance
      if (!apiConfig.validateTokenFormat()) {
        throw new WorkOrderError(
          'API 配置無效',
          ERROR_CODES.API_ERROR,
          500
        );
      }

      // Create a default filter with a sensible date range (current week, Sunday to Saturday)
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(today);
      // Sunday is day 0, so subtract the current day number to get to Sunday
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday is 6 days after Sunday

      const defaultFilter: WorkOrderListFilter = {
        pageIndex: 0,
        pageSize: 10, // Match the cURL command's page size
        sortField: "",
        sortExpression: "",
        arg: {
          actNo: null,
          empNo: null,
          caseContNo: null,
          isPrdOrPjt: null,
          prdPjtNo: null,
          sdateTime: startOfWeek.toISOString(),
          edateTime: endOfWeek.toISOString(),
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

      // Merge the default filter with the provided payload
      const finalFilter: WorkOrderListFilter = {
        ...defaultFilter,
        ...payload,
        arg: {
          ...defaultFilter.arg,
          ...payload.arg
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

      console.log('Fetching work order list with filter:', {
        timestamp: new Date().toISOString(),
        url,
        filter: finalFilter
      });

      const response = await fetch(url, {
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