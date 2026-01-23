// Force memory database for tests - must be done BEFORE importing app
delete process.env.POSTGRES_URL;

import request from 'supertest';
import { app } from '../index';
import { DatabaseService } from '../database/interface/database.service';
import { authService } from '../auth/auth.service';

describe('Parent Dashboard E2E Test', () => {
  let parentToken: string;
  let regularUserToken: string;
  let parentUserId: string;
  let regularUserId: string;

  beforeEach(() => {
    // Clear the in-memory database before each test to ensure isolation
    const dbService = new DatabaseService();
    dbService.clearMemoryDatabase();
  });

  describe('Parent Dashboard Authentication Flow', () => {
    it('should redirect parent users to parent dashboard after login', async () => {
      // Create a parent user via direct database manipulation
      const parentUser = await authService.register('parentuser', 'parentpass123', true);
      parentUserId = parentUser.id;

      // Create a regular user
      const regularUser = await authService.register('regularuser', 'regularpass123', false);
      regularUserId = regularUser.id;

      // Login as parent user
      const parentLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'parentuser',
          password: 'parentpass123'
        })
        .expect(200);

      expect(parentLoginResponse.body).toHaveProperty('token');
      expect(parentLoginResponse.body.user).toHaveProperty('isParent', true);
      parentToken = parentLoginResponse.body.token;

      // Login as regular user
      const regularLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'regularuser',
          password: 'regularpass123'
        })
        .expect(200);

      expect(regularLoginResponse.body.user).toHaveProperty('isParent', false);
      regularUserToken = regularLoginResponse.body.token;

      // Test that parent can access parent users endpoint
      const usersResponse = await request(app)
        .get('/parent/users')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(usersResponse.body).toHaveProperty('users');

      // Test that regular user cannot access parent users endpoint
      const regularUserUsersResponse = await request(app)
        .get('/parent/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(regularUserUsersResponse.body.error).toHaveProperty('message', 'Access denied. Admin privileges required.');
    });

    it('should load parent dashboard with user data', async () => {
      // Create parent user
      const parentUser = await authService.register('parentuser', 'parentpass123', true);
      parentUserId = parentUser.id;

      // Login as parent first to get token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'parentuser',
          password: 'parentpass123'
        })
        .expect(200);

      parentToken = loginResponse.body.token;

      // Create regular users
      const user1 = await authService.register('user1', 'password123', false);
      const user2 = await authService.register('user2', 'password123', false);

      // Set credits for users using parent API
      await request(app)
        .patch(`/parent/users/${user1.id}/credits`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          field: 'earned',
          amount: 100
        })
        .expect(200);

      await request(app)
        .patch(`/parent/users/${user1.id}/credits`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          field: 'claimed',
          amount: 50
        })
        .expect(200);

      await request(app)
        .patch(`/parent/users/${user2.id}/credits`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          field: 'earned',
          amount: 200
        })
        .expect(200);

      await request(app)
        .patch(`/parent/users/${user2.id}/credits`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          field: 'claimed',
          amount: 100
        })
        .expect(200);

      // Set multipliers for users
      const dbService = new DatabaseService();
      await dbService.setUserMultiplier(user1.id, 'simple-math', 2);
      await dbService.setUserMultiplier(user1.id, 'simple-words', 3);
      await dbService.setUserMultiplier(user2.id, 'simple-math', 1);

      // Get list of users from parent endpoint
      const usersResponse = await request(app)
        .get('/parent/users')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(usersResponse.body).toHaveProperty('users');
      expect(usersResponse.body.users.length).toBeGreaterThanOrEqual(2);

      // Verify user data structure
      const user1Data = usersResponse.body.users.find((user: any) => user.id === user1.id);
      expect(user1Data).toBeDefined();
      expect(user1Data).toHaveProperty('username', 'user1');
      expect(user1Data).toHaveProperty('earnedCredits', 100);
      expect(user1Data).toHaveProperty('claimedCredits', 50);
      expect(user1Data.multipliers).toHaveProperty('simple-math', 2);
      expect(user1Data.multipliers).toHaveProperty('simple-words', 3);

      const user2Data = usersResponse.body.users.find((user: any) => user.id === user2.id);
      expect(user2Data).toBeDefined();
      expect(user2Data).toHaveProperty('username', 'user2');
      expect(user2Data).toHaveProperty('earnedCredits', 200);
      expect(user2Data).toHaveProperty('claimedCredits', 100);
      expect(user2Data.multipliers).toHaveProperty('simple-math', 1);
    });
  });

  describe('Parent Dashboard Multiplier Management', () => {
    it('should allow parent to update user multipliers through API', async () => {
      // Create parent user
      const parentUser = await authService.register('parentuser', 'parentpass123', true);
      parentUserId = parentUser.id;

      // Create regular user
      const regularUser = await authService.register('regularuser', 'regularpass123', false);
      regularUserId = regularUser.id;

      // Login as parent
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'parentuser',
          password: 'parentpass123'
        })
        .expect(200);

      parentToken = loginResponse.body.token;

      // Update multiplier for regular user
      const updateResponse = await request(app)
        .patch(`/parent/users/${regularUserId}/multiplier`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: 3
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('message', 'Multiplier updated successfully');
      expect(updateResponse.body).toHaveProperty('userId', regularUserId);
      expect(updateResponse.body).toHaveProperty('quizType', 'simple-math');
      expect(updateResponse.body).toHaveProperty('multiplier', 3);

      // Verify multiplier was updated in database
      const dbService = new DatabaseService();
      const multiplier = await dbService.getUserMultiplier(regularUserId, 'simple-math');
      expect(multiplier).toBe(3);

      // Get user details to verify multiplier is reflected
      const userResponse = await request(app)
        .get(`/parent/users/${regularUserId}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(userResponse.body.multipliers).toHaveProperty('simple-math', 3);
    });

    it('should allow user to fetch updated multiplier via session endpoint', async () => {
      // Create parent user
      const parentUser = await authService.register('parentuser', 'parentpass123', true);
      parentUserId = parentUser.id;

      // Create regular user
      const regularUser = await authService.register('regularuser', 'regularpass123', false);
      regularUserId = regularUser.id;

      // Login as parent
      const parentLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'parentuser',
          password: 'parentpass123'
        })
        .expect(200);
      parentToken = parentLoginResponse.body.token;

      // Update multiplier for regular user
      await request(app)
        .patch(`/parent/users/${regularUserId}/multiplier`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: 3
        })
        .expect(200);

      // Login as regular user to get token
      const regularLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'regularuser',
          password: 'regularpass123'
        })
        .expect(200);
      const regularToken = regularLoginResponse.body.token;

      // Fetch multiplier via session endpoint (quizType 'math' maps to simple-math)
      const multiplierResponse = await request(app)
        .get('/session/multiplier/simple-math')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200);

      expect(multiplierResponse.body).toHaveProperty('quizType', 'simple-math');
      expect(multiplierResponse.body).toHaveProperty('multiplier', 3);
    });

    it('should handle multiple multiplier updates for different quiz types', async () => {
      // Create parent user
      const parentUser = await authService.register('parentuser', 'parentpass123', true);
      parentUserId = parentUser.id;

      // Create regular user
      const regularUser = await authService.register('regularuser', 'regularpass123', false);
      regularUserId = regularUser.id;

      // Login as parent
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'parentuser',
          password: 'parentpass123'
        })
        .expect(200);

      parentToken = loginResponse.body.token;

      // Update multiple multipliers
      const quizTypes = ['simple-math', 'simple-math-2', 'simple-words'];
      const multipliers = [2, 3, 4];

      for (let i = 0; i < quizTypes.length; i++) {
        const updateResponse = await request(app)
          .patch(`/parent/users/${regularUserId}/multiplier`)
          .set('Authorization', `Bearer ${parentToken}`)
          .send({
            quizType: quizTypes[i],
            multiplier: multipliers[i]
          })
          .expect(200);

        expect(updateResponse.body).toHaveProperty('message', 'Multiplier updated successfully');
        expect(updateResponse.body).toHaveProperty('quizType', quizTypes[i]);
        expect(updateResponse.body).toHaveProperty('multiplier', multipliers[i]);
      }

      // Get user details to verify all multipliers are set
      const userResponse = await request(app)
        .get(`/parent/users/${regularUserId}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      for (let i = 0; i < quizTypes.length; i++) {
        expect(userResponse.body.multipliers).toHaveProperty(quizTypes[i], multipliers[i]);
      }
    });

    it('should reject invalid multiplier updates', async () => {
      // Create parent user
      const parentUser = await authService.register('parentuser', 'parentpass123', true);
      parentUserId = parentUser.id;

      // Create regular user
      const regularUser = await authService.register('regularuser', 'regularpass123', false);
      regularUserId = regularUser.id;

      // Login as parent
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'parentuser',
          password: 'parentpass123'
        })
        .expect(200);

      parentToken = loginResponse.body.token;

      // Test negative multiplier
      const negativeResponse = await request(app)
        .patch(`/parent/users/${regularUserId}/multiplier`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: -1
        })
        .expect(400);

      expect(negativeResponse.body.error).toHaveProperty('message', 'Multiplier must be an integer between 0 and 5');

      // Test invalid quiz type
      const invalidQuizResponse = await request(app)
        .patch(`/parent/users/${regularUserId}/multiplier`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          quizType: 'invalid-quiz',
          multiplier: 2
        })
        .expect(400);

      expect(invalidQuizResponse.body.error).toHaveProperty('message', 'Invalid quiz type. Must be one of: simple-math, simple-math-2, simple-math-3, simple-math-4, simple-math-5, simple-words');
    });
  });

  describe('Parent Dashboard Credit Management', () => {
    it('should allow parent to update user credits', async () => {
      // Create parent user
      const parentUser = await authService.register('parentuser', 'parentpass123', true);
      parentUserId = parentUser.id;

      // Create regular user
      const regularUser = await authService.register('regularuser', 'regularpass123', false);
      regularUserId = regularUser.id;

      // Login as parent
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'parentuser',
          password: 'parentpass123'
        })
        .expect(200);

      parentToken = loginResponse.body.token;

      // Update earned credits with absolute value
      const earnedUpdateResponse = await request(app)
        .patch(`/parent/users/${regularUserId}/credits`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          field: 'earned',
          amount: 150
        })
        .expect(200);

      expect(earnedUpdateResponse.body).toHaveProperty('message', 'Credits updated successfully');
      expect(earnedUpdateResponse.body).toHaveProperty('userId', regularUserId);
      expect(earnedUpdateResponse.body).toHaveProperty('earnedCredits', 150);
      expect(earnedUpdateResponse.body).toHaveProperty('field', 'earned');
      expect(earnedUpdateResponse.body).toHaveProperty('amount', 150);

      // Update claimed credits with absolute value
      const claimedUpdateResponse = await request(app)
        .patch(`/parent/users/${regularUserId}/credits`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          field: 'claimed',
          amount: 75
        })
        .expect(200);

      expect(claimedUpdateResponse.body).toHaveProperty('message', 'Credits updated successfully');
      expect(claimedUpdateResponse.body).toHaveProperty('userId', regularUserId);
      expect(claimedUpdateResponse.body).toHaveProperty('claimedCredits', 75);
      expect(claimedUpdateResponse.body).toHaveProperty('field', 'claimed');
      expect(claimedUpdateResponse.body).toHaveProperty('amount', 75);

      // Verify credits were updated in database
      const dbService = new DatabaseService();
      const earned = await dbService.getEarnedCredits(regularUserId);
      const claimed = await dbService.getClaimedCredits(regularUserId);
      expect(earned).toBe(150);
      expect(claimed).toBe(75);

      // Get user details to verify credits are reflected
      const userResponse = await request(app)
        .get(`/parent/users/${regularUserId}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(userResponse.body).toHaveProperty('earnedCredits', 150);
      expect(userResponse.body).toHaveProperty('claimedCredits', 75);
    });

    it('should reject claimed credits exceeding earned credits', async () => {
      // Create parent user
      const parentUser = await authService.register('parentuser', 'parentpass123', true);
      parentUserId = parentUser.id;

      // Create regular user
      const regularUser = await authService.register('regularuser', 'regularpass123', false);
      regularUserId = regularUser.id;

      // Login as parent
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'parentuser',
          password: 'parentpass123'
        })
        .expect(200);

      parentToken = loginResponse.body.token;

      // First set earned credits to 100
      await request(app)
        .patch(`/parent/users/${regularUserId}/credits`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          field: 'earned',
          amount: 100
        })
        .expect(200);

      // Try to set claimed credits higher than earned credits
      const updateResponse = await request(app)
        .patch(`/parent/users/${regularUserId}/credits`)
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          field: 'claimed',
          amount: 150  // This should fail - exceeds earned credits of 100
        })
        .expect(409);

      expect(updateResponse.body.error).toHaveProperty('message', 'Cannot set claimed credits above earned credits');
    });
  });

  describe('Parent Dashboard Error Handling', () => {
    it('should return 404 for non-existent user operations', async () => {
      // Create parent user
      const parentUser = await authService.register('parentuser', 'parentpass123', true);
      parentUserId = parentUser.id;

      // Login as parent
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'parentuser',
          password: 'parentpass123'
        })
        .expect(200);

      parentToken = loginResponse.body.token;

      // Try to update multiplier for non-existent user
      const multiplierResponse = await request(app)
        .patch('/parent/users/nonexistentuser/multiplier')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: 2
        })
        .expect(404);

      expect(multiplierResponse.body.error).toHaveProperty('message', 'User not found');

      // Try to update credits for non-existent user
      const creditsResponse = await request(app)
        .patch('/parent/users/nonexistentuser/credits')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          field: 'earned',
          amount: 100
        })
        .expect(404);

      expect(creditsResponse.body.error).toHaveProperty('message', 'User not found');

      // Try to get info for non-existent user
      const getResponse = await request(app)
        .get('/parent/users/nonexistentuser')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(404);

      expect(getResponse.body.error).toHaveProperty('message', 'User not found');
    });

    it('should reject unauthorized access to parent endpoints', async () => {
      // Create regular user (non-parent)
      const regularUser = await authService.register('regularuser', 'regularpass123', false);
      regularUserId = regularUser.id;

      // Login as regular user
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'regularuser',
          password: 'regularpass123'
        })
        .expect(200);

      regularUserToken = loginResponse.body.token;

      // Regular user tries to access parent endpoints
      const usersResponse = await request(app)
        .get('/parent/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(usersResponse.body.error).toHaveProperty('message', 'Access denied. Admin privileges required.');

      const userResponse = await request(app)
        .get(`/parent/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(userResponse.body.error).toHaveProperty('message', 'Access denied. Admin privileges required.');

      const multiplierResponse = await request(app)
        .patch(`/parent/users/${regularUserId}/multiplier`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          quizType: 'simple-math',
          multiplier: 2
        })
        .expect(403);

      expect(multiplierResponse.body.error).toHaveProperty('message', 'Access denied. Admin privileges required.');

      const creditsResponse = await request(app)
        .patch(`/parent/users/${regularUserId}/credits`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          field: 'earned',
          amount: 100
        })
        .expect(403);

      expect(creditsResponse.body.error).toHaveProperty('message', 'Access denied. Admin privileges required.');
    });
  });
});
