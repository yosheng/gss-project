'use client';

import { useState } from 'react';
import WorkOrderForm from '@/components/work-order/work-order-form';
import WorkOrderResponse from '@/components/work-order/work-order-response';
import { NavigationHandler } from '@/lib/router';

interface WorkOrderPageProps {
  // No navigation handler needed as this is now a standalone page component
}

export default function WorkOrderPage({}: WorkOrderPageProps) {
  const [responseMessage, setResponseMessage] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const handleSubmitSuccess = (message: string) => {
    setResponseMessage({ message, type: 'success' });
  };

  const handleSubmitError = (error: string) => {
    setResponseMessage({ message: error, type: 'error' });
  };

  const hideResponseMessage = () => {
    setResponseMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <WorkOrderForm 
        onSubmitSuccess={handleSubmitSuccess}
        onSubmitError={handleSubmitError}
      />
      
      {/* Response Message */}
      {responseMessage && (
        <WorkOrderResponse
          message={responseMessage.message}
          type={responseMessage.type}
          onClose={hideResponseMessage}
          autoHide={responseMessage.type === 'success'}
          autoHideDelay={5000}
        />
      )}
    </div>
  );
}