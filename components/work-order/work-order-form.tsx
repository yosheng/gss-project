'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workOrderSchema, WorkOrderFormData } from '@/lib/schemas/work-order';
import { GssApiService } from '@/lib/gss-api';
import { WorkOrderError, SecureErrorLogger, ERROR_CODES } from '@/lib/errors';
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

    try {
      // Use the new unified ApiClient
      const response = await GssApiService.submitWorkOrder(data);
      onSubmitSuccess?.(response.message || '工作單提交成功！');
      
      // Reset form on success
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

    } catch (error) {
      const errorMessage = (error instanceof WorkOrderError)
        ? error 
        : new WorkOrderError(
            '發生未知錯誤',
            ERROR_CODES.API_ERROR,
            500,
            error as Error
          );
      SecureErrorLogger.logError(errorMessage, 'WorkOrderForm.onSubmit');
      onSubmitError?.('發生未知錯誤');
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