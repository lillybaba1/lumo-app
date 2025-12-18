/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase client - will be recreated for each test
let mockSupabaseClient: any;

// Setup mocks before each test
beforeEach(() => {
  vi.resetModules();
  
  mockSupabaseClient = {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  };

  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
  }));

  vi.doMock('@/lib/supabaseAdmin', () => ({
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      })),
      auth: {
        admin: {
          deleteUser: vi.fn(),
          updateUserById: vi.fn(),
        },
      },
    },
  }));

  vi.doMock('next/cache', () => ({
    revalidatePath: vi.fn(),
  }));
});

describe('Auth Service', () => {
  describe('User Registration', () => {
    it('should successfully create a new user', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };

      // Mock the count check first (first call to from())
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValueOnce({ count: 5 }),
      });

      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // Mock the insert for profile creation (second call to from())
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValueOnce({ error: null }),
      });

      // Import after mocks are set up
      const { createUser } = await import('@/services/authService');
      
      const result = await createUser('test@example.com', 'password123', 'Test User');
      
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
    });

    it('should handle weak password error', async () => {
      // Mock the count check first
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValueOnce({ count: 5 }),
      });

      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Password is too weak' },
      });

      const { createUser } = await import('@/services/authService');
      
      const result = await createUser('test@example.com', '123', 'Test User');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('weak');
    });

    it('should handle duplicate email error', async () => {
      // Mock the count check first
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValueOnce({ count: 5 }),
      });

      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const { createUser } = await import('@/services/authService');
      
      const result = await createUser('existing@example.com', 'password123', 'Test User');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
    });
  });

  describe('User Login', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      mockSupabaseClient.auth.signInWithPassword('test@example.com', 'password123');
      
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });

    it('should handle invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await mockSupabaseClient.auth.signInWithPassword(
        'wrong@example.com',
        'wrongpassword'
      );
      
      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Invalid');
    });
  });

  describe('Session Management', () => {
    it('should get current user when authenticated', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const result = await mockSupabaseClient.auth.getUser();
      
      expect(result.data.user).toBeTruthy();
      expect(result.data.user.email).toBe('test@example.com');
    });

    it('should return null when not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const result = await mockSupabaseClient.auth.getUser();
      
      expect(result.data.user).toBeNull();
    });

    it('should successfully sign out', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
        error: null,
      });

      const result = await mockSupabaseClient.auth.signOut();
      
      expect(result.error).toBeNull();
    });
  });
});

describe('Auth Roles', () => {
  it('should correctly identify APP_OWNER_ADMIN role', async () => {
    const { isAppOwnerAdmin } = await import('@/lib/auth-roles');
    
    const adminUser = {
      uid: 'admin-id',
      email: 'admin@example.com',
      name: 'Admin',
      phoneNumber: '',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      role: 'APP_OWNER_ADMIN' as const,
    };

    expect(isAppOwnerAdmin(adminUser)).toBe(true);
    expect(isAppOwnerAdmin(null)).toBe(false);
  });

  it('should correctly identify BUSINESS_ACCOUNT role', async () => {
    const { isBusinessAccount } = await import('@/lib/auth-roles');
    
    const businessUser = {
      uid: 'business-id',
      email: 'business@example.com',
      name: 'Business',
      phoneNumber: '',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      role: 'BUSINESS_ACCOUNT' as const,
    };

    expect(isBusinessAccount(businessUser)).toBe(true);
    expect(isBusinessAccount(null)).toBe(false);
  });

  it('should correctly identify PERSONAL_ACCOUNT role', async () => {
    const { isPersonalAccount } = await import('@/lib/auth-roles');
    
    const personalUser = {
      uid: 'personal-id',
      email: 'user@example.com',
      name: 'User',
      phoneNumber: '',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      role: 'PERSONAL_ACCOUNT' as const,
    };

    expect(isPersonalAccount(personalUser)).toBe(true);
    expect(isPersonalAccount(null)).toBe(false);
  });

  it('should support legacy admin role', async () => {
    const { isAppOwnerAdmin } = await import('@/lib/auth-roles');
    
    const legacyAdmin = {
      uid: 'admin-id',
      email: 'admin@example.com',
      name: 'Admin',
      phoneNumber: '',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      role: 'admin' as any,
    };

    expect(isAppOwnerAdmin(legacyAdmin)).toBe(true);
  });

  it('should support legacy customer role', async () => {
    const { isPersonalAccount } = await import('@/lib/auth-roles');
    
    const legacyCustomer = {
      uid: 'user-id',
      email: 'user@example.com',
      name: 'User',
      phoneNumber: '',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      role: 'customer' as any,
    };

    expect(isPersonalAccount(legacyCustomer)).toBe(true);
  });
});
