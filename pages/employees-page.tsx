'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, type Employee } from '@/lib/supabase';
import EmployeeDetailModal from '@/components/employee-detail-modal';
import EmployeeSearch from '@/components/employees/employee-search';
import EmployeeList from '@/components/employees/employee-list';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface EmployeesPageProps {
  // No navigation handler needed as this is now a standalone page component
}

export default function EmployeesPage({}: EmployeesPageProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Memoize unique departments and statuses to prevent unnecessary recalculations
  const departments = useMemo(() => 
    Array.from(new Set(employees.map(emp => emp.dep_name_act || emp.dep_code).filter(Boolean))) as string[],
    [employees]
  );
  
  const statuses = useMemo(() => 
    Array.from(new Set(employees.map(emp => emp.job_status).filter(Boolean))) as string[],
    [employees]
  );

  // Memoize filtered employees to prevent unnecessary recalculations
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.c_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.e_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.dep_name_act?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.emp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.tit_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(employee => employee.job_status === statusFilter);
    }

    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(employee =>
        (employee.dep_name_act || employee.dep_code) === departmentFilter
      );
    }

    return filtered;
  }, [employees, searchTerm, statusFilter, departmentFilter]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gss_employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching employees:', error);
      } else {
        setEmployees(data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const openEmployeeDetail = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  }, []);



  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="載入員工資料中..." />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
        <Card className="shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} className="text-blue-600 text-lg sm:text-xl" />
                    員工資料庫
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg mt-1">
                    總員工數: <span className="font-semibold">{employees.length}</span>
                    {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' ?
                      <span className="block sm:inline"> • 篩選結果: {filteredEmployees.length}</span> : ''
                    }
                  </CardDescription>
                </div>
              </div>

              {/* Search and Filter Controls */}
              <EmployeeSearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                departmentFilter={departmentFilter}
                onDepartmentFilterChange={setDepartmentFilter}
                departments={departments}
                statuses={statuses}
              />
            </div>
          </CardHeader>

          <CardContent>
            <EmployeeList
              employees={filteredEmployees}
              totalCount={employees.length}
              onEmployeeClick={openEmployeeDetail}
              onRefresh={fetchEmployees}
            />
          </CardContent>
        </Card>
      </div>

      <EmployeeDetailModal
        employee={selectedEmployee}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}