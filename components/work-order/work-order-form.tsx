'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workOrderSchema, WorkOrderFormData } from '@/lib/schemas/work-order';
import { WorkOrderClient } from '@/lib/work-order-client';
import { WorkOrderError, SecureErrorLogger } from '@/lib/errors';
import { useAuth } from '@/components/auth-provider';

interface WorkOrderFormProps {
  onSubmitSuccess?: (message: string) => void;
  onSubmitError?: (error: string) => void;
}

export default function WorkOrderForm({ onSubmitSuccess, onSubmitError }: WorkOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    clearErrors,
    setValue
  } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      workDate: '',
      description: ''
    }
  });

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    const defaultDate = today.toISOString().split('T')[0];
    setValue('workDate', defaultDate);
  }, [setValue]);

  // Auto-resize textarea
  const handleTextareaResize = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(100, textarea.scrollHeight) + 'px';
  };

  // Clear errors on input change
  const handleInputChange = () => {
    clearErrors();
  };

  const onSubmit = async (data: WorkOrderFormData) => {
    setIsSubmitting(true);
    
    try {
      // Client-side validation
      if (!WorkOrderClient.validateFormData(data)) {
        throw new WorkOrderError(
          '表單資料驗證失敗，請檢查輸入內容',
          'VALIDATION_ERROR',
          400
        );
      }

      // Log submission attempt (without sensitive data)
      console.log('Work order submission initiated', {
        timestamp: new Date().toISOString(),
        userId: user?.id ? 'authenticated' : 'anonymous',
        hasDescription: !!data.description,
        hasWorkDate: !!data.workDate
      });
      
      const response = await WorkOrderClient.submitWorkOrder(data);
      
      if (response.success) {
        onSubmitSuccess?.(response.message || '工作單提交成功！');
        
        // Reset form after 2 seconds
        setTimeout(() => {
          reset({
            workDate: new Date().toISOString().split('T')[0],
            description: ''
          });
          // Reset textarea height
          const textarea = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
          if (textarea) {
            textarea.style.height = 'auto';
          }
        }, 2000);
      }
    } catch (error) {
      // Secure error handling
      if (error instanceof WorkOrderError) {
        // Use safe error message for user display
        const safeMessage = error.getSafeMessage();
        onSubmitError?.(safeMessage);
        
        // Log error securely
        SecureErrorLogger.logError(error, 'WorkOrderForm.onSubmit');
      } else {
        // Handle unexpected errors
        const unknownError = new WorkOrderError(
          '系統發生未預期錯誤，請稍後再試',
          'UNKNOWN_ERROR',
          500,
          error as Error
        );
        
        SecureErrorLogger.logError(unknownError, 'WorkOrderForm.onSubmit');
        onSubmitError?.(unknownError.getSafeMessage());
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-8">
        <h1 className="text-[var(--font-size-4xl)] font-[var(--font-weight-semibold)] text-center mb-2 text-[var(--color-text)]">
          AM 維護工作單提交
        </h1>
        <p className="text-center text-[var(--color-text-secondary)] mb-8 text-[var(--font-size-md)]">
          請填寫以下資訊以提交維護工作單
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          {/* Work Date Field */}
          <div className="mb-5 relative">
            <label 
              htmlFor="workDate" 
              className="block mb-2 font-[var(--font-weight-medium)] text-[var(--font-size-md)] text-[var(--color-text)]"
            >
              工作日期
            </label>
            <input
              type="date"
              id="workDate"
              {...register('workDate', { onChange: handleInputChange })}
              className="w-full px-4 py-3 border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--font-size-md)] text-[var(--color-text)] bg-[var(--color-surface)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)] cursor-pointer"
            />
            {errors.workDate && (
              <div className="text-[var(--color-error)] text-[var(--font-size-sm)] mt-1 opacity-100 transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-standard)]">
                {errors.workDate.message}
              </div>
            )}
          </div>

          {/* Description Field */}
          <div className="mb-5 relative">
            <label 
              htmlFor="description" 
              className="block mb-2 font-[var(--font-weight-medium)] text-[var(--font-size-md)] text-[var(--color-text)]"
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
              className="w-full px-4 py-3 border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--font-size-md)] text-[var(--color-text)] bg-[var(--color-surface)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--focus-ring)] resize-vertical min-h-[100px] font-[var(--font-family-base)] leading-[var(--line-height-normal)]"
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
            className="relative w-full flex items-center justify-center px-4 py-3 bg-[var(--color-primary)] text-[var(--color-btn-primary-text)] rounded-[var(--radius-base)] text-[var(--font-size-base)] font-medium leading-6 cursor-pointer transition-all duration-[var(--duration-normal)] ease-[var(--ease-standard)] border-none hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
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
}