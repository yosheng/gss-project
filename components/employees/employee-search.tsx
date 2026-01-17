'use client';

import { memo, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

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
  const [open, setOpen] = useState(false);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');

  // Memoize filtered arrays to prevent unnecessary re-renders
  const memoizedDepartments = useMemo(() =>
    departments.filter((dept): dept is string => dept !== null),
    [departments]
  );

  const memoizedStatuses = useMemo(() =>
    statuses.filter((status): status is string => status !== null),
    [statuses]
  );

  const memoizedTitles = useMemo(() =>
    titles.filter((title): title is string => title !== null),
    [titles]
  );

  // Filter departments based on search term
  const filteredDepartments = useMemo(() => {
    if (!departmentSearchTerm) return memoizedDepartments;
    return memoizedDepartments.filter(dept =>
      dept.toLowerCase().includes(departmentSearchTerm.toLowerCase())
    );
  }, [memoizedDepartments, departmentSearchTerm]);

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

      <Select value={titleFilter} onValueChange={onTitleFilterChange}>
        <SelectTrigger className="min-h-[44px] touch-manipulation">
          <SelectValue placeholder="依職稱篩選" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">所有職稱</SelectItem>
          {memoizedTitles.map(title => (
            <SelectItem key={title} value={title}>
              {title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-h-[44px] w-full justify-between touch-manipulation"
          >
            {departmentFilter === 'all'
              ? '依部門篩選'
              : memoizedDepartments.find(dept => dept === departmentFilter) || '依部門篩選'}
            <FontAwesomeIcon icon={faChevronDown} className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput
              placeholder="搜尋部門..."
              value={departmentSearchTerm}
              onValueChange={setDepartmentSearchTerm}
            />
            <CommandList>
              <CommandEmpty>找不到部門</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onDepartmentFilterChange('all');
                    setOpen(false);
                    setDepartmentSearchTerm('');
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCheck}
                    className={cn(
                      'mr-2 h-4 w-4',
                      departmentFilter === 'all' ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  所有部門
                </CommandItem>
                {filteredDepartments.map(dept => (
                  <CommandItem
                    key={dept}
                    value={dept}
                    onSelect={(currentValue) => {
                      onDepartmentFilterChange(currentValue === departmentFilter ? 'all' : currentValue);
                      setOpen(false);
                      setDepartmentSearchTerm('');
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faCheck}
                      className={cn(
                        'mr-2 h-4 w-4',
                        departmentFilter === dept ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {dept}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
});

export default EmployeeSearch;