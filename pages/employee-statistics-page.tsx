'use client';

import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie } from '@fortawesome/free-solid-svg-icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, type Employee } from '@/lib/supabase';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ReactECharts from 'echarts-for-react';

export default function EmployeeStatisticsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('gss_employees')
        .select('*')
        .order('emp_id', { ascending: true });

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

  // 統計職稱分布
  const titleStatistics = useMemo(() => {
    const titleMap = new Map<string, number>();

    employees.forEach(emp => {
      const title = emp.tit_name || '未設定';
      titleMap.set(title, (titleMap.get(title) || 0) + 1);
    });

    return Array.from(titleMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [employees]);

  // 統計部門分布
  const departmentStatistics = useMemo(() => {
    const deptMap = new Map<string, number>();

    employees.forEach(emp => {
      const dept = emp.dep_name_act || emp.dep_code || '未設定';
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    });

    return Array.from(deptMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [employees]);

  // 職稱餅圖配置
  const titleChartOption = {
    title: {
      text: '職稱分布',
      left: 'center',
      top: 20,
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 人 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 60,
      type: 'scroll',
      pageButtonPosition: 'end'
    },
    series: [
      {
        name: '職稱',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {d}%'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: titleStatistics
      }
    ]
  };

  // 部門餅圖配置
  const departmentChartOption = {
    title: {
      text: '部門分布',
      left: 'center',
      top: 20,
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 人 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 60,
      type: 'scroll',
      pageButtonPosition: 'end'
    },
    series: [
      {
        name: '部門',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {d}%'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: departmentStatistics
      }
    ]
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="載入統計資料中..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      <Card className="shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faChartPie} className="text-blue-600 text-lg sm:text-xl" />
            員工統計分析
          </CardTitle>
          <CardDescription className="text-base sm:text-lg">
            總員工數: <span className="font-semibold">{employees.length}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 職稱分布圖表 */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <ReactECharts
              option={titleChartOption}
              style={{ height: '500px' }}
              opts={{ renderer: 'canvas' }}
            />
          </CardContent>
        </Card>

        {/* 部門分布圖表 */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <ReactECharts
              option={departmentChartOption}
              style={{ height: '500px' }}
              opts={{ renderer: 'canvas' }}
            />
          </CardContent>
        </Card>
      </div>

      {/* 統計數據表格 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        {/* 職稱統計表 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">職稱統計明細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">職稱</th>
                    <th className="px-4 py-2 text-right font-semibold">人數</th>
                    <th className="px-4 py-2 text-right font-semibold">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {titleStatistics.map((item, index) => (
                    <tr key={index} className="border-t dark:border-gray-700">
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2 text-right">{item.value}</td>
                      <td className="px-4 py-2 text-right">
                        {((item.value / employees.length) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 部門統計表 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">部門統計明細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">部門</th>
                    <th className="px-4 py-2 text-right font-semibold">人數</th>
                    <th className="px-4 py-2 text-right font-semibold">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentStatistics.map((item, index) => (
                    <tr key={index} className="border-t dark:border-gray-700">
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2 text-right">{item.value}</td>
                      <td className="px-4 py-2 text-right">
                        {((item.value / employees.length) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}