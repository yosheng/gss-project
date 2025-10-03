'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, type Employee } from '@/lib/supabase';
import EmployeeDetailModal from '@/components/employee-detail-modal';
import EmployeeSearch from '@/components/employees/employee-search';
import EmployeeList from '@/components/employees/employee-list';

interface EmployeesPageProps {
  // No navigation handler needed as this is now a standalone page component
}

export default function EmployeesPage({}: EmployeesPageProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get unique departments and statuses
  const departments = Array.from(new Set(employees.map(emp => emp.dep_name_act || emp.dep_code).filter(Boolean))) as string[];
  const statuses = Array.from(new Set(employees.map(emp => emp.job_status).filter(Boolean))) as string[];

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
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

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, statusFilter, departmentFilter]);

  const fetchEmployees = async () => {
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
  };

  const openEmployeeDetail = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };



  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} className="text-blue-600" />
                    員工資料庫
                  </CardTitle>
                  <CardDescription className="text-lg mt-1">
                    總員工數: <span className="font-semibold">{employees.length}</span>
                    {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' ?
                      ` • 篩選結果: ${filteredEmployees.length}` : ''
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