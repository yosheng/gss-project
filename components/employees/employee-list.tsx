'use client';

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

export default function EmployeeList({ employees, totalCount, onEmployeeClick, onRefresh }: EmployeeListProps) {
  const getStatusBadgeVariant = (status: string | null) => {
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
  };

  return (
    <>
      <div className="rounded-md border table-container">
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
                  className="hover:bg-blue-50 transition-colors cursor-pointer"
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
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                      )}
                      {employee.is_show_download_photo && (
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800">
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

      {employees.length > 0 && (
        <div className="flex items-center justify-between space-x-2 py-4 border-t">
          <div className="flex-1 text-sm text-muted-foreground">
            顯示 <span className="font-medium">{employees.length}</span> 筆，共{' '}
            <span className="font-medium">{totalCount}</span> 筆員工資料
          </div>
          <Button
            variant="outline"
            onClick={onRefresh}
            className="flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faSearch} />
            重新整理
          </Button>
        </div>
      )}
    </>
  );
}