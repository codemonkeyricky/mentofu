// Force memory database for tests - must be done BEFORE importing app
delete process.env.POSTGRES_URL;

import request from 'supertest';
import { app } from '../index';
import { DatabaseService } from '../database/interface/database.service';
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
    it('should register and promote a user to parent via direct database manipulation', async () => {
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

      // Register an parent user via direct database manipulation to bypass API limitation
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

      // Login with parent user and verify isParent flag in response
      const adminLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      adminToken = adminLoginResponse.body.token;

      // Verify parent user login response contains isParent flag set to true
      expect(adminLoginResponse.body.user).toHaveProperty('isParent', true);

      // Verify regular user login response contains isParent flag set to false
      const regularUserLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'regularuser',
          password: 'securepassword123'
        })
        .expect(200);

      expect(regularUserLoginResponse.body.user).toHaveProperty('isParent', false);

      // Verify parent user has isParent flag set in database
      const adminUserFromDB = await authService.getUserById(adminUserId);
      expect(adminUserFromDB).toHaveProperty('isParent', true);

      // Verify regular user doesn't have parent flag in database
      const regularUser = await authService.getUserById(regularUserId);
      expect(regularUser).toHaveProperty('isParent', false);
    });

    it('should verify that the hardcoded parent account exists and is functional', async () => {
      // Verify the default parent user exists in the database
      const dbService = new DatabaseService();
      const adminUser = await dbService.findUserByUsername('parent');

      // The parent user should exist with isParent flag set to true
      expect(adminUser).toBeDefined();
      expect(adminUser).toHaveProperty('username', 'parent');
      expect(adminUser).toHaveProperty('isParent', true);

      // Verify we can login with the default parent credentials
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'parent',
          password: 'admin2'
        })
        .expect(200);

      // Verify the response contains a valid token and user info
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('user');
      expect(loginResponse.body.user).toHaveProperty('username', 'parent');

      // Explicitly check that the login response contains isParent flag set to true
      expect(loginResponse.body.user).toHaveProperty('isParent', true);

      // Verify that the returned token is valid by checking it's not empty
      const token = loginResponse.body.token;
      expect(token).toBeDefined();
      expect(token).not.toEqual('');
    });
  });

  describe('Admin Multiplier API Tests', () => {
    it('should update user multipliers with valid quiz types', async () => {
      // First register and login an parent user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isParent: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      // Verify parent user login response contains isParent flag set to true
      expect(adminLogin.body.user).toHaveProperty('isParent', true);

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
        .patch(`/parent/users/${userId}/multiplier`)
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
      // Register and login an parent user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isParent: true
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
        .patch(`/parent/users/${userId}/multiplier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizType: 'invalid-quiz-type',
          multiplier: 2
        })
        .expect(400);

      expect(updateResponse.body.error).toHaveProperty('message', 'Invalid quiz type. Must be one of: simple-math, simple-math-2, simple-math-3, simple-math-4, simple-math-5, simple-words');
    });

    it('should reject negative multipliers', async () => {
      // Register and login an parent user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isParent: true
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
        .patch(`/parent/users/${userId}/multiplier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: -1
        })
        .expect(400);

      expect(updateResponse.body.error).toHaveProperty('message', 'Multiplier must be an integer between 0 and 5');
    });

    it('should reject non-parent users from updating multipliers', async () => {
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

      // Verify regular user login response contains isParent flag set to false
      expect(userLogin.body.user).toHaveProperty('isParent', false);

      const regularUserToken = userLogin.body.token;

      // Register an parent user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isParent: true
        })
        .expect(201);

      const adminLogin = await request(app)
        .post('/auth/login')
        .send({
          username: 'adminuser',
          password: 'adminpassword123'
        })
        .expect(200);

      // Verify parent user login response contains isParent flag set to true
      expect(adminLogin.body.user).toHaveProperty('isParent', true);

      const adminUserId = adminRegister.body.user.id;
      const adminToken = adminLogin.body.token;

      // Regular user tries to update multiplier (should be forbidden)
      const updateResponse = await request(app)
        .patch(`/parent/users/${adminUserId}/multiplier`)
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
      // Register and login an parent user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isParent: true
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

      // Update earned credits with absolute value
      const earnedUpdateResponse = await request(app)
        .patch(`/parent/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field: 'earned',
          amount: 150
        })
        .expect(200);

      expect(earnedUpdateResponse.body).toHaveProperty('message', 'Credits updated successfully');
      expect(earnedUpdateResponse.body).toHaveProperty('userId', userId);
      expect(earnedUpdateResponse.body).toHaveProperty('earnedCredits', 150);
      expect(earnedUpdateResponse.body).toHaveProperty('field', 'earned');
      expect(earnedUpdateResponse.body).toHaveProperty('amount', 150);

      // Update claimed credits with absolute value
      const claimedUpdateResponse = await request(app)
        .patch(`/parent/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field: 'claimed',
          amount: 75
        })
        .expect(200);

      expect(claimedUpdateResponse.body).toHaveProperty('message', 'Credits updated successfully');
      expect(claimedUpdateResponse.body).toHaveProperty('userId', userId);
      expect(claimedUpdateResponse.body).toHaveProperty('claimedCredits', 75);
      expect(claimedUpdateResponse.body).toHaveProperty('field', 'claimed');
      expect(claimedUpdateResponse.body).toHaveProperty('amount', 75);

      // Verify the credits were actually set in the database
      const dbService = new DatabaseService();
      const earned = await dbService.getEarnedCredits(userId);
      const claimed = await dbService.getClaimedCredits(userId);
      expect(earned).toBe(150);
      expect(claimed).toBe(75);
    });


    it('should reject claimed credits exceeding earned credits', async () => {
      // Register and login an parent user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isParent: true
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

      // First set earned credits to 100
      await request(app)
        .patch(`/parent/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field: 'earned',
          amount: 100
        })
        .expect(200);

      // Try to set claimed credits higher than earned credits
      const updateResponse = await request(app)
        .patch(`/parent/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field: 'claimed',
          amount: 150  // This should fail - exceeds earned credits of 100
        })
        .expect(409);

      expect(updateResponse.body.error).toHaveProperty('message', 'Cannot set claimed credits above earned credits');
    });

    it('should reject non-parent users from updating credits', async () => {
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

      // Register an parent user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isParent: true
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
        .patch(`/parent/users/${adminUserId}/credits`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          field: 'earned',
          amount: 100
        })
        .expect(403);

      expect(updateResponse.body.error).toHaveProperty('message', 'Access denied. Admin privileges required.');
    });
  });

  describe('Admin Users API Tests', () => {
    it('should list users with multipliers and credits', async () => {
      // Register and login an parent user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isParent: true
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
        .patch(`/parent/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field: 'earned',
          amount: 200
        });

      await request(app)
        .patch(`/parent/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field: 'claimed',
          amount: 100
        });

      // Set multipliers for the user
      await request(app)
        .patch(`/parent/users/${userId}/multiplier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: 2
        });

      await request(app)
        .patch(`/parent/users/${userId}/multiplier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizType: 'simple-words',
          multiplier: 3
        });

      // Get list of users
      const listResponse = await request(app)
        .get('/parent/users')
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
      // Register and login an parent user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isParent: true
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
        .patch(`/parent/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field: 'earned',
          amount: 150
        });

      await request(app)
        .patch(`/parent/users/${userId}/credits`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          field: 'claimed',
          amount: 75
        });

      await request(app)
        .patch(`/parent/users/${userId}/multiplier`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: 3
        });

      // Get detailed user information
      const getResponse = await request(app)
        .get(`/parent/users/${userId}`)
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
      // Register and login an parent user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isParent: true
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
        .patch('/parent/users/nonexistentuser/multiplier')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: 2
        })
        .expect(404);

      expect(updateResponse.body.error).toHaveProperty('message', 'User not found');
    });

    it('should return 404 when getting info for non-existent user', async () => {
      // Register and login an parent user
      const adminRegister = await request(app)
        .post('/auth/register')
        .send({
          username: 'adminuser',
          password: 'adminpassword123',
          isParent: true
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
        .get('/parent/users/nonexistentuser')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(getResponse.body.error).toHaveProperty('message', 'User not found');
    });
  });
});