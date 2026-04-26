import { z } from 'zod';

const BREAK_PERIODS = [
  { start: 12.5, end: 13.5 }, // 12:30~13:30 lunch
  { start: 17.5, end: 18.5 }, // 17:30~18:30 dinner
] as const;

export function timeToHours(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

export function calculateWorkHours(startTime: string, endTime: string): number {
  const start = timeToHours(startTime);
  const end = timeToHours(endTime);
  if (end <= start) return 0;

  let workHours = end - start;
  for (const period of BREAK_PERIODS) {
    const overlap = Math.max(0, Math.min(end, period.end) - Math.max(start, period.start));
    workHours -= overlap;
  }
  return Math.max(0, Math.round(workHours * 100) / 100);
}

// Work Order Form Data Schema for user input
export const workOrderSchema = z.object({
  workDate: z.string().min(1, '請選擇工作日期'),
  startTime: z.string().min(1, '請選擇開始時間'),
  endTime: z.string().min(1, '請選擇結束時間'),
  description: z.string()
    .min(5, '工作描述至少需要5個字符')
    .max(1000, '工作描述不能超過1000個字符'),
}).refine(
  (data) => !data.startTime || !data.endTime || timeToHours(data.endTime) > timeToHours(data.startTime),
  { message: '結束時間必須晚於開始時間', path: ['endTime'] }
);

export type WorkOrderFormData = z.infer<typeof workOrderSchema>;

// Work Order Payload interface for GSS API
export interface WorkOrderPayload {
  actNo: null;
  actTypeId: "Be";
  custNo: "GSS";
  caseContNo: "O202601234";
  prdPjtNo: "內部專案-2026011900016 - Vital  Casebridge 產品增修計畫書_2026年";
  ttlHours: number;
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