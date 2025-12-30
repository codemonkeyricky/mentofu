import { sessionService } from '../session/session.service';
import { DatabaseService } from '../database/database.service';
import { TestDatabaseUtil } from './database.test.util';

describe('SessionService Score Retrieval', () => {
  let dbService: DatabaseService;
  const testDbPath = TestDatabaseUtil.createTestDatabasePath();

  beforeEach(() => {
    // Clear all sessions before each test
    (sessionService as any).sessions = new Map();
    (sessionService as any).simpleWordsSessions = new Map();

    // Create a new database service instance for each test
    dbService = new DatabaseService(testDbPath);
    sessionService.setDatabaseService(dbService);

    // Create test users before running tests
    const testUser = {
      id: 'test-user-id',
      username: 'testuser',
      passwordHash: 'hashed_password_123'
    };
    dbService.createUser(testUser);
  });

  afterEach(() => {
    // Close the database connection after each test
    dbService.close();
    // Clear session service timeouts to prevent Jest from hanging
    sessionService.clearAllTimeouts();
    // Clean up the test database file
    TestDatabaseUtil.cleanupTestDatabase(testDbPath);
  });

  describe('getSessionScore', () => {
    it('should return null for non-existent session', async () => {
      const score = await sessionService.getSessionScore('non-existent-session-id');
      expect(score).toBeNull();
    });

    it('should retrieve score for a session that has been scored', async () => {
      // Create a session
      const session = sessionService.createSession('test-user-id');

      // Validate answers to create a score
      const result = sessionService.validateAnswers(session.id, 'test-user-id', [10, 20, 30]);

      // Retrieve the score
      const retrievedScore = await sessionService.getSessionScore(session.id);

      expect(retrievedScore).not.toBeNull();
      expect(retrievedScore).toHaveProperty('score', result.score);
      expect(retrievedScore).toHaveProperty('total', result.total);
    });
  });

  describe('getUserSessionScores', () => {
    it('should return empty array for user with no sessions', async () => {
      const scores = await sessionService.getUserSessionScores('non-existent-user-id');
      expect(scores).toEqual([]);
    });

    it('should retrieve all session scores for a user', async () => {
      // Create two sessions for the same user
      const session1 = sessionService.createSession('test-user-id');
      const session2 = sessionService.createSession('test-user-id');

      // Validate answers to create scores
      sessionService.validateAnswers(session1.id, 'test-user-id', [10, 20, 30]);
      sessionService.validateAnswers(session2.id, 'test-user-id', [5, 15, 25]);

      // Retrieve all scores for the user
      const scores = await sessionService.getUserSessionScores('test-user-id');

      expect(scores).toHaveLength(2);
      expect(scores[0]).toHaveProperty('sessionId');
      expect(scores[0]).toHaveProperty('score');
      expect(scores[0]).toHaveProperty('total');
      expect(scores[0]).toHaveProperty('sessionType', 'math');
      expect(scores[0]).toHaveProperty('completedAt');
    });
  });
});