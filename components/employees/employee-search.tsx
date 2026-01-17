'use client';

import { memo, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchableSelect from '@/components/ui/searchable-select';

interface EmployeeSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  titleFilter: string;
  onTitleFilterChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (value: string) => void;
  departments: string[];
  statuses: string[];
  titles: string[];
}

const EmployeeSearch = memo(function EmployeeSearch({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  titleFilter,
  onTitleFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  departments,
  statuses,
  titles,
}: EmployeeSearchProps) {
  // Memoize filtered arrays to prevent unnecessary re-renders
  const memoizedStatuses = useMemo(() =>
    statuses.filter((status): status is string => status !== null),
    [statuses]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div className="relative">
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <Input
          placeholder="搜尋員工..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 focus-enhanced min-h-[44px] touch-manipulation"
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="min-h-[44px] touch-manipulation">
          <SelectValue placeholder="依狀態篩選" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">所有狀態</SelectItem>
          {memoizedStatuses.map(status => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <SearchableSelect
        value={titleFilter}
        onValueChange={onTitleFilterChange}
        options={titles}
        placeholder="依職稱篩選"
        searchPlaceholder="搜尋職稱..."
        emptyText="找不到職稱"
        allOptionLabel="所有職稱"
      />

      <SearchableSelect
        value={departmentFilter}
        onValueChange={onDepartmentFilterChange}
        options={departments}
        placeholder="依部門篩選"
        searchPlaceholder="搜尋部門..."
        emptyText="找不到部門"
        allOptionLabel="所有部門"
      />
    </div>
  );
});

export default EmployeeSearch;