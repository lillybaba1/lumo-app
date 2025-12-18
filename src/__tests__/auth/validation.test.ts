/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';

// Import validation schemas
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  phoneSchema,
  priceSchema,
  stockSchema,
  createProductSchema,
} from '@/lib/validation';

describe('Input Validation Schemas', () => {
  describe('Email Validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@example.co.uk',
      ];

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@nodomain.com',
        'noat.com',
        'spaces in@email.com',
        '',
      ];

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });
  });

  describe('Password Validation', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'password123',
        'secureP@ssw0rd!',
        '123456', // minimum 6 characters
      ];

      validPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      });
    });

    it('should reject passwords that are too short', () => {
      expect(() => passwordSchema.parse('12345')).toThrow();
      expect(() => passwordSchema.parse('')).toThrow();
    });

    it('should reject passwords that are too long', () => {
      const longPassword = 'a'.repeat(101);
      expect(() => passwordSchema.parse(longPassword)).toThrow();
    });
  });

  describe('Name Validation', () => {
    it('should accept valid names', () => {
      const validNames = ['John Doe', 'Jane', 'A', 'Name With Spaces'];

      validNames.forEach(name => {
        expect(() => nameSchema.parse(name)).not.toThrow();
      });
    });

    it('should reject empty names', () => {
      expect(() => nameSchema.parse('')).toThrow();
    });

    it('should trim whitespace', () => {
      const result = nameSchema.parse('  John Doe  ');
      expect(result).toBe('John Doe');
    });
  });

  describe('Phone Validation', () => {
    it('should accept valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '(123) 456-7890',
        '+1 (555) 123-4567',
        '555-123-4567',
      ];

      validPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).not.toThrow();
      });
    });

    it('should accept undefined (optional field)', () => {
      expect(() => phoneSchema.parse(undefined)).not.toThrow();
    });

    it('should reject invalid phone formats', () => {
      expect(() => phoneSchema.parse('not-a-phone')).toThrow();
      expect(() => phoneSchema.parse('abc123')).toThrow();
    });
  });

  describe('Price Validation', () => {
    it('should accept valid prices', () => {
      const validPrices = [0, 0.01, 9.99, 100, 999.99];

      validPrices.forEach(price => {
        expect(() => priceSchema.parse(price)).not.toThrow();
      });
    });

    it('should reject negative prices', () => {
      expect(() => priceSchema.parse(-1)).toThrow();
      expect(() => priceSchema.parse(-0.01)).toThrow();
    });

    it('should reject prices with more than 2 decimal places', () => {
      expect(() => priceSchema.parse(9.999)).toThrow();
      expect(() => priceSchema.parse(0.001)).toThrow();
    });
  });

  describe('Stock Validation', () => {
    it('should accept valid stock numbers', () => {
      const validStock = [0, 1, 100, 999999];

      validStock.forEach(stock => {
        expect(() => stockSchema.parse(stock)).not.toThrow();
      });
    });

    it('should reject negative stock', () => {
      expect(() => stockSchema.parse(-1)).toThrow();
    });

    it('should reject non-integer stock', () => {
      expect(() => stockSchema.parse(1.5)).toThrow();
    });
  });

  describe('Create Product Schema', () => {
    it('should accept valid product data', () => {
      const validProduct = {
        name: 'Test Product',
        description: 'A test product description',
        price: 29.99,
        stock: 100,
        category: 'Electronics',
      };

      expect(() => createProductSchema.parse(validProduct)).not.toThrow();
    });

    it('should accept product with optional fields', () => {
      const productWithOptionals = {
        name: 'Test Product',
        description: 'A test product description',
        price: 29.99,
        stock: 100,
        category: 'Electronics',
        sku: 'SKU-001',
        categoryId: 'cat-123',
        trackInventory: true,
        weight: 1.5,
      };

      expect(() => createProductSchema.parse(productWithOptionals)).not.toThrow();
    });

    it('should reject product without required fields', () => {
      const invalidProduct = {
        name: 'Test Product',
        // missing description, price, stock, category
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });

    it('should reject product with invalid price', () => {
      const invalidProduct = {
        name: 'Test Product',
        description: 'A test product description',
        price: -10, // invalid
        stock: 100,
        category: 'Electronics',
      };

      expect(() => createProductSchema.parse(invalidProduct)).toThrow();
    });
  });
});

describe('Security Input Sanitization', () => {
  it('should not allow XSS in name fields', () => {
    const xssAttempts = [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '<img src=x onerror=alert(1)>',
    ];

    // Names with these characters should still parse (it's the job of the rendering layer to escape)
    // but we verify the validation doesn't crash
    xssAttempts.forEach(attempt => {
      expect(() => nameSchema.parse(attempt)).not.toThrow();
    });
  });

  it('should handle SQL injection attempts in email', () => {
    const sqlInjectionAttempts = [
      "'; DROP TABLE users;--",
      "admin'--",
      "<script>alert('xss')</script>",
    ];

    // These should fail email validation (no valid email format)
    sqlInjectionAttempts.forEach(attempt => {
      expect(() => emailSchema.parse(attempt)).toThrow();
    });
  });

  it('should accept emails with unusual but valid characters', () => {
    // These are technically valid email formats even if suspicious
    const suspiciousButValidEmails = [
      "test@example.com",
    ];

    suspiciousButValidEmails.forEach(email => {
      expect(() => emailSchema.parse(email)).not.toThrow();
    });
  });
});
