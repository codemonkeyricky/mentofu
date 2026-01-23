// Force memory database for tests - must be done BEFORE importing app
delete process.env.POSTGRES_URL;

import request from 'supertest';
import { app } from '../index';
import { DatabaseService } from '../database/interface/database.service';
import { authService } from '../auth/auth.service';

describe('Absolute Earned Credit Updates', () => {
  beforeEach(() => {
    // Clear the in-memory database before each test to ensure isolation
    const dbService = new DatabaseService();
    dbService.clearMemoryDatabase();
  });

  it('should allow setting earned credits to any non-negative value', async () => {
    // Create a parent user and a regular user
    const parentUser = await authService.register('parentuser', 'parentpass123', true);
    const regularUser = await authService.register('regularuser', 'regularpass123', false);

    // Login as parent user
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'parentuser', password: 'parentpass123' });

    const token = loginRes.body.token;

    // First get a user
    const usersRes = await request(app)
      .get('/parent/users')
      .set('Authorization', `Bearer ${token}`);

    expect(usersRes.body).toHaveProperty('users');
    expect(usersRes.body.users.length).toBeGreaterThanOrEqual(1);

    const userId = regularUser.id;
    const currentEarned = regularUser.earned_credits || 0;

    // Test setting to higher value
    const higherRes = await request(app)
      .patch(`/parent/users/${userId}/credits`)
      .set('Authorization', `Bearer ${token}`)
      .send({ field: 'earned', amount: currentEarned + 100 });

    expect(higherRes.status).toBe(200);
    expect(higherRes.body.earnedCredits).toBe(currentEarned + 100);

    // Test setting to lower value (should now be allowed)
    // First ensure currentEarned is at least 50 so we don't go negative
    const targetLowerAmount = Math.max(0, currentEarned - 50);
    const lowerRes = await request(app)
      .patch(`/parent/users/${userId}/credits`)
      .set('Authorization', `Bearer ${token}`)
      .send({ field: 'earned', amount: targetLowerAmount });

    expect(lowerRes.status).toBe(200);
    expect(lowerRes.body.earnedCredits).toBe(targetLowerAmount);

    // Test setting to zero
    const zeroRes = await request(app)
      .patch(`/parent/users/${userId}/credits`)
      .set('Authorization', `Bearer ${token}`)
      .send({ field: 'earned', amount: 0 });

    expect(zeroRes.status).toBe(200);
    expect(zeroRes.body.earnedCredits).toBe(0);
  });
});