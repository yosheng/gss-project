import { ComponentType, lazy } from 'react';

// Lazy load page components for better performance
const WorkOrderPage = lazy(() => import('@/pages/work-order-page'));
const WorkOrderListPage = lazy(() => import('@/pages/work-order-list-page'));
const EmployeesPage = lazy(() => import('@/pages/employees-page'));
const EmployeeStatisticsPage = lazy(() => import('@/pages/employee-statistics-page'));

export const ROUTES = {
  WORK_ORDER: 'work-order',
  WORK_ORDER_LIST: 'work-order-list',
  EMPLOYEES: 'employees',
  EMPLOYEE_STATISTICS: 'employee-statistics',
} as const;

export type RouteKey = typeof ROUTES[keyof typeof ROUTES];

export interface NavigationHandler {
  (route: RouteKey): void;
}

export interface RouteConfig {
  key: RouteKey;
  title: string;
  requireAuth: boolean;
  component: ComponentType<any>;
}

export const routeConfigs: RouteConfig[] = [
  {
    key: ROUTES.WORK_ORDER,
    title: '工作單填寫',
    requireAuth: true,
    component: WorkOrderPage,
  },
  {
    key: ROUTES.WORK_ORDER_LIST,
    title: '工作單列表',
    requireAuth: true,
    component: WorkOrderListPage,
  },
  {
    key: ROUTES.EMPLOYEES,
    title: '成員查詢',
    requireAuth: true,
    component: EmployeesPage,
  },
  {
    key: ROUTES.EMPLOYEE_STATISTICS,
    title: '員工統計',
    requireAuth: true,
    component: EmployeeStatisticsPage,
  },
];

export const getRouteConfig = (routeKey: RouteKey): RouteConfig | undefined => {
  return routeConfigs.find(config => config.key === routeKey);
};

export const getDefaultRoute = (): RouteKey => {
  return ROUTES.WORK_ORDER; // 默認顯示工作單填寫頁面
};