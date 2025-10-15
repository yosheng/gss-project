'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faSearch, faCalendar, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GssApiService } from '@/lib/gss-api';

// Helper functions moved from the old WorkOrderListClient
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
}

function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} 分鐘`;
  }
  return `${hours} 小時`;
}

function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  return text.substring(0, maxLength) + '...';
}

import { WorkOrderListItem } from '@/lib/types/work-order-list';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface WorkOrderListPageProps {
  // No navigation handler needed as this is now a standalone page component
}

export default function WorkOrderListPage({}: WorkOrderListPageProps) {
  const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  // Initialize date filter with last 30 days
  useEffect(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setDateFilter({
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    });
  }, []);

  // Memoize filtered work orders
  const filteredWorkOrders = useMemo(() => {
    if (!searchTerm) return workOrders;
    
    return workOrders.filter(workOrder =>
      workOrder.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.caseContNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.prdPjtNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.actNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [workOrders, searchTerm]);

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const startDateTime = dateFilter.startDate ? 
        new Date(dateFilter.startDate + 'T00:00:00.000Z').toISOString() : 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const endDateTime = dateFilter.endDate ? 
        new Date(dateFilter.endDate + 'T23:59:59.999Z').toISOString() : 
        new Date().toISOString();

      const data = await GssApiService.fetchWorkOrderList({
        pageSize: 100,
        arg: {
          sdateTime: startDateTime,
          edateTime: endDateTime,
          includePmisWorklog: true,
          actNo: null,
          empNo: null,
          caseContNo: null,
          isPrdOrPjt: null,
          prdPjtNo: null,
          ttlHours: null,
          actTypeId: null,
          isPrnToCust: null,
          description: null,
          log: null,
          isAttachFile: null,
          place: null,
          attachFileName: null,
          nextActionDesc: null,
          custNo: null
        }
      });
      
      setWorkOrders(data);
    } catch (err) {
      console.error('Failed to fetch work orders:', err);
      setError(err instanceof Error ? err.message : '獲取工作單列表失敗');
    } finally {
      setLoading(false);
    }
  }, [dateFilter.startDate, dateFilter.endDate]);

  useEffect(() => {
    if (dateFilter.startDate && dateFilter.endDate) {
      fetchWorkOrders();
    }
  }, [fetchWorkOrders, dateFilter.startDate, dateFilter.endDate]);

  const handleDateFilterChange = useCallback((field: 'startDate' | 'endDate', value: string) => {
    setDateFilter(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="載入工作單列表中..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      <Card className="shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <FontAwesomeIcon icon={faList} className="text-blue-600 text-lg sm:text-xl" />
                  工作單列表
                </CardTitle>
                <CardDescription className="text-base sm:text-lg mt-1">
                  總工作單數: <span className="font-semibold">{workOrders.length}</span>
                  {searchTerm && (
                    <span className="block sm:inline"> • 篩選結果: {filteredWorkOrders.length}</span>
                  )}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={fetchWorkOrders}
                className="flex items-center gap-2 min-h-[44px] touch-manipulation"
                disabled={loading}
              >
                <FontAwesomeIcon icon={faRefresh} className={loading ? 'animate-spin' : ''} />
                重新整理
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <Input
                  placeholder="搜尋工作單..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 min-h-[44px] touch-manipulation"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
                <Input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                  className="min-h-[44px] touch-manipulation"
                  placeholder="開始日期"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-gray-400">至</span>
                <Input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                  className="min-h-[44px] touch-manipulation"
                  placeholder="結束日期"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <FontAwesomeIcon icon={faSearch} className="text-4xl mb-2" />
                <p className="font-medium">{error}</p>
              </div>
              <Button onClick={fetchWorkOrders} variant="outline">
                重試
              </Button>
            </div>
          ) : filteredWorkOrders.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faSearch} className="text-gray-300 text-4xl mb-4" />
              <div>
                <p className="text-gray-500 font-medium">
                  沒有找到符合條件的工作單
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  請調整搜尋條件或日期範圍
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkOrders.map((workOrder) => (
                <div
                  key={workOrder.actNo}
                  className="bg-white border rounded-lg p-4 sm:p-6 hover:bg-blue-50 transition-colors employee-card"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <h3 className="font-semibold text-blue-600 text-lg">
                          {workOrder.actNo}
                        </h3>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {workOrder.actTypeName}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">工作摘要:</span>
                          <p className="text-gray-900 mt-1 leading-relaxed">
                            {truncateText(workOrder.description, 200)}
                          </p>
                        </div>
                        
                        {workOrder.caseContNo && (
                          <div>
                            <span className="font-medium text-gray-700">銷售案/合約:</span>
                            <span className="text-gray-900 ml-2">{workOrder.caseContNo}</span>
                          </div>
                        )}
                        
                        {workOrder.prdPjtNo && (
                          <div>
                            <span className="font-medium text-gray-700">產品/專案:</span>
                            <p className="text-gray-900 mt-1">
                              {truncateText(workOrder.prdPjtNo, 150)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="lg:w-64 flex-shrink-0">
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">開始時間:</span>
                          <p className="text-gray-900">
                            {formatDate(workOrder.sdateTime)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">結束時間:</span>
                          <p className="text-gray-900">
                            {formatDate(workOrder.edateTime)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">總時數:</span>
                          <span className="text-blue-600 font-semibold ml-2">
                            {formatDuration(workOrder.ttlHours)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Info */}
          {filteredWorkOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 py-4 border-t mt-6">
              <div className="text-sm text-muted-foreground">
                顯示 <span className="font-medium">{filteredWorkOrders.length}</span> 筆工作單
                {searchTerm && ` (從 ${workOrders.length} 筆中篩選)`}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}