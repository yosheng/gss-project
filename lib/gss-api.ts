
import { WorkOrderFormData, WorkOrderPayload, WorkOrderResponse } from './schemas/work-order';
import { WorkOrderError, ERROR_CODES, SecureErrorLogger } from './errors';
import { ApiConfig, InputSanitizer } from './api-config';
import { WorkOrderListItem, WorkOrderListResponse, WorkOrderListFilter, FetchWorkOrderListPayload } from './types/work-order-list';

/**
 * GssApiService is the single source of truth for all communications with the external GSS API.
 * It provides stateless, static methods for fetching and submitting data.
 */
export class GssApiService {
  /**
   * Submit a work order.
   * This is a simplified and cleaned-up version of the original submission logic.
   * @param formData - The user-submitted form data.
   * @returns A promise that resolves to a standard work order response.
   */
  static async submitWorkOrder(formData: WorkOrderFormData): Promise<WorkOrderResponse> {
    const context = 'GssApiService.submitWorkOrder';
    try {
      const apiConfig = new ApiConfig();
      const headers = apiConfig.getSecureHeaders();
      const apiUrl = apiConfig.getApiUrl(); // The base URL

      // This fixed base payload seems to be a core requirement.
      const fixedPayloadBase: Omit<WorkOrderPayload, 'sdateTime' | 'edateTime' | 'description'> = {
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

      const sanitizedDate = InputSanitizer.sanitizeDate(formData.workDate);
      const payload: WorkOrderPayload = {
        ...fixedPayloadBase,
        sdateTime: `${sanitizedDate}T00:30:00.000Z`,
        edateTime: `${sanitizedDate}T09:30:00.000Z`,
        description: InputSanitizer.sanitizeString(formData.description, 1000)
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new WorkOrderError(
          `API 請求失敗: ${response.status}`,
          ERROR_CODES.API_ERROR,
          response.status,
          new Error(errorText)
        );
      }

      // Assuming a successful response doesn't need parsing and indicates success.
      return {
        success: true,
        message: '工作單提交成功！'
      };

    } catch (error) {
      const wrappedError = (error instanceof WorkOrderError)
        ? error
        : new WorkOrderError(
            '提交工作單時發生未預期錯誤',
            ERROR_CODES.API_ERROR,
            500,
            error as Error
          );
      SecureErrorLogger.logError(wrappedError, context);
      throw wrappedError;
    }
  }

  /**
   * Fetch the list of work orders from the GSS API.
   * Logic moved from the old work-order-list-client.ts.
   * @param payload - The request payload to override default filters.
   * @returns A promise that resolves to an array of work order list items.
   */
  public static async fetchWorkOrderList(payload: FetchWorkOrderListPayload = {}): Promise<WorkOrderListItem[]> {
    const context = 'GssApiService.fetchWorkOrderList';
    try {
      const apiConfig = new ApiConfig();
      const url = `${apiConfig.getApiUrl()}/AMApi/AMMaintainWeb/filter/AMMaintainWeb`;
      const headers = apiConfig.getSecureHeaders();

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const defaultFilter: WorkOrderListFilter = {
        pageIndex: 0,
        pageSize: 10,
        sortField: "",
        sortExpression: "",
        arg: {
          actNo: null, empNo: null, caseContNo: null, isPrdOrPjt: null, prdPjtNo: null,
          sdateTime: startOfWeek.toISOString(),
          edateTime: endOfWeek.toISOString(),
          ttlHours: null, actTypeId: null, isPrnToCust: null, description: null, log: null,
          isAttachFile: null, place: null, attachFileName: null, nextActionDesc: null,
          includePmisWorklog: true, custNo: null
        },
        clientPagging: false, keyField: null, requiredKeyItems: false
      };

      const finalFilter: WorkOrderListFilter = {
        ...defaultFilter,
        ...payload,
        arg: { ...defaultFilter.arg, ...payload.arg }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(finalFilter),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new WorkOrderError(
          `API 請求失敗: ${response.status}`,
          ERROR_CODES.API_ERROR,
          response.status,
          new Error(errorText)
        );
      }

      const data: WorkOrderListResponse = await response.json();
      if (data.status !== 200) {
        throw new WorkOrderError(data.message || 'API 回應錯誤', ERROR_CODES.API_ERROR, data.status);
      }

      return data.data.rows;

    } catch (error) {
       const wrappedError = (error instanceof WorkOrderError)
        ? error
        : new WorkOrderError(
            '獲取工作單列表時發生未預期錯誤',
            ERROR_CODES.API_ERROR,
            500,
            error as Error
          );
      SecureErrorLogger.logError(wrappedError, context);
      throw wrappedError;
    }
  }
}
