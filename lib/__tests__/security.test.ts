// Security implementation tests
import { SecurityUtils, SECURITY_CONFIG } from '../security-config';
import { WorkOrderError, SecureErrorLogger } from '../errors';
import { InputSanitizer, ApiConfig } from '../api-config';

describe('Security Implementation', () => {
  describe('SecurityUtils', () => {
    test('should redact sensitive information', () => {
      const sensitiveText = 'Bearer abc123token password: secret123 key: apikey456';
      const redacted = SecurityUtils.redactSensitiveInfo(sensitiveText);
      
      expect(redacted).not.toContain('abc123token');
      expect(redacted).not.toContain('secret123');
      expect(redacted).not.toContain('apikey456');
      expect(redacted).toContain('[REDACTED]');
    });

    test('should generate unique request IDs', () => {
      const id1 = SecurityUtils.generateRequestId();
      const id2 = SecurityUtils.generateRequestId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    test('should validate allowed origins', () => {
      expect(SecurityUtils.isAllowedOrigin('https://assistant.gss.com.tw')).toBe(true);
      expect(SecurityUtils.isAllowedOrigin('https://malicious.com')).toBe(false);
      expect(SecurityUtils.isAllowedOrigin(null)).toBe(false);
    });

    test('should sanitize IP addresses', () => {
      expect(SecurityUtils.sanitizeIP('192.168.1.100')).toBe('192.168.***.***.'); 
      expect(SecurityUtils.sanitizeIP('2001:db8::1')).toBe('2001:***');
      expect(SecurityUtils.sanitizeIP('unknown')).toBe('unknown');
    });

    test('should validate date ranges', () => {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      expect(SecurityUtils.isValidDateRange(today)).toBe(true);
      expect(SecurityUtils.isValidDateRange(futureDate)).toBe(false);
    });
  });

  describe('InputSanitizer', () => {
    test('should sanitize string input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = InputSanitizer.sanitizeString(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Hello World');
    });

    test('should validate date format', () => {
      expect(() => InputSanitizer.sanitizeDate('2024-01-01')).not.toThrow();
      expect(() => InputSanitizer.sanitizeDate('invalid-date')).toThrow(WorkOrderError);
      expect(() => InputSanitizer.sanitizeDate('2024/01/01')).toThrow(WorkOrderError);
    });

    test('should validate payload structure', () => {
      const validPayload = {
        sdateTime: '2024-01-01T00:30:00.000Z',
        edateTime: '2024-01-01T09:30:00.000Z',
        description: 'Valid description'
      };

      expect(() => InputSanitizer.validatePayload(validPayload)).not.toThrow();
      expect(() => InputSanitizer.validatePayload({})).toThrow(WorkOrderError);
      expect(() => InputSanitizer.validatePayload(null)).toThrow(WorkOrderError);
    });
  });

  describe('WorkOrderError', () => {
    test('should create safe error messages', () => {
      const error = new WorkOrderError(
        'API failed with Bearer abc123token',
        'API_ERROR',
        500
      );

      const safeMessage = error.getSafeMessage();
      expect(safeMessage).not.toContain('abc123token');
      expect(safeMessage).toContain('[REDACTED]');
    });

    test('should provide debug info', () => {
      const originalError = new Error('Original error');
      const error = new WorkOrderError(
        'Test error',
        'TEST_ERROR',
        400,
        originalError
      );

      const debugInfo = error.getDebugInfo();
      expect(debugInfo).toHaveProperty('message');
      expect(debugInfo).toHaveProperty('code');
      expect(debugInfo).toHaveProperty('statusCode');
      expect(debugInfo).toHaveProperty('timestamp');
    });
  });

  describe('SecureErrorLogger', () => {
    test('should create safe error responses', () => {
      const error = new WorkOrderError(
        'Sensitive error with Bearer token123',
        'API_ERROR',
        500
      );

      const response = SecureErrorLogger.createSafeErrorResponse(error);
      
      expect(response.success).toBe(false);
      expect(response.error).not.toContain('token123');
      expect(response.code).toBe('API_ERROR');
    });
  });

  describe('Rate Limiting', () => {
    test('should check rate limits correctly', () => {
      const now = Date.now();
      const windowStart = now - 30000; // 30 seconds ago
      
      // Within limits
      expect(SecurityUtils.isWithinRateLimit(5, windowStart)).toBe(true);
      
      // Exceeded limits
      expect(SecurityUtils.isWithinRateLimit(15, windowStart)).toBe(false);
      
      // Expired window
      const oldWindowStart = now - 120000; // 2 minutes ago
      expect(SecurityUtils.isWithinRateLimit(15, oldWindowStart)).toBe(true);
    });
  });
});

// Mock console methods for testing
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});