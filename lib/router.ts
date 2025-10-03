import { ComponentType, lazy } from 'react';

// Lazy load page components for better performance
const WorkOrderPage = lazy(() => import('@/pages/work-order-page'));
const EmployeesPage = lazy(() => import('@/pages/employees-page'));

export const ROUTES = {
  WORK_ORDER: 'work-order',
  EMPLOYEES: 'employees',
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
    key: ROUTES.EMPLOYEES,
    title: '成員查詢',
    requireAuth: true,
    component: EmployeesPage,
  },
];

export const getRouteConfig = (routeKey: RouteKey): RouteConfig | undefined => {
  return routeConfigs.find(config => config.key === routeKey);
};

export const getDefaultRoute = (): RouteKey => {
  return ROUTES.WORK_ORDER; // 默認顯示工作單填寫頁面
};