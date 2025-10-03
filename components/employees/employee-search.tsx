'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmployeeSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (value: string) => void;
  departments: string[];
  statuses: string[];
}

export default function EmployeeSearch({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  departments,
  statuses,
}: EmployeeSearchProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="relative">
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <Input
          placeholder="搜尋員工..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 focus-enhanced"
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger>
          <SelectValue placeholder="依狀態篩選" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">所有狀態</SelectItem>
          {statuses
            .filter((status): status is string => status !== null)
            .map(status => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <Select value={departmentFilter} onValueChange={onDepartmentFilterChange}>
        <SelectTrigger>
          <SelectValue placeholder="依部門篩選" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">所有部門</SelectItem>
          {departments
            .filter((dept): dept is string => dept !== null)
            .map(dept => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}