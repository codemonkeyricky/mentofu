import request from 'supertest';
import { app, testDbPath } from './test-app';
import { authService } from '../auth/auth.service';
import { TestDatabaseUtil } from './database.test.util';
import { sessionService } from '../session/session.service';

describe('Session Management Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Register and login a user to get authentication token
    const username = 'testuser' + Date.now();

    await request(app)
      .post('/auth/register')
      .send({
        username: username,
        password: 'testpass123'
      });

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        username: username,
        password: 'testpass123'
      });

    authToken = loginResponse.body.token;
    userId = loginResponse.body.user.id;
  });

  describe('GET /session/simple-math', () => {
    it('should create a new math quiz session', async () => {
      const response = await request(app)
        .get('/session/simple-math')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('questions');
      expect(Array.isArray(response.body.questions)).toBe(true);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .get('/session/simple-math')
        .expect(401);

      expect(response.body).toHaveProperty('error.message', 'Authorization token is missing or invalid');
    });

    it('should create sessions with unique IDs', async () => {
      const response1 = await request(app)
        .get('/session/simple-math')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const response2 = await request(app)
        .get('/session/simple-math')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response1.body.sessionId).not.toBe(response2.body.sessionId);
    });
  });

  describe('GET /session/simple-words', () => {
    it('should create a new simple words quiz session', async () => {
      const response = await request(app)
        .get('/session/simple-words')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('words');
      expect(Array.isArray(response.body.words)).toBe(true);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .get('/session/simple-words')
        .expect(401);

      expect(response.body).toHaveProperty('error.message', 'Authorization token is missing or invalid');
    });

    it('should create simple words sessions with unique IDs', async () => {
      const response1 = await request(app)
        .get('/session/simple-words')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const response2 = await request(app)
        .get('/session/simple-words')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response1.body.sessionId).not.toBe(response2.body.sessionId);
    });
  });

  describe('POST /session/simple-math', () => {
    let sessionId: string;
    let sessionQuestions: any[];

    beforeEach(async () => {
      // Create a session first to get sessionId
      const sessionResponse = await request(app)
        .get('/session/simple-math')
        .set('Authorization', `Bearer ${authToken}`);

      sessionId = sessionResponse.body.sessionId;
      sessionQuestions = sessionResponse.body.questions;
    });

    it('should validate answers and return score for correct answers', async () => {
      // Use correct answers for validation
      const userAnswers = sessionQuestions.map(q => q.answer);
      const response = await request(app)
        .post('/session/simple-math')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('total');
      expect(response.body.score).toBe(sessionQuestions.length);
    });

    it('should validate answers and return partial score for some correct answers', async () => {
      // Create a predictable test case by using the first question's answer
      const firstAnswer = sessionQuestions[0].answer;
      const userAnswers = [firstAnswer, 99, 99, 99, 99, 99, 99, 99, 99, 99];
      const response = await request(app)
        .post('/session/simple-math')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);

      expect(response.body).toHaveProperty('score', 1);
      expect(response.body).toHaveProperty('total', sessionQuestions.length);
    });

    it('should return 400 for missing session ID', async () => {
      const response = await request(app)
        .post('/session/simple-math')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [10, 20, 30]
        })
        .expect(400);

      expect(response.body).toHaveProperty('error.message', 'Session ID is required');
    });

    it('should return 400 for missing answers array', async () => {
      const response = await request(app)
        .post('/session/simple-math')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: sessionId,
          // Missing answers
        })
        .expect(400);

      expect(response.body).toHaveProperty('error.message', 'Answers array is required');
    });

    it('should return 400 for invalid answers data type', async () => {
      const response = await request(app)
        .post('/session/simple-math')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: sessionId,
          answers: 'not-an-array'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error.message', 'Answers array is required');
    });

    it('should return 404 for non-existent session ID', async () => {
      const response = await request(app)
        .post('/session/simple-math')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 'non-existent-id',
          answers: [10, 20, 30]
        })
        .expect(404);

      expect(response.body).toHaveProperty('error.message', 'Session not found');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .post('/session/simple-math')
        .send({
          sessionId: sessionId,
          answers: [10, 20, 30]
        })
        .expect(401);

      expect(response.body).toHaveProperty('error.message', 'Authorization token is missing or invalid');
    });
  });

  describe('POST /session/simple-words', () => {
    let sessionId: string;
    let sessionWords: any[];

    beforeEach(async () => {
      // Create a simple words session first to get sessionId
      const sessionResponse = await request(app)
        .get('/session/simple-words')
        .set('Authorization', `Bearer ${authToken}`);

      sessionId = sessionResponse.body.sessionId;
      sessionWords = sessionResponse.body.words;
    });

    it('should validate simple words answers and return score for correct answers', async () => {
      // Use correct answers for validation (case insensitive)
      const userAnswers = sessionWords.map(w => w.word);
      const response = await request(app)
        .post('/session/simple-words')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('total');
      expect(response.body.score).toBe(sessionWords.length);
    });

    it('should validate simple words answers with case insensitive matching', async () => {
      // Use uppercase answers
      const userAnswers = sessionWords.map(w => w.word.toUpperCase());
      const response = await request(app)
        .post('/session/simple-words')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);

      expect(response.body).toHaveProperty('score', sessionWords.length);
      expect(response.body).toHaveProperty('total', sessionWords.length);
    });

    it('should return 400 for missing session ID', async () => {
      const response = await request(app)
        .post('/session/simple-words')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: ['hello', 'world', 'test']
        })
        .expect(400);

      expect(response.body).toHaveProperty('error.message', 'Session ID is required');
    });

    it('should return 400 for missing answers array', async () => {
      const response = await request(app)
        .post('/session/simple-words')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: sessionId,
          // Missing answers
        })
        .expect(400);

      expect(response.body).toHaveProperty('error.message', 'Answers array is required');
    });

    it('should return 400 for invalid answers data type', async () => {
      const response = await request(app)
        .post('/session/simple-words')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: sessionId,
          answers: 'not-an-array'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error.message', 'Answers array is required');
    });

    it('should return 404 for non-existent session ID', async () => {
      const response = await request(app)
        .post('/session/simple-words')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 'non-existent-id',
          answers: ['hello', 'world', 'test']
        })
        .expect(404);

      expect(response.body).toHaveProperty('error.message', 'Session not found');
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .post('/session/simple-words')
        .send({
          sessionId: sessionId,
          answers: ['hello', 'world', 'test']
        })
        .expect(401);

      expect(response.body).toHaveProperty('error.message', 'Authorization token is missing or invalid');
    });
  });

  // Clean up test database after all tests in this suite are done
  afterAll(() => {
    // Clear session service timeouts to prevent Jest from hanging
    sessionService.clearAllTimeouts();
    TestDatabaseUtil.cleanupTestDatabase(testDbPath);
  });
});