import { z } from 'zod';

// Work Order Form Data Schema for user input
export const workOrderSchema = z.object({
  workDate: z.string().min(1, '請選擇工作日期'),
  description: z.string()
    .min(5, '工作描述至少需要5個字符')
    .max(1000, '工作描述不能超過1000個字符'),
});

export type WorkOrderFormData = z.infer<typeof workOrderSchema>;

// Work Order Payload interface for GSS API
export interface WorkOrderPayload {
  actNo: null;
  actTypeId: "Be";
  custNo: "GSS";
  caseContNo: "O202601234";
  prdPjtNo: "內部專案-2026011900016 - Vital  Casebridge 產品增修計畫書_2026年";
  ttlHours: 8;
  isPrnToCust: "Be001";
  attachFileName: null;
  isAttachFile: "00200";
  isPrdOrPjt: "J";
  message: null;
  status: false;
  favoriteContOppId: "7016";
  suppDeptItems: "UR10";
  sdateTime: string; // Format: "YYYY-MM-DDTHH:mm:ss.sssZ"
  edateTime: string; // Format: "YYYY-MM-DDTHH:mm:ss.sssZ"
  description: string;
}

// Work Order Response interface
export interface WorkOrderResponse {
  success: boolean;
  message?: string;
  error?: string;
}