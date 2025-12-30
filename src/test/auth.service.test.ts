import { authService } from '../auth/auth.service';
import { TestDatabaseUtil } from './database.test.util';

describe('AuthService', () => {
  let testDbPath: string;

  beforeEach(() => {
    // Create a new test database path for each test
    testDbPath = TestDatabaseUtil.createTestDatabasePath();

    // Reinitialize authService with new database path by creating a fresh instance
    const AuthServiceClass = (authService.constructor as any);
    const newAuthService = new AuthServiceClass(testDbPath);

    // Copy all properties from the new instance to the singleton
    Object.assign(authService, newAuthService);
  });

  afterEach(() => {
    // Clean up the test database after each test
    TestDatabaseUtil.cleanupTestDatabase(testDbPath);
  });

  describe('register', () => {
    it('should register a new user with valid credentials', async () => {
      const user = await authService.register('testuser', 'testpass123');

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username', 'testuser');
      expect(user).toHaveProperty('createdAt');
      // Verify that passwordHash is actually a bcrypt hash (not the mocked value)
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe('hashed_testpass123');
    });

    it('should throw error when user already exists', async () => {
      // Register a user first
      await authService.register('testuser', 'testpass123');

      // Try to register the same user again
      await expect(authService.register('testuser', 'differentpass'))
        .rejects.toThrow('User already exists');
    });

    it('should handle special characters in username and password', async () => {
      const user = await authService.register('user@123', '!@#$%^&*()');

      expect(user).toHaveProperty('username', 'user@123');
      expect(user.passwordHash).toBeDefined();
      // Verify that passwordHash is actually a bcrypt hash (not the mocked value)
      expect(user.passwordHash).not.toBe('hashed_!@#$%^&*()');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Register a user first
      await authService.register('testuser', 'testpass123');
    });

    it('should login successfully with valid credentials', async () => {
      const result = await authService.login('testuser', 'testpass123');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user.username', 'testuser');
      expect(result.user).toHaveProperty('id');
    });

    it('should throw error with invalid username', async () => {
      await expect(authService.login('nonexistent', 'testpass123'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error with invalid password', async () => {
      await expect(authService.login('testuser', 'wrongpass'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should handle special characters in credentials', async () => {
      // Register user with special chars
      await authService.register('user@123', '!@#$%^&*()');

      const result = await authService.login('user@123', '!@#$%^&*()');

      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('username', 'user@123');
    });
  });

  describe('verifyToken', () => {
    let token: string;

    beforeEach(async () => {
      // Register and login to get a valid token
      await authService.register('testuser', 'testpass123');
      const result = await authService.login('testuser', 'testpass123');
      token = result.token;
    });

    it('should verify a valid token', () => {
      const decoded = authService.verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('username', 'testuser');
    });

    it('should return null for invalid token', () => {
      const decoded = authService.verifyToken('invalid-token');

      expect(decoded).toBeNull();
    });
  });

  describe('getUserById', () => {
    let userId: string;

    beforeEach(async () => {
      // Register a user and get their ID
      const user = await authService.register('testuser', 'testpass123');
      userId = user.id;
    });

    it('should return user by valid ID', async () => {
      const user = await authService.getUserById(userId);

      expect(user).not.toBeUndefined();
      expect(user).toHaveProperty('username', 'testuser');
    });

    it('should return undefined for non-existent ID', async () => {
      const user = await authService.getUserById('non-existent-id');

      expect(user).toBeNull();
    });
  });

  describe('register then login integration', () => {
    it('should successfully register a user and then login with the same credentials', async () => {
      // Register a new user
      const registeredUser = await authService.register('integrationuser', 'securepassword123');

      // Verify registration worked
      expect(registeredUser).toHaveProperty('username', 'integrationuser');
      expect(registeredUser).toHaveProperty('id');
      // Verify that passwordHash is actually a bcrypt hash (not the mocked value)
      expect(registeredUser.passwordHash).toBeDefined();
      expect(registeredUser.passwordHash).not.toBe('hashed_securepassword123');

      // Login with the same credentials
      const loginResult = await authService.login('integrationuser', 'securepassword123');

      // Verify login worked
      expect(loginResult).toHaveProperty('token');
      expect(loginResult.user).toHaveProperty('username', 'integrationuser');
      expect(loginResult.user).toHaveProperty('id', registeredUser.id);

      // Verify the token is valid
      const decodedToken = authService.verifyToken(loginResult.token);
      expect(decodedToken).not.toBeNull();
      expect(decodedToken).toHaveProperty('userId', registeredUser.id);
      expect(decodedToken).toHaveProperty('username', 'integrationuser');
    });

    it('should fail to login with wrong password', async () => {
      // Register a new user
      await authService.register('integrationuser2', 'securepassword123');

      // Try to login with wrong password
      await expect(authService.login('integrationuser2', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });
  });
});