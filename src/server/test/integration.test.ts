// Force memory database for tests - must be done BEFORE importing app
delete process.env.POSTGRES_URL;

import request from 'supertest';
import { app } from '../index';
import { DatabaseService } from '../database/database.service';

describe('Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeEach(() => {
    // Clear the in-memory database before each test to ensure isolation
    const dbService = new DatabaseService();
    dbService.clearMemoryDatabase();
  });

  describe('Complete Authentication and Credit Flow', () => {
    it('should register, login, and handle credits in sequence', async () => {
      // Use unique username to avoid conflicts
      const username = 'credituser' + Date.now();

      // 1. Register a new user
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: username,
          password: 'securepassword123'
        })
        .expect(201);

      expect(registerResponse.body.user).toHaveProperty('username', username);

      // 2. Login with the new user
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: username,
          password: 'securepassword123'
        })
        .expect(200);

      authToken = loginResponse.body.token;
      userId = loginResponse.body.user.id;

      // 3. Add earned credits
      await request(app)
        .post('/credit/earned')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 100 })
        .expect(200);

      // 4. Get earned credits
      const earnedResponse = await request(app)
        .get('/credit/earned')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(earnedResponse.body.earned).toBe(100);

      // 5. Add claimed credits
      await request(app)
        .post('/credit/claimed')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 40 })
        .expect(200);

      // 6. Get claimed credits
      const claimedResponse = await request(app)
        .get('/credit/claimed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(claimedResponse.body.claimed).toBe(40);

      // 7. Try to claim more than earned (should fail)
      await request(app)
        .post('/credit/claimed')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 70 }) // 40 + 70 = 110 > 100
        .expect(400);
    });

    it('should correctly sum quiz scores and manual credits', async () => {
      const username = 'quizcredituser' + Date.now();
      await request(app).post('/auth/register').send({ username, password: 'password123' });
      const login = await request(app).post('/auth/login').send({ username, password: 'password123' });
      const token = login.body.token;

      // Earn some credits via quiz
      const session = await request(app).get('/session/simple-math').set('Authorization', `Bearer ${token}`).expect(200);
      const questions = session.body.questions;
      const answers = questions.map((q: any) => q.answer);
      await request(app).post('/session/simple-math').set('Authorization', `Bearer ${token}`).send({ sessionId: session.body.sessionId, answers }).expect(200);

      // Earned should be 10 (quiz)
      let earned = await request(app).get('/credit/earned').set('Authorization', `Bearer ${token}`).expect(200);
      expect(earned.body.earned).toBe(10);

      // Add manual earned credits
      await request(app).post('/credit/earned').set('Authorization', `Bearer ${token}`).send({ amount: 15 }).expect(200);

      // Earned should be 25
      earned = await request(app).get('/credit/earned').set('Authorization', `Bearer ${token}`).expect(200);
      expect(earned.body.earned).toBe(25);
    });

    it('should strictly enforce credit claiming limits', async () => {
      const username = 'limituser' + Date.now();
      await request(app).post('/auth/register').send({ username, password: 'password123' });
      const login = await request(app).post('/auth/login').send({ username, password: 'password123' });
      const token = login.body.token;

      // 0. Check initial claimed credits (should be 0)
      const initialClaimed = await request(app)
        .get('/credit/claimed')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(initialClaimed.body.claimed).toBe(0);

      // 1. Add 50 earned credits
      await request(app)
        .post('/credit/earned')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 50 })
        .expect(200);

      // 2. Claim exactly 50 credits (should succeed)
      await request(app)
        .post('/credit/claimed')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 50 })
        .expect(200);

      // 3. Try to claim 1 more credit (should fail)
      const failResponse = await request(app)
        .post('/credit/claimed')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 1 })
        .expect(400);

      expect(failResponse.body.error.message).toBe('Total claimed credit cannot be larger than total earned credit');

      // 4. Verify total claimed is still 50
      const claimedResponse = await request(app)
        .get('/credit/claimed')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(claimedResponse.body.claimed).toBe(50);
    });
  });
});
