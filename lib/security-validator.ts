/**
 * Security validation utilities for the authentication and API security system
 * This module provides validation functions to ensure security measures are properly implemented
 */

import { ApiConfig } from './api-config';
import { validateUserSession } from './auth';
import { SecurityUtils } from './security-config';
import { User } from '@supabase/supabase-js';

export class SecurityValidator {
  /**
   * Validate that all security measures are properly configured
   * @returns Validation result with details
   */
  static validateSecurityConfiguration(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check environment variables

    if (!process.env.NEXT_PUBLIC_GSS_API_URL) {
      issues.push('GSS_API_URL environment variable is missing');
    } else if (!process.env.NEXT_PUBLIC_GSS_API_URL.startsWith('https://')) {
      issues.push('GSS_API_URL should use HTTPS protocol');
    }

    // Check Supabase configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      issues.push('NEXT_PUBLIC_SUPABASE_URL is missing');
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      issues.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing');
    }

    // Security recommendations
    if (process.env.NODE_ENV === 'production') {
      if (process.env.NEXT_PUBLIC_USERNAME === 'admin' && process.env.NEXT_PUBLIC_PASSWORD === 'admin') {
        recommendations.push('Consider using stronger default credentials in production');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Validate API configuration security
   * @returns boolean indicating if API config is secure
   */
  static validateApiSecurity(): boolean {
    try {
      const apiConfig = ApiConfig.getInstance();
      
      // Validate token format
      if (!apiConfig.validateTokenFormat()) {
        console.warn('API token format validation failed');
        return false;
      }

      // Validate URL
      const url = apiConfig.getApiUrl();
      if (!url.startsWith('https://')) {
        console.warn('API URL is not using HTTPS');
        return false;
      }

      // Validate headers
      const headers = apiConfig.getSecureHeaders();
      if (!headers.Authorization || !headers.Authorization.startsWith('Bearer ')) {
        console.warn('Authorization header is missing or invalid');
        return false;
      }

      return true;
    } catch (error) {
      console.error('API security validation failed:', error);
      return false;
    }
  }

  /**
   * Validate user session security
   * @param user - User object to validate
   * @returns Validation result
   */
  static validateUserSecurity(user: User | null): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!user) {
      issues.push('User is null');
      return { isValid: false, issues };
    }

    // Use existing validation function
    if (!validateUserSession(user)) {
      issues.push('User session validation failed');
    }

    // Additional security checks
    if (!user.id) {
      issues.push('User ID is missing');
    }

    if (!user.email && !user.user_metadata?.name) {
      issues.push('User identification information is missing');
    }

    // Check for suspicious user data
    if (user.email && !user.email.includes('@')) {
      issues.push('User email format is invalid');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Validate route protection implementation
   * @param requireAuth - Whether route requires authentication
   * @param user - Current user
   * @returns boolean indicating if route access is properly controlled
   */
  static validateRouteProtection(requireAuth: boolean, user: User | null): boolean {
    if (!requireAuth) {
      // Public routes should always be accessible
      return true;
    }

    // Protected routes should only be accessible to authenticated users
    return validateUserSession(user);
  }

  /**
   * Validate input sanitization
   * @param input - Input to validate
   * @param maxLength - Maximum allowed length
   * @returns Validation result
   */
  static validateInputSanitization(input: string, maxLength: number = 1000): {
    isValid: boolean;
    issues: string[];
    sanitizedInput?: string;
  } {
    const issues: string[] = [];

    if (typeof input !== 'string') {
      issues.push('Input is not a string');
      return { isValid: false, issues };
    }

    // Check for potentially dangerous content
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<[^>]*>/g
    ];

    let hasDangerousContent = false;
    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        hasDangerousContent = true;
        break;
      }
    }

    if (hasDangerousContent) {
      issues.push('Input contains potentially dangerous content');
    }

    if (input.length > maxLength) {
      issues.push(`Input exceeds maximum length of ${maxLength} characters`);
    }

    // Sanitize input
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '')
      .trim();

    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return {
      isValid: issues.length === 0,
      issues,
      sanitizedInput: sanitized
    };
  }

  /**
   * Perform comprehensive security audit
   * @param user - Current user (optional)
   * @returns Complete security audit result
   */
  static performSecurityAudit(user?: User | null): {
    overall: 'PASS' | 'WARN' | 'FAIL';
    results: {
      configuration: ReturnType<typeof SecurityValidator.validateSecurityConfiguration>;
      apiSecurity: boolean;
      userSecurity?: ReturnType<typeof SecurityValidator.validateUserSecurity>;
    };
    summary: string;
  } {
    const results = {
      configuration: this.validateSecurityConfiguration(),
      apiSecurity: this.validateApiSecurity(),
      userSecurity: user ? this.validateUserSecurity(user) : undefined
    };

    let overall: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    const issues: string[] = [];

    // Check configuration
    if (!results.configuration.isValid) {
      overall = 'FAIL';
      issues.push(...results.configuration.issues);
    } else if (results.configuration.recommendations.length > 0) {
      if (overall === 'PASS') overall = 'WARN';
    }

    // Check API security
    if (!results.apiSecurity) {
      overall = 'FAIL';
      issues.push('API security validation failed');
    }

    // Check user security
    if (results.userSecurity && !results.userSecurity.isValid) {
      overall = 'FAIL';
      issues.push(...results.userSecurity.issues);
    }

    let summary: string;
    switch (overall) {
      case 'PASS':
        summary = 'All security measures are properly implemented';
        break;
      case 'WARN':
        summary = `Security is functional but has ${results.configuration.recommendations.length} recommendations`;
        break;
      case 'FAIL':
        summary = `Security validation failed with ${issues.length} critical issues`;
        break;
    }

    return {
      overall,
      results,
      summary
    };
  }
}

/**
 * Security monitoring utilities
 */
export class SecurityMonitor {
  private static securityEvents: Array<{
    timestamp: Date;
    event: string;
    severity: 'INFO' | 'WARN' | 'ERROR';
    details?: any;
  }> = [];

  /**
   * Log security event
   * @param event - Event description
   * @param severity - Event severity
   * @param details - Additional details
   */
  static logSecurityEvent(
    event: string, 
    severity: 'INFO' | 'WARN' | 'ERROR' = 'INFO', 
    details?: any
  ): void {
    const securityEvent = {
      timestamp: new Date(),
      event,
      severity,
      details: details ? SecurityUtils.redactSensitiveInfo(JSON.stringify(details)) : undefined
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 100 events
    if (this.securityEvents.length > 100) {
      this.securityEvents = this.securityEvents.slice(-100);
    }

    // Log to console based on severity
    const logMessage = `[SECURITY-${severity}] ${event}`;
    switch (severity) {
      case 'ERROR':
        console.error(logMessage, details);
        break;
      case 'WARN':
        console.warn(logMessage, details);
        break;
      default:
        console.log(logMessage, details);
    }
  }

  /**
   * Get recent security events
   * @param limit - Maximum number of events to return
   * @returns Array of recent security events
   */
  static getRecentEvents(limit: number = 10): Array<{
    timestamp: Date;
    event: string;
    severity: 'INFO' | 'WARN' | 'ERROR';
    details?: any;
  }> {
    return this.securityEvents.slice(-limit);
  }

  /**
   * Clear security event log
   */
  static clearEvents(): void {
    this.securityEvents = [];
  }

  /**
   * Get security event statistics
   * @returns Event statistics
   */
  static getEventStats(): {
    total: number;
    byLevel: Record<'INFO' | 'WARN' | 'ERROR', number>;
    recent24h: number;
  } {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const byLevel = { INFO: 0, WARN: 0, ERROR: 0 };
    let recent24h = 0;

    for (const event of this.securityEvents) {
      byLevel[event.severity]++;
      if (event.timestamp > yesterday) {
        recent24h++;
      }
    }

    return {
      total: this.securityEvents.length,
      byLevel,
      recent24h
    };
  }
}