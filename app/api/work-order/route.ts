import { NextRequest, NextResponse } from 'next/server';
import { WorkOrderService } from '@/lib/gss-api';
import { WorkOrderError, SecureErrorLogger } from '@/lib/errors';
import { workOrderSchema } from '@/lib/schemas/work-order';
import { SecurityUtils, SECURITY_CONFIG } from '@/lib/security-config';

/**
 * POST /api/work-order
 * Submit work order through secure server-side API
 */
export async function POST(request: NextRequest) {
  const context = 'API.WorkOrder.POST';
  const requestId = SecurityUtils.generateRequestId();
  
  try {
    // Security: Validate request origin
    const origin = request.headers.get('origin');
    if (origin && !SecurityUtils.isAllowedOrigin(origin)) {
      throw new WorkOrderError(
        '不允許的請求來源',
        'FORBIDDEN_ORIGIN',
        403
      );
    }

    // Get client IP for rate limiting
    const clientIP = request.ip || 
                    request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    const sanitizedIP = SecurityUtils.sanitizeIP(clientIP);

    // Parse and validate request body with timeout
    let body;
    try {
      const bodyPromise = request.json();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), SECURITY_CONFIG.TIMEOUTS.API_REQUEST)
      );
      
      body = await Promise.race([bodyPromise, timeoutPromise]);
    } catch (parseError) {
      throw new WorkOrderError(
        '無效的請求格式或請求超時',
        'INVALID_REQUEST',
        400,
        parseError as Error
      );
    }

    // Validate form data using Zod schema
    const validationResult = workOrderSchema.safeParse(body);
    if (!validationResult.success) {
      throw new WorkOrderError(
        '表單驗證失敗：' + validationResult.error.errors.map(e => e.message).join(', '),
        'VALIDATION_ERROR',
        400
      );
    }

    const formData = validationResult.data;

    // Additional security validation
    if (!SecurityUtils.isValidDateRange(formData.workDate)) {
      throw new WorkOrderError(
        '日期超出允許範圍',
        'INVALID_DATE_RANGE',
        400
      );
    }

    // Log request (without sensitive data)
    console.log('API work order request received', {
      requestId,
      timestamp: new Date().toISOString(),
      clientIP: sanitizedIP,
      hasDescription: !!formData.description,
      hasWorkDate: !!formData.workDate,
      origin: origin ? SecurityUtils.redactSensitiveInfo(origin) : 'none'
    });

    // Submit work order using secure service
    const response = await WorkOrderService.submitWorkOrder(formData, clientIP);

    // Add security headers to response
    const securityHeaders = SecurityUtils.getSecurityHeaders();
    const nextResponse = NextResponse.json(response, { status: 200 });
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
      nextResponse.headers.set(key, value);
    });

    return nextResponse;

  } catch (error) {
    // Secure error handling
    if (error instanceof WorkOrderError) {
      SecureErrorLogger.logError(error, `${context}:${requestId}`);
      
      const errorResponse = NextResponse.json(
        SecureErrorLogger.createSafeErrorResponse(error),
        { status: error.statusCode }
      );

      // Add security headers even to error responses
      const securityHeaders = SecurityUtils.getSecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });

      return errorResponse;
    }

    // Handle unexpected errors
    const unknownError = new WorkOrderError(
      '伺服器內部錯誤',
      'INTERNAL_ERROR',
      500,
      error as Error
    );

    SecureErrorLogger.logError(unknownError, `${context}:${requestId}`);
    
    const errorResponse = NextResponse.json(
      SecureErrorLogger.createSafeErrorResponse(unknownError),
      { status: 500 }
    );

    // Add security headers
    const securityHeaders = SecurityUtils.getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }
}

/**
 * GET /api/work-order/health
 * Health check endpoint for API connectivity
 */
export async function GET(request: NextRequest) {
  const context = 'API.WorkOrder.GET';
  const requestId = SecurityUtils.generateRequestId();
  
  try {
    // Security: Validate request origin for health checks too
    const origin = request.headers.get('origin');
    if (origin && !SecurityUtils.isAllowedOrigin(origin)) {
      throw new WorkOrderError(
        '不允許的請求來源',
        'FORBIDDEN_ORIGIN',
        403
      );
    }

    // Check API access with timeout
    const healthPromise = WorkOrderService.validateApiAccess();
    const timeoutPromise = new Promise<boolean>((_, reject) => 
      setTimeout(() => reject(new Error('Health check timeout')), SECURITY_CONFIG.TIMEOUTS.HEALTH_CHECK)
    );
    
    const isAccessible = await Promise.race([healthPromise, timeoutPromise]);
    
    const response = NextResponse.json({
      status: 'ok',
      apiAccessible: isAccessible,
      timestamp: new Date().toISOString(),
      requestId
    }, { status: 200 });

    // Add security headers
    const securityHeaders = SecurityUtils.getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    const healthError = new WorkOrderError(
      '健康檢查失敗',
      'HEALTH_CHECK_ERROR',
      503,
      error as Error
    );

    SecureErrorLogger.logError(healthError, `${context}:${requestId}`);
    
    const errorResponse = NextResponse.json(
      SecureErrorLogger.createSafeErrorResponse(healthError),
      { status: 503 }
    );

    // Add security headers even to error responses
    const securityHeaders = SecurityUtils.getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }
}