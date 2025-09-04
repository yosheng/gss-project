'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase, type Employee } from '@/lib/supabase';
import { signOut } from '@/lib/auth';

interface HomeProps {
  onLogout: () => void;
}

export default function Home({ onLogout }: HomeProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const filtered = employees.filter(employee =>
      employee.c_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.e_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.dep_name_act?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.emp_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [employees, searchTerm]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FontAwesomeIcon icon="home" className="text-blue-600 text-xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Employee Management</h1>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <FontAwesomeIcon icon="sign-out-alt" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">Employee Database</CardTitle>
                <CardDescription>
                  Total employees: {employees.length}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-80">
                <FontAwesomeIcon 
                  icon="search" 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Chinese Name</TableHead>
                    <TableHead>English Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Company Entry Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FontAwesomeIcon icon="search" className="text-gray-400 text-2xl" />
                          <p className="text-gray-500">
                            {searchTerm ? 'No employees match your search' : 'No employees found'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <TableRow key={employee.emp_id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{employee.emp_id}</TableCell>
                        <TableCell>{employee.c_name || '-'}</TableCell>
                        <TableCell>{employee.e_name || '-'}</TableCell>
                        <TableCell>{employee.dep_name_act || employee.dep_code || '-'}</TableCell>
                        <TableCell>{employee.tit_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(employee.job_status)}>
                            {employee.job_status || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {employee.cmp_ent_dte ? new Date(employee.cmp_ent_dte).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {employee.is_show_private_data && (
                              <Button variant="ghost" size="sm">
                                <FontAwesomeIcon icon="eye" className="text-blue-600" />
                              </Button>
                            )}
                            {employee.is_show_download_photo && (
                              <Button variant="ghost" size="sm">
                                <FontAwesomeIcon icon="download" className="text-green-600" />
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
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  Showing {filteredEmployees.length} of {employees.length} employees
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}