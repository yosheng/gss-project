'use client';

import { memo, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allOptionLabel?: string;
  className?: string;
}

const SearchableSelect = memo(function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = '請選擇...',
  searchPlaceholder = '搜尋...',
  emptyText = '找不到結果',
  allOptionLabel = '全部',
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Memoize filtered options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(
    () => options.filter((option): option is string => option !== null),
    [options]
  );

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return memoizedOptions;
    return memoizedOptions.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [memoizedOptions, searchTerm]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('min-h-[44px] w-full justify-between touch-manipulation', className)}
        >
          {value === 'all'
            ? placeholder
            : memoizedOptions.find(option => option === value) || placeholder}
          <FontAwesomeIcon icon={faChevronDown} className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onValueChange('all');
                  setOpen(false);
                  setSearchTerm('');
                }}
              >
                <FontAwesomeIcon
                  icon={faCheck}
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === 'all' ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {allOptionLabel}
              </CommandItem>
              {filteredOptions.map(option => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? 'all' : currentValue);
                    setOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCheck}
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

export default SearchableSelect;