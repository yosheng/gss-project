export const ROUTES = {
  WORK_ORDER: 'work-order',
  WORK_ORDER_LIST: 'work-order-list',
  EMPLOYEES: 'employees',
  EMPLOYEE_STATISTICS: 'employee-statistics',
} as const;

export type RouteKey = typeof ROUTES[keyof typeof ROUTES];

export interface RouteConfig {
  key: RouteKey;
  path: string;
  title: string;
}

export const routeConfigs: RouteConfig[] = [
  { key: ROUTES.WORK_ORDER, path: '/work-order', title: '工作單填寫' },
  { key: ROUTES.WORK_ORDER_LIST, path: '/work-order-list', title: '工作單列表' },
  { key: ROUTES.EMPLOYEES, path: '/employees', title: '成員查詢' },
  { key: ROUTES.EMPLOYEE_STATISTICS, path: '/employee-statistics', title: '員工統計' },
];
