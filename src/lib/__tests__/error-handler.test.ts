import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  normalizeError,
  validateRequired,
  validateEmail,
  validateLength,
} from '../error-handler';

describe('Error Handler', () => {
  describe('Custom Errors', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
    });

    it('should create ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should create AuthenticationError with 401 status', () => {
      const error = new AuthenticationError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should create AuthorizationError with 403 status', () => {
      const error = new AuthorizationError();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should create NotFoundError with 404 status', () => {
      const error = new NotFoundError('User');
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('normalizeError', () => {
    it('should normalize AppError', () => {
      const error = new ValidationError('Test validation error');
      const normalized = normalizeError(error);

      expect(normalized.message).toBe('Test validation error');
      expect(normalized.statusCode).toBe(400);
      expect(normalized.code).toBe('VALIDATION_ERROR');
    });

    it('should normalize standard Error', () => {
      const error = new Error('Standard error');
      const normalized = normalizeError(error);

      expect(normalized.message).toBe('Standard error');
      expect(normalized.statusCode).toBe(500);
    });

    it('should normalize string errors', () => {
      const normalized = normalizeError('String error');

      expect(normalized.message).toBe('String error');
      expect(normalized.statusCode).toBe(500);
    });

    it('should handle unknown error types', () => {
      const normalized = normalizeError({ unknown: 'error' });

      expect(normalized.message).toBe('An unknown error occurred');
      expect(normalized.statusCode).toBe(500);
    });
  });

  describe('validateRequired', () => {
    it('should pass with all required fields', () => {
      const data = { name: 'John', email: 'john@example.com' };
      expect(() => validateRequired(data, ['name', 'email'])).not.toThrow();
    });

    it('should throw ValidationError for missing fields', () => {
      const data = { name: 'John' };
      expect(() => validateRequired(data, ['name', 'email'])).toThrow(ValidationError);
    });

    it('should throw for empty strings', () => {
      const data = { name: '', email: 'john@example.com' };
      expect(() => validateRequired(data, ['name', 'email'])).toThrow(ValidationError);
    });

    it('should throw for null values', () => {
      const data = { name: null, email: 'john@example.com' };
      expect(() => validateRequired(data, ['name', 'email'])).toThrow(ValidationError);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email', () => {
      expect(() => validateEmail('test@example.com')).not.toThrow();
    });

    it('should reject invalid email', () => {
      expect(() => validateEmail('invalid-email')).toThrow(ValidationError);
      expect(() => validateEmail('test@')).toThrow(ValidationError);
      expect(() => validateEmail('@example.com')).toThrow(ValidationError);
    });
  });

  describe('validateLength', () => {
    it('should accept string within length constraints', () => {
      expect(() => validateLength('test', 'field', 2, 10)).not.toThrow();
    });

    it('should throw for string too short', () => {
      expect(() => validateLength('a', 'field', 2, 10)).toThrow(ValidationError);
    });

    it('should throw for string too long', () => {
      expect(() => validateLength('verylongstring', 'field', 2, 10)).toThrow(ValidationError);
    });

    it('should work with min only', () => {
      expect(() => validateLength('test', 'field', 2)).not.toThrow();
    });

    it('should work with max only', () => {
      expect(() => validateLength('test', 'field', undefined, 10)).not.toThrow();
    });
  });
});
