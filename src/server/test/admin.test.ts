// Force memory database for tests - must be done BEFORE importing app
delete process.env.POSTGRES_URL;

import request from 'supertest';
import { app } from '../index';
import { DatabaseService } from '../database/database.service';
import { authService } from '../auth/auth.service';

describe('Admin API Integration Tests', () => {
  let adminToken: string;
  let regularUserToken: string;
  let adminUserId: string;
  let regularUserId: string;

  beforeEach(() => {
    // Clear the in-memory database before each test to ensure isolation
    const dbService = new DatabaseService();
    dbService.clearMemoryDatabase();
  });

  describe('Admin Authentication and Setup', () => {
    it('should register and promote a user to admin via direct database manipulation', async () => {
      // Register a regular user
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: 'regularuser',
          password: 'securepassword123'
        })
        .expect(201);

      expect(registerResponse.body.user).toHaveProperty('username', 'regularuser');
      regularUserId = registerResponse.body.user.id;

      // Register an admin user via direct database manipulation to bypass API limitation
      const adminUser = await authService.register('adminuser', 'adminpassword123', true);
      adminUserId = adminUser.id;

      // Login with regular user
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'regularuser',
          password: 'securepassword123'
        })
        .expect(200);

      regularUserToken = loginResponse.body.token;

      // Login with admin user
      const adminLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      adminToken = adminLoginResponse.body.token;

      // Verify admin user has isAdmin flag set
      const adminUserFromDB = await authService.getUserById(adminUserId);
      expect(adminUserFromDB).toHaveProperty('isAdmin', true);

      // Verify regular user doesn't have admin flag
      const regularUser = await authService.getUserById(regularUserId);
      expect(regularUser).toHaveProperty('isAdmin', false);
    });
  });

  describe('Admin Multiplier API Tests', () => {
    it('should update user multipliers with valid quiz types', async () => {
      // First register and login an admin user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isAdmin: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      const adminToken = adminLogin.body.token;

      // Register a regular user to update
      const userRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(201);

      const userId = userRegister.body.user.id;

      // Update multiplier for simple-math quiz type
      const updateResponse = await request(app)
        .patch(`/admin/users/${userId}/multiplier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: 3
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('message', 'Multiplier updated successfully');
      expect(updateResponse.body).toHaveProperty('userId', userId);
      expect(updateResponse.body).toHaveProperty('quizType', 'simple-math');
      expect(updateResponse.body).toHaveProperty('multiplier', 3);

      // Verify the multiplier was actually set in the database
      const dbService = new DatabaseService();
      const multiplier = await dbService.getUserMultiplier(userId, 'simple-math');
      expect(multiplier).toBe(3);
    });

    it('should reject invalid quiz types', async () => {
      // Register and login an admin user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isAdmin: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      const adminToken = adminLogin.body.token;

      // Register a regular user
      const userRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(201);

      const userId = userRegister.body.user.id;

      // Try to update with invalid quiz type
      const updateResponse = await request(app)
        .patch(`/admin/users/${userId}/multiplier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizType: 'invalid-quiz-type',
          multiplier: 2
        })
        .expect(400);

      expect(updateResponse.body.error).toHaveProperty('message', 'Invalid quiz type. Must be one of: simple-math, simple-math-2, simple-math-3, simple-math-4, simple-math-5, simple-words');
    });

    it('should reject negative multipliers', async () => {
      // Register and login an admin user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isAdmin: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      const adminToken = adminLogin.body.token;

      // Register a regular user
      const userRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(201);

      const userId = userRegister.body.user.id;

      // Try to update with negative multiplier
      const updateResponse = await request(app)
        .patch(`/admin/users/${userId}/multiplier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: -1
        })
        .expect(400);

      expect(updateResponse.body.error).toHaveProperty('message', 'Multiplier must be an integer greater than or equal to 0');
    });

    it('should reject non-admin users from updating multipliers', async () => {
      // Register a regular user
      const userRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'regularuser',
          password: 'password123'
        })
        .expect(201);

      const userLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'regularuser',
          password: 'password123'
        })
        .expect(200);

      const regularUserToken = userLogin.body.token;

      // Register an admin user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isAdmin: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      const adminUserId = adminRegister.body.user.id;
      const adminToken = adminLogin.body.token;

      // Regular user tries to update multiplier (should be forbidden)
      const updateResponse = await request(app)
        .patch(`/admin/users/${adminUserId}/multiplier`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: 2
        })
        .expect(403);

      expect(updateResponse.body.error).toHaveProperty('message', 'Access denied. Admin privileges required.');
    });
  });

  describe('Admin Credits API Tests', () => {
    it('should update user credits with absolute values', async () => {
      // Register and login an admin user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isAdmin: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      const adminToken = adminLogin.body.token;

      // Register a regular user to update
      const userRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(201);

      const userId = userRegister.body.user.id;

      // Update credits with absolute values
      const updateResponse = await request(app)
        .patch(`/admin/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          earnedCredits: 150,
          claimedCredits: 75
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('message', 'Credits updated successfully');
      expect(updateResponse.body).toHaveProperty('userId', userId);
      expect(updateResponse.body).toHaveProperty('earnedCredits', 150);
      expect(updateResponse.body).toHaveProperty('claimedCredits', 75);

      // Verify the credits were actually set in the database
      const dbService = new DatabaseService();
      const earned = await dbService.getEarnedCredits(userId);
      const claimed = await dbService.getClaimedCredits(userId);
      expect(earned).toBe(150);
      expect(claimed).toBe(75);
    });

    it('should update user credits with delta values', async () => {
      // Register and login an admin user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isAdmin: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      const adminToken = adminLogin.body.token;

      // Register a regular user to update
      const userRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(201);

      const userId = userRegister.body.user.id;

      // First, set some initial credits
      await request(app)
        .patch(`/admin/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          earnedCredits: 100,
          claimedCredits: 50
        });

      // Update credits with delta values
      const updateResponse = await request(app)
        .patch(`/admin/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          earnedDelta: 50,
          claimedDelta: -10
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('message', 'Credits updated successfully');
      expect(updateResponse.body).toHaveProperty('userId', userId);
      expect(updateResponse.body).toHaveProperty('earnedCredits', 150);  // 100 + 50
      expect(updateResponse.body).toHaveProperty('claimedCredits', 40);  // 50 - 10

      // Verify the credits were actually updated in the database
      const dbService = new DatabaseService();
      const earned = await dbService.getEarnedCredits(userId);
      const claimed = await dbService.getClaimedCredits(userId);
      expect(earned).toBe(150);
      expect(claimed).toBe(40);
    });

    it('should reject claimed credits exceeding earned credits', async () => {
      // Register and login an admin user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isAdmin: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      const adminToken = adminLogin.body.token;

      // Register a regular user to update
      const userRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(201);

      const userId = userRegister.body.user.id;

      // Try to set claimed credits higher than earned credits
      const updateResponse = await request(app)
        .patch(`/admin/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          earnedCredits: 100,
          claimedCredits: 150  // This should fail
        })
        .expect(409);

      expect(updateResponse.body.error).toHaveProperty('message', 'Claimed credits cannot exceed earned credits');
    });

    it('should reject non-admin users from updating credits', async () => {
      // Register a regular user
      const userRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'regularuser',
          password: 'password123'
        })
        .expect(201);

      const userLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'regularuser',
          password: 'password123'
        })
        .expect(200);

      const regularUserToken = userLogin.body.token;

      // Register an admin user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isAdmin: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      const adminUserId = adminRegister.body.user.id;
      const adminToken = adminLogin.body.token;

      // Regular user tries to update credits (should be forbidden)
      const updateResponse = await request(app)
        .patch(`/admin/users/${adminUserId}/credits`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          earnedCredits: 100,
          claimedCredits: 50
        })
        .expect(403);

      expect(updateResponse.body.error).toHaveProperty('message', 'Access denied. Admin privileges required.');
    });
  });

  describe('Admin Users API Tests', () => {
    it('should list users with multipliers and credits', async () => {
      // Register and login an admin user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isAdmin: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      const adminToken = adminLogin.body.token;

      // Register a regular user
      const userRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(201);

      const userId = userRegister.body.user.id;

      // Set some credits for the user
      await request(app)
        .patch(`/admin/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          earnedCredits: 200,
          claimedCredits: 100
        });

      // Set multipliers for the user
      await request(app)
        .patch(`/admin/users/${userId}/multiplier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: 2
        });

      await request(app)
        .patch(`/admin/users/${userId}/multiplier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizType: 'simple-words',
          multiplier: 3
        });

      // Get list of users
      const listResponse = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listResponse.body).toHaveProperty('users');
      expect(listResponse.body.users.length).toBeGreaterThanOrEqual(1);

      // Find our test user in the list
      const testUser = listResponse.body.users.find((user: any) => user.id === userId);
      expect(testUser).toBeDefined();
      expect(testUser).toHaveProperty('username', 'testuser');
      expect(testUser).toHaveProperty('earnedCredits', 200);
      expect(testUser).toHaveProperty('claimedCredits', 100);
      expect(testUser.multipliers).toHaveProperty('simple-math', 2);
      expect(testUser.multipliers).toHaveProperty('simple-words', 3);
    });

    it('should get detailed user information', async () => {
      // Register and login an admin user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isAdmin: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      const adminToken = adminLogin.body.token;

      // Register a regular user
      const userRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(201);

      const userId = userRegister.body.user.id;

      // Set some credits and multipliers for the user
      await request(app)
        .patch(`/admin/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          earnedCredits: 150,
          claimedCredits: 75
        });

      await request(app)
        .patch(`/admin/users/${userId}/multiplier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: 3
        });

      // Get detailed user information
      const getResponse = await request(app)
        .get(`/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('id', userId);
      expect(getResponse.body).toHaveProperty('username', 'testuser');
      expect(getResponse.body).toHaveProperty('earnedCredits', 150);
      expect(getResponse.body).toHaveProperty('claimedCredits', 75);
      expect(getResponse.body.multipliers).toHaveProperty('simple-math', 3);
    });
  });

  describe('Error Handling Tests', () => {
    it('should return 404 when updating multiplier for non-existent user', async () => {
      // Register and login an admin user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isAdmin: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      const adminToken = adminLogin.body.token;

      // Try to update multiplier for non-existent user
      const updateResponse = await request(app)
        .patch('/admin/users/nonexistentuser/multiplier')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: 2
        })
        .expect(404);

      expect(updateResponse.body.error).toHaveProperty('message', 'User not found');
    });

    it('should return 404 when getting info for non-existent user', async () => {
      // Register and login an admin user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isAdmin: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      const adminToken = adminLogin.body.token;

      // Try to get info for non-existent user
      const getResponse = await request(app)
        .get('/admin/users/nonexistentuser')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(getResponse.body.error).toHaveProperty('message', 'User not found');
    });
  });
});