'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUser, faSearch, faEye, faDownload, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, type Employee } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import EmployeeDetailModal from './employee-detail-modal';

interface EnhancedHomeProps {
  onLogout: () => void;
}

export default function EnhancedHome({ onLogout }: EnhancedHomeProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get unique departments and statuses
  const departments = Array.from(new Set(employees.map(emp => emp.dep_name_act || emp.dep_code).filter(Boolean)));
  const statuses = Array.from(new Set(employees.map(emp => emp.job_status).filter(Boolean)));

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

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const openEmployeeDetail = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faHome} className="text-blue-600 text-xl mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">Employee Management</h1>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="flex items-center gap-2 transition-smooth hover:bg-red-50 hover:border-red-200"
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Card className="shadow-lg">
            <CardHeader className="pb-6">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <FontAwesomeIcon icon={faUser} className="text-blue-600" />
                      Employee Database
                    </CardTitle>
                    <CardDescription className="text-lg mt-1">
                      Total employees: <span className="font-semibold">{employees.length}</span>
                      {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' ? 
                        ` • Filtered: ${filteredEmployees.length}` : ''
                      }
                    </CardDescription>
                  </div>
                </div>
                
                {/* Search and Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="relative">
                    <FontAwesomeIcon 
                      icon={faSearch}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 focus-enhanced"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="rounded-md border table-container">
                <Table className="table-responsive">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Employee ID</TableHead>
                      <TableHead className="font-semibold">Chinese Name</TableHead>
                      <TableHead className="font-semibold">English Name</TableHead>
                      <TableHead className="font-semibold">Department</TableHead>
                      <TableHead className="font-semibold">Title</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Entry Date</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center gap-4">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-300 text-4xl" />
                            <div>
                              <p className="text-gray-500 font-medium">
                                {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' 
                                  ? 'No employees match your filters' 
                                  : 'No employees found'
                                }
                              </p>
                              {(searchTerm || statusFilter !== 'all' || departmentFilter !== 'all') && (
                                <p className="text-gray-400 text-sm mt-1">
                                  Try adjusting your search or filters
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <TableRow 
                          key={employee.emp_id} 
                          className="hover:bg-blue-50 transition-colors cursor-pointer"
                          onClick={() => openEmployeeDetail(employee)}
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
              
              {filteredEmployees.length > 0 && (
                <div className="flex items-center justify-between space-x-2 py-4 border-t">
                  <div className="flex-1 text-sm text-muted-foreground">
                    Showing <span className="font-medium">{filteredEmployees.length}</span> of{' '}
                    <span className="font-medium">{employees.length}</span> employees
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={fetchEmployees}
                    className="flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faSearch} />
                    Refresh Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <EmployeeDetailModal 
        employee={selectedEmployee}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}