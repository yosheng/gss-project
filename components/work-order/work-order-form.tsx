'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workOrderSchema, WorkOrderFormData } from '@/lib/schemas/work-order';
import { WorkOrderClient } from '@/lib/work-order-client';
import { WorkOrderError, SecureErrorLogger } from '@/lib/errors';
import { useAuth } from '@/components/auth-provider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface WorkOrderFormProps {
  onSubmitSuccess?: (message: string) => void;
  onSubmitError?: (error: string) => void;
}

const WorkOrderForm = memo(function WorkOrderForm({ onSubmitSuccess, onSubmitError }: WorkOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const [authToken, setAuthToken] = useState('');
  const [savedToken, setSavedToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('gss-api-auth-token');
    setSavedToken(token);
  }, []);

  const handleSaveToken = () => {
    localStorage.setItem('gss-api-auth-token', authToken);
    setSavedToken(authToken);
    alert('Authorization Token 已儲存！');
  };
  
  // Memoize form configuration to prevent unnecessary re-renders
  const formConfig = useMemo(() => ({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      workDate: '',
      description: ''
    }
  }), []);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    clearErrors,
    setValue
  } = useForm<WorkOrderFormData>(formConfig);

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    const defaultDate = today.toISOString().split('T')[0];
    setValue('workDate', defaultDate);
  }, [setValue]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleTextareaResize = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(100, textarea.scrollHeight) + 'px';
  }, []);

  const handleInputChange = useCallback(() => {
    clearErrors();
  }, [clearErrors]);

  const onSubmit = useCallback(async (data: WorkOrderFormData) => {
    setIsSubmitting(true);

    const token = localStorage.getItem('gss-api-auth-token');
    if (!token) {
      onSubmitError?.('Authorization Token 未設定，請先在上方設定中儲存 Token。');
      setIsSubmitting(false);
      return;
    }

    const API_CONFIG = {
        url: 'https://assistant.gss.com.tw/AMApi/AMMaintainWeb/InsertData/AMMaintainWeb',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'accept-language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'origin': 'https://assistant.gss.com.tw',
            'priority': 'u=1, i',
            'referer': 'https://assistant.gss.com.tw/am/',
            'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
        }
    };

    const FIXED_PAYLOAD = {
        actNo: null,
        actTypeId: "Be",
        custNo: "GSS",
        caseContNo: "O202502047",
        prdPjtNo: "內部專案-2025020600007 - Vital  Casebridge產品計畫書_2025年",
        ttlHours: 8,
        isPrnToCust: "Be099",
        attachFileName: null,
        isAttachFile: "00200",
        isPrdOrPjt: "J",
        message: null,
        status: false,
        favoriteContOppId: "7016",
        suppDeptItems: "U236"
    };

    const formatDateTime = (date: string, timeStr: string) => {
        return date + timeStr;
    };

    try {
      const payload = {
          ...FIXED_PAYLOAD,
          sdateTime: formatDateTime(data.workDate, 'T00:30:00.000Z'),
          edateTime: formatDateTime(data.workDate, 'T09:30:00.000Z'),
          description: data.description.trim()
      };

      const response = await fetch(API_CONFIG.url, {
          method: 'POST',
          headers: API_CONFIG.headers,
          body: JSON.stringify(payload),
          mode: 'cors'
      });

      if (response.ok) {
        const responseData = await response.json();
        onSubmitSuccess?.(responseData.message || '工作單提交成功！');
        setTimeout(() => {
          reset({ 
            workDate: new Date().toISOString().split('T')[0],
            description: '' 
          });
          const textarea = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
          if (textarea) {
            textarea.style.height = 'auto';
          }
        }, 2000);
      } else {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const unknownError = new WorkOrderError(
        `提交失敗: ${errorMessage}`,
        'UNKNOWN_ERROR',
        500,
        error as Error
      );
      SecureErrorLogger.logError(unknownError, 'WorkOrderForm.onSubmit');
      onSubmitError?.(unknownError.getSafeMessage());
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmitSuccess, onSubmitError, reset]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-0">
      <div className="bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl lg:text-[var(--font-size-4xl)] font-[var(--font-weight-semibold)] text-center mb-2 text-[var(--color-text)]">
          AM 維護工作單提交
        </h1>
        <p className="text-center text-[var(--color-text-secondary)] mb-6 sm:mb-8 text-sm sm:text-[var(--font-size-md)]">
          請填寫以下資訊以提交維護工作單
        </p>

        <Collapsible className="mb-6">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full">
              顯示/隱藏 Authorization Token 設定
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 p-4 border rounded-md">
            <div className="space-y-4">
              <div>
                <Label htmlFor="authToken">Authorization Token (Bearer)</Label>
                <Input
                  id="authToken"
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="貼上您的 Bearer Token"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  目前狀態: {savedToken ? '已儲存' : '未設定'}
                </p>
              </div>
              <Button onClick={handleSaveToken} className="w-full">儲存 Token</Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          {/* Work Date Field */}
          <div className="mb-4 sm:mb-5 relative">
            <label 
              htmlFor="workDate" 
              className="block mb-2 font-[var(--font-weight-medium)] text-sm sm:text-[var(--font-size-md)] text-[var(--color-text)]"
            >
              工作日期
            </label>
            <input
              type="date"
              id="workDate"
              {...register('workDate', { onChange: handleInputChange })}
              className="w-full px-3 sm:px-4 py-3 sm:py-3 border border-[var(--color-border)] rounded-[var(--radius-base)] text-sm sm:text-[var(--font-size-md)] text-[var(--color-text)] bg-[var(--color-surface)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)] cursor-pointer touch-manipulation"
            />
            {errors.workDate && (
              <div className="text-[var(--color-error)] text-[var(--font-size-sm)] mt-1 opacity-100 transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-standard)]">
                {errors.workDate.message}
              </div>
            )}
          </div>

          {/* Description Field */}
          <div className="mb-4 sm:mb-5 relative">
            <label 
              htmlFor="description" 
              className="block mb-2 font-[var(--font-weight-medium)] text-sm sm:text-[var(--font-size-md)] text-[var(--color-text)]"
            >
              工作描述
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="請輸入詳細的工作描述..."
              {...register('description', { 
                onChange: (e) => {
                  handleInputChange();
                  handleTextareaResize(e);
                }
              })}
              className="w-full px-3 sm:px-4 py-3 border border-[var(--color-border)] rounded-[var(--radius-base)] text-sm sm:text-[var(--font-size-md)] text-[var(--color-text)] bg-[var(--color-surface)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)] resize-vertical min-h-[100px] sm:min-h-[120px] font-[var(--font-family-base)] leading-[var(--line-height-normal)] touch-manipulation"
            />
            {errors.description && (
              <div className="text-[var(--color-error)] text-[var(--font-size-sm)] mt-1 opacity-100 transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-standard)]">
                {errors.description.message}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="relative w-full flex items-center justify-center px-4 py-3 sm:py-4 bg-[var(--color-primary)] text-[var(--color-btn-primary-text)] rounded-[var(--radius-base)] text-sm sm:text-[var(--font-size-base)] font-medium leading-6 cursor-pointer transition-all duration-[var(--duration-normal)] ease-[var(--ease-standard)] border-none hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden touch-manipulation min-h-[48px]"
          >
            <span className={`transition-opacity duration-[var(--duration-fast)] ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>
              提交工作單
            </span>
            {isSubmitting && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin"></div>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
});

export default WorkOrderForm;