// Work Order List Types
export interface WorkOrderListItem {
  actNo: string;
  sdateTime: string;
  edateTime: string;
  ttlHours: number;
  actTypeId: string;
  actTypeName: string;
  description: string;
  log: string;
  attachFileName: string | null;
  custNo: string;
  caseContNo: string;
  prdPjtNo: string;
  identityField: string | null;
  viewable: boolean;
  deleteable: boolean;
  modifyable: boolean;
}

export interface WorkOrderListResponse {
  status: number;
  message: string;
  data: {
    rows: WorkOrderListItem[];
    total: number;
    keyItems: any[];
  };
}

export interface WorkOrderListFilter {
  pageIndex: number;
  pageSize: number;
  sortField: string;
  sortExpression: string;
  arg: {
    actNo: string | null;
    empNo: string | null;
    caseContNo: string | null;
    isPrdOrPjt: boolean | null;
    prdPjtNo: string | null;
    sdateTime: string;
    edateTime: string;
    ttlHours: number | null;
    actTypeId: string | null;
    isPrnToCust: boolean | null;
    description: string | null;
    log: string | null;
    isAttachFile: boolean | null;
    place: string | null;
    attachFileName: string | null;
    nextActionDesc: string | null;
    includePmisWorklog: boolean;
    custNo: string | null;
  };
  clientPagging: boolean;
  keyField: string | null;
  requiredKeyItems: boolean;
}

// Payload type for fetching the work order list, allowing partial filters.
export type FetchWorkOrderListPayload = Partial<Omit<WorkOrderListFilter, 'arg'>> & {
  arg?: Partial<WorkOrderListFilter['arg']>;
};