'use client';

import { memo, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEye, faDownload } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { type Employee } from '@/lib/supabase';

interface EmployeeListProps {
  employees: Employee[];
  totalCount: number;
  onEmployeeClick: (employee: Employee) => void;
  onRefresh: () => void;
}

const EmployeeList = memo(function EmployeeList({ employees, totalCount, onEmployeeClick, onRefresh }: EmployeeListProps) {
  // Memoize status badge variant function
  const getStatusBadgeVariant = useCallback((status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case '在職':
        return 'default';
      case 'inactive':
      case '離職':
        return 'destructive';
      default:
        return 'secondary';
    }
  }, []);

  // Memoize empty state component
  const EmptyState = useMemo(() => (
    <div className="text-center py-12 bg-white rounded-lg border">
      <div className="flex flex-col items-center gap-4">
        <FontAwesomeIcon icon={faSearch} className="text-gray-300 text-4xl" />
        <div>
          <p className="text-gray-500 font-medium">
            沒有符合篩選條件的員工
          </p>
          <p className="text-gray-400 text-sm mt-1">
            請調整搜尋條件或篩選器
          </p>
        </div>
      </div>
    </div>
  ), []);

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-md border table-container">
        <Table className="table-responsive">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">員工編號</TableHead>
              <TableHead className="font-semibold">中文姓名</TableHead>
              <TableHead className="font-semibold">英文姓名</TableHead>
              <TableHead className="font-semibold">部門</TableHead>
              <TableHead className="font-semibold">職稱</TableHead>
              <TableHead className="font-semibold">狀態</TableHead>
              <TableHead className="font-semibold">到職日期</TableHead>
              <TableHead className="text-right font-semibold">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-300 text-4xl" />
                    <div>
                      <p className="text-gray-500 font-medium">
                        沒有符合篩選條件的員工
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        請調整搜尋條件或篩選器
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow
                  key={employee.emp_id}
                  className="hover:bg-blue-50 transition-colors cursor-pointer touch-manipulation"
                  onClick={() => onEmployeeClick(employee)}
                >
                  <TableCell className="font-medium text-blue-600">
                    {employee.emp_id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {employee.c_name || '-'}
                  </TableCell>
                  <TableCell>{employee.e_name || '-'}</TableCell>
                  <TableCell className="text-gray-600">
                    {employee.dep_name_act || employee.dep_code || '-'}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {employee.tit_name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(employee.job_status)}>
                      {employee.job_status || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {employee.cmp_ent_dte ? new Date(employee.cmp_ent_dte).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {employee.is_show_private_data && (
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 min-h-[36px] min-w-[36px] touch-manipulation">
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                      )}
                      {employee.is_show_download_photo && (
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800 min-h-[36px] min-w-[36px] touch-manipulation">
                          <FontAwesomeIcon icon={faDownload} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {employees.length === 0 ? EmptyState : (
          employees.map((employee) => (
            <div
              key={employee.emp_id}
              className="bg-white border rounded-lg p-4 hover:bg-blue-50 transition-colors cursor-pointer touch-manipulation employee-card"
              onClick={() => onEmployeeClick(employee)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-blue-600 text-lg truncate">
                    {employee.emp_id}
                  </h3>
                  <p className="font-semibold text-gray-900 truncate">
                    {employee.c_name || '-'}
                  </p>
                  {employee.e_name && (
                    <p className="text-sm text-gray-600 truncate">
                      {employee.e_name}
                    </p>
                  )}
                </div>
                <Badge variant={getStatusBadgeVariant(employee.job_status)} className="ml-2 flex-shrink-0">
                  {employee.job_status || 'Unknown'}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">部門:</span>
                  <span className="text-gray-900 font-medium truncate ml-2">
                    {employee.dep_name_act || employee.dep_code || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">職稱:</span>
                  <span className="text-gray-900 truncate ml-2">
                    {employee.tit_name || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">到職日期:</span>
                  <span className="text-gray-900">
                    {employee.cmp_ent_dte ? new Date(employee.cmp_ent_dte).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>

              {(employee.is_show_private_data || employee.is_show_download_photo) && (
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                  {employee.is_show_private_data && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600 hover:text-blue-800 min-h-[40px] min-w-[40px] touch-manipulation"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle view action
                      }}
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </Button>
                  )}
                  {employee.is_show_download_photo && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-green-600 hover:text-green-800 min-h-[40px] min-w-[40px] touch-manipulation"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle download action
                      }}
                    >
                      <FontAwesomeIcon icon={faDownload} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {employees.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 py-4 border-t mt-4">
          <div className="flex-1 text-sm text-muted-foreground">
            顯示 <span className="font-medium">{employees.length}</span> 筆，共{' '}
            <span className="font-medium">{totalCount}</span> 筆員工資料
          </div>
          <Button
            variant="outline"
            onClick={onRefresh}
            className="flex items-center gap-2 min-h-[44px] touch-manipulation"
          >
            <FontAwesomeIcon icon={faSearch} />
            重新整理
          </Button>
        </div>
      )}
    </>
  );
});

export default EmployeeList;