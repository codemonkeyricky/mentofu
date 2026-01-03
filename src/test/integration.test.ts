import request from 'supertest';
import { app } from '../index';
import { DatabaseService } from '../database/database.service';

describe('Integration Tests', () => {
  let authToken: string;
  let userId: string;

  // We'll use the same database file but avoid creating a separate connection
  // The main app already has its own database connection, so we just need to make sure
  // tests clean up properly without interfering with the main app's connection

  describe('Complete Authentication and Session Flow', () => {
    it('should register, login, and create a session in sequence', async () => {
      // Use unique username to avoid conflicts
      const username = 'integrationuser' + Date.now();

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

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.user).toHaveProperty('username', username);

      // 3. Create a math quiz session
      const sessionResponse = await request(app)
        .get('/session/simple-math')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(sessionResponse.body).toHaveProperty('sessionId');
      expect(sessionResponse.body).toHaveProperty('questions');
      expect(Array.isArray(sessionResponse.body.questions)).toBe(true);

      // 4. Create a simple words quiz session
      const simpleWordsResponse = await request(app)
        .get('/session/simple-words')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(simpleWordsResponse.body).toHaveProperty('sessionId');
      expect(simpleWordsResponse.body).toHaveProperty('words');
      expect(Array.isArray(simpleWordsResponse.body.words)).toBe(true);
    });

    it('should fail gracefully when accessing protected routes without authentication', async () => {
      // Try to access session endpoint without token
      const response = await request(app)
        .get('/session/simple-math')
        .expect(401);

      expect(response.body).toHaveProperty('error.message', 'Authorization token is missing or invalid');
    });

    it('should validate math quiz answers correctly', async () => {
      // Register and login a user
      const username = 'answeruser' + Date.now();
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: username,
          password: 'answerpassword123'
        });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: username,
          password: 'answerpassword123'
        });

      const userToken = loginResponse.body.token;

      // Create a session
      const sessionResponse = await request(app)
        .get('/session/simple-math')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const sessionId = sessionResponse.body.sessionId;
      const questions = sessionResponse.body.questions;

      // Validate answers with correct answers
      const userAnswers = questions.map((q: any) => q.answer);
      const validateResponse = await request(app)
        .post('/session/simple-math')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);

      expect(validateResponse.body).toHaveProperty('score', questions.length);
      expect(validateResponse.body).toHaveProperty('total', questions.length);
    });

    it('should correctly grade math quiz with some incorrect answers', async () => {
      // Register and login a user
      const username = 'partialansweruser' + Date.now();
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: username,
          password: 'partialanswerpassword123'
        });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: username,
          password: 'partialanswerpassword123'
        });

      const userToken = loginResponse.body.token;

      // Create a session
      const sessionResponse = await request(app)
        .get('/session/simple-math')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const sessionId = sessionResponse.body.sessionId;
      const questions = sessionResponse.body.questions;

      // Provide some incorrect answers to test partial scoring
      const userAnswers = questions.map((q: any, index: number) => {
        // For the first question, provide a wrong answer; for others, correct answers
        if (index === 0) {
          return q.answer + 1; // Wrong answer
        }
        return q.answer;
      });

      const validateResponse = await request(app)
        .post('/session/simple-math')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);

      // Should have 1 less score since first answer is wrong
      expect(validateResponse.body).toHaveProperty('score', questions.length - 1);
      expect(validateResponse.body).toHaveProperty('total', questions.length);
    });

    it('should validate simple words quiz answers correctly', async () => {
      // Register and login a user
      const username = 'wordsuser' + Date.now();
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: username,
          password: 'wordspassword123'
        });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: username,
          password: 'wordspassword123'
        });

      const userToken = loginResponse.body.token;

      // Create a simple words session
      const sessionResponse = await request(app)
        .get('/session/simple-words')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const sessionId = sessionResponse.body.sessionId;
      const words = sessionResponse.body.words;

      // Validate answers with correct answers
      const userAnswers = words.map((w: any) => w.word);
      const validateResponse = await request(app)
        .post('/session/simple-words')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);

      expect(validateResponse.body).toHaveProperty('score', words.length);
      expect(validateResponse.body).toHaveProperty('total', words.length);
    });

    it('should correctly grade simple words quiz with some incorrect answers', async () => {
      // Register and login a user
      const username = 'partialwordsuser' + Date.now();
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: username,
          password: 'partialwordspassword123'
        });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: username,
          password: 'partialwordspassword123'
        });

      const userToken = loginResponse.body.token;

      // Create a simple words session
      const sessionResponse = await request(app)
        .get('/session/simple-words')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const sessionId = sessionResponse.body.sessionId;
      const words = sessionResponse.body.words;

      // Provide some incorrect answers to test partial scoring
      const userAnswers = words.map((w: any, index: number) => {
        // For the first word, provide a wrong answer; for others, correct answers
        if (index === 0) {
          return w.word + 'wrong'; // Wrong answer
        }
        return w.word;
      });

      const validateResponse = await request(app)
        .post('/session/simple-words')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);

      // Should have 1 less score since first answer is wrong
      expect(validateResponse.body).toHaveProperty('score', words.length - 1);
      expect(validateResponse.body).toHaveProperty('total', words.length);
    });

    it('should handle multiple concurrent sessions', async () => {
      // Register and login a user
      const username = 'concurrentuser' + Date.now();
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: username,
          password: 'concurrentpassword123'
        });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: username,
          password: 'concurrentpassword123'
        });

      const userToken = loginResponse.body.token;

      // Create multiple sessions
      const session1Response = await request(app)
        .get('/session/simple-math')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const session2Response = await request(app)
        .get('/session/simple-math')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(session1Response.body.sessionId).not.toBe(session2Response.body.sessionId);
    });

    it('should retrieve all sessions for a user with /session/all endpoint', async () => {
      // Register and login a user
      const username = 'allsessionuser' + Date.now();
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: username,
          password: 'allsessionpassword123'
        });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: username,
          password: 'allsessionpassword123'
        });

      const userToken = loginResponse.body.token;

      // Create a math quiz session
      const sessionResponse = await request(app)
        .get('/session/simple-math')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const sessionId = sessionResponse.body.sessionId;

      // Validate answers to create a score for the session
      await request(app)
        .post('/session/simple-math')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: sessionId,
          answers: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        })
        .expect(200);

      // Retrieve all sessions for the user
      const allSessionsResponse = await request(app)
        .get('/session/all')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(allSessionsResponse.body).toHaveProperty('sessions');
      expect(Array.isArray(allSessionsResponse.body.sessions)).toBe(true);

      // Should have at least one session
      expect(allSessionsResponse.body.sessions).toHaveLength(1);

      // Check session structure
      const session = allSessionsResponse.body.sessions[0];
      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('sessionType');
      expect(session).toHaveProperty('score');
      expect(session).toHaveProperty('total');
      expect(session).toHaveProperty('completedAt');
    });

    it('should create and validate division math quiz session correctly', async () => {
      // Register and login a user
      const username = 'divisionuser' + Date.now();
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: username,
          password: 'divisionpassword123'
        });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: username,
          password: 'divisionpassword123'
        });

      const userToken = loginResponse.body.token;

      // Create a division math quiz session
      const sessionResponse = await request(app)
        .get('/session/simple-math-2')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(sessionResponse.body).toHaveProperty('sessionId');
      expect(sessionResponse.body).toHaveProperty('questions');
      expect(Array.isArray(sessionResponse.body.questions)).toBe(true);

      // Verify that questions are division problems
      const questions = sessionResponse.body.questions;
      expect(questions.length).toBe(10);
      for (const question of questions) {
        expect(question.question).toMatch(/^\d+÷\d+$/); // Should be in format "numerator÷divisor"
      }

      // Validate answers with correct answers
      const sessionId = sessionResponse.body.sessionId;
      const userAnswers = questions.map((q: any) => q.answer);
      const validateResponse = await request(app)
        .post('/session/simple-math-2')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);

      expect(validateResponse.body).toHaveProperty('score', questions.length);
      expect(validateResponse.body).toHaveProperty('total', questions.length);
    });

    it('should correctly grade division math quiz with some incorrect answers', async () => {
      // Register and login a user
      const username = 'partialdivisionuser' + Date.now();
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: username,
          password: 'partialdivisionpassword123'
        });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: username,
          password: 'partialdivisionpassword123'
        });

      const userToken = loginResponse.body.token;

      // Create a division math quiz session
      const sessionResponse = await request(app)
        .get('/session/simple-math-2')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const sessionId = sessionResponse.body.sessionId;
      const questions = sessionResponse.body.questions;

      // Provide some incorrect answers to test partial scoring
      const userAnswers = questions.map((q: any, index: number) => {
        // For the first question, provide a wrong answer; for others, correct answers
        if (index === 0) {
          return q.answer + 1; // Wrong answer
        }
        return q.answer;
      });

      const validateResponse = await request(app)
        .post('/session/simple-math-2')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);

      // Should have 1 less score since first answer is wrong
      expect(validateResponse.body).toHaveProperty('score', questions.length - 1);
      expect(validateResponse.body).toHaveProperty('total', questions.length);
    });

    it('should create and validate fraction comparison math quiz session correctly', async () => {
      // Register and login a user
      const username = 'fractionuser' + Date.now();
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: username,
          password: 'fractionpassword123'
        });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: username,
          password: 'fractionpassword123'
        });

      const userToken = loginResponse.body.token;

      // Create a fraction comparison math quiz session
      const sessionResponse = await request(app)
        .get('/session/simple-math-3')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(sessionResponse.body).toHaveProperty('sessionId');
      expect(sessionResponse.body).toHaveProperty('questions');
      expect(Array.isArray(sessionResponse.body.questions)).toBe(true);

      // Verify that questions are fraction comparison problems
      const questions = sessionResponse.body.questions;
      expect(questions.length).toBe(10);
      for (const question of questions) {
        // Check that the question is an array of fraction pairs as expected for fraction comparison questions
        expect(Array.isArray(question.question)).toBe(true);
        expect(question.question.length).toBe(2);
        expect(question.question[0]).toHaveProperty('numerator');
        expect(question.question[0]).toHaveProperty('denominator');
        expect(question.question[1]).toHaveProperty('numerator');
        expect(question.question[1]).toHaveProperty('denominator');
      }

      // Validate answers with correct answers
      const sessionId = sessionResponse.body.sessionId;
      const userAnswers = questions.map((q: any) => q.answer);
      const validateResponse = await request(app)
        .post('/session/simple-math-3')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);

      expect(validateResponse.body).toHaveProperty('score', questions.length);
      expect(validateResponse.body).toHaveProperty('total', questions.length);
    });

    it('should correctly grade fraction comparison math quiz with some incorrect answers', async () => {
      // Register and login a user
      const username = 'partialfractionuser' + Date.now();
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: username,
          password: 'partialfractionpassword123'
        });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: username,
          password: 'partialfractionpassword123'
        });

      const userToken = loginResponse.body.token;

      // Create a fraction comparison math quiz session
      const sessionResponse = await request(app)
        .get('/session/simple-math-3')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const sessionId = sessionResponse.body.sessionId;
      const questions = sessionResponse.body.questions;

      // Provide some incorrect answers to test partial scoring
      const userAnswers = questions.map((q: any, index: number) => {
        // For the first question, provide a wrong answer; for others, correct answers
        if (index === 0) {
          return q.answer + 1; // Wrong answer
        }
        return q.answer;
      });

      const validateResponse = await request(app)
        .post('/session/simple-math-3')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);

      // Should have 1 less score since first answer is wrong
      expect(validateResponse.body).toHaveProperty('score', questions.length - 1);
      expect(validateResponse.body).toHaveProperty('total', questions.length);
    });

    it('should create and validate BODMAS math quiz session correctly', async () => {
      // Register and login a user
      const username = 'bodmasuser' + Date.now();
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: username,
          password: 'bodmaspassword123'
        });
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: username,
          password: 'bodmaspassword123'
        });
      const userToken = loginResponse.body.token;
      // Create a BODMAS math quiz session
      const sessionResponse = await request(app)
        .get('/session/simple-math-4')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(sessionResponse.body).toHaveProperty('sessionId');
      expect(sessionResponse.body).toHaveProperty('questions');
      expect(Array.isArray(sessionResponse.body.questions)).toBe(true);
      // Verify that questions are BODMAS expressions
      const questions = sessionResponse.body.questions;
      expect(questions.length).toBe(10);
      for (const question of questions) {
        // Check that the question is a string expression
        expect(typeof question.question).toBe('string');
        // Should contain at least one operation
        expect(question.question).toMatch(/[\+\-\*\/]/);
      }
      // Validate answers with correct answers
      const sessionId = sessionResponse.body.sessionId;
      const userAnswers = questions.map((q: any) => q.answer);
      const validateResponse = await request(app)
        .post('/session/simple-math-4')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);
      expect(validateResponse.body).toHaveProperty('score', questions.length);
      expect(validateResponse.body).toHaveProperty('total', questions.length);
    });

    it('should correctly grade BODMAS math quiz with some incorrect answers', async () => {
      // Register and login a user
      const username = 'partialbodmasuser' + Date.now();
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          username: username,
          password: 'partialbodmaspassword123'
        });
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: username,
          password: 'partialbodmaspassword123'
        });
      const userToken = loginResponse.body.token;
      // Create a BODMAS math quiz session
      const sessionResponse = await request(app)
        .get('/session/simple-math-4')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      const sessionId = sessionResponse.body.sessionId;
      const questions = sessionResponse.body.questions;
      // Provide some incorrect answers to test partial scoring
      const userAnswers = questions.map((q: any, index: number) => {
        // For the first question, provide a wrong answer; for others, correct answers
        if (index === 0) {
          return q.answer + 1; // Wrong answer
        }
        return q.answer;
      });
      const validateResponse = await request(app)
        .post('/session/simple-math-4')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: sessionId,
          answers: userAnswers
        })
        .expect(200);
      // Should have 1 less score since first answer is wrong
      expect(validateResponse.body).toHaveProperty('score', questions.length - 1);
      expect(validateResponse.body).toHaveProperty('total', questions.length);
    });
  });
});
