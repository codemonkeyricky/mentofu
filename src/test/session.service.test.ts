import { sessionService } from '../session/session.service';
import { Session, Question } from '../session/session.types';
import { SimpleWords } from '../session/simple.words.types';

describe('SessionService', () => {
  beforeEach(() => {
    // Clear all sessions before each test
    (sessionService as any).sessions = new Map();
    (sessionService as any).simpleWordsSessions = new Map();
  });

  describe('createSession', () => {
    it('should create a new math quiz session with questions', () => {
      const session = sessionService.createSession('test-user-id');

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('questions');
      expect(Array.isArray(session.questions)).toBe(true);
      expect(session.questions.length).toBeGreaterThan(0);
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('updatedAt');
    });

    it('should create sessions with unique IDs', () => {
      const session1 = sessionService.createSession('test-user-id');
      const session2 = sessionService.createSession('test-user-id');

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('createSimpleWordsSession', () => {
    it('should create a new simple words quiz session with words', () => {
      const session = sessionService.createSimpleWordsSession('test-user-id');

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('words');
      expect(Array.isArray(session.words)).toBe(true);
      expect(session.words.length).toBeGreaterThan(0);
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('updatedAt');
    });

    it('should create simple words sessions with unique IDs', () => {
      const session1 = sessionService.createSimpleWordsSession('test-user-id');
      const session2 = sessionService.createSimpleWordsSession('test-user-id');

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('getSession', () => {
    let sessionId: string;

    beforeEach(() => {
      const session = sessionService.createSession('test-user-id');
      sessionId = session.id;
    });

    it('should return existing session by ID', () => {
      const session = sessionService.getSession(sessionId);

      expect(session).not.toBeUndefined();
      expect(session).toHaveProperty('id', sessionId);
    });

    it('should return undefined for non-existent session', () => {
      const session = sessionService.getSession('non-existent-id');

      expect(session).toBeUndefined();
    });
  });

  describe('getSimpleWordsSession', () => {
    let sessionId: string;

    beforeEach(() => {
      const session = sessionService.createSimpleWordsSession('test-user-id');
      sessionId = session.id;
    });

    it('should return existing simple words session by ID', () => {
      const session = sessionService.getSimpleWordsSession(sessionId);

      expect(session).not.toBeUndefined();
      expect(session).toHaveProperty('id', sessionId);
    });

    it('should return undefined for non-existent simple words session', () => {
      const session = sessionService.getSimpleWordsSession('non-existent-id');

      expect(session).toBeUndefined();
    });
  });

  describe('validateAnswers', () => {
    let sessionId: string;
    let questions: Question[];

    beforeEach(() => {
      // Create a session with known questions
      const session = sessionService.createSession('test-user-id');
      sessionId = session.id;
      questions = session.questions;
    });

    it('should validate answers correctly and return score', () => {
      // Use correct answers for validation (convert to strings since API sends them as strings)
      const userAnswers = questions.map(q => String(q.answer));
      const result = sessionService.validateAnswers(sessionId, 'test-user-id', userAnswers);

      expect(result).toHaveProperty('score', questions.length);
      expect(result).toHaveProperty('total', questions.length);
    });

    it('should return partial score for some correct answers', () => {
      // Provide only first answer correctly (make sure it's different from other answers)
      const userAnswers = [String(questions[0].answer), '99', '99', '99', '99', '99', '99', '99', '99', '99'];
      const result = sessionService.validateAnswers(sessionId, 'test-user-id', userAnswers);

      expect(result).toHaveProperty('score', 1);
      expect(result).toHaveProperty('total', questions.length);
    });

    it('should throw error for non-existent session', () => {
      expect(() => sessionService.validateAnswers('non-existent-id', 'test-user-id', [10, 20]))
        .toThrow('Session not found');
    });
  });

  describe('validateSimpleWordsAnswers', () => {
    let sessionId: string;
    let words: SimpleWords[];

    beforeEach(() => {
      // Create a simple words session
      const session = sessionService.createSimpleWordsSession('test-user-id');
      sessionId = session.id;
      words = session.words;
    });

    it('should validate simple words answers correctly and return score', () => {
      // Use correct answers for validation (case insensitive)
      const userAnswers = words.map(w => w.word);
      const result = sessionService.validateSimpleWordsAnswers(sessionId, 'test-user-id', userAnswers);

      expect(result).toHaveProperty('score', words.length);
      expect(result).toHaveProperty('total', words.length);
    });

    it('should return partial score for some correct answers (case insensitive)', () => {
      // Provide first word correctly with different case
      const userAnswers = [words[0].word.toUpperCase(), 'wrong', 'wrong'];
      const result = sessionService.validateSimpleWordsAnswers(sessionId, 'test-user-id', userAnswers);

      expect(result).toHaveProperty('score', 1);
      expect(result).toHaveProperty('total', words.length);
    });

    it('should throw error for non-existent session', () => {
      expect(() => sessionService.validateSimpleWordsAnswers('non-existent-id', 'test-user-id', ['word']))
        .toThrow('Session not found');
    });
  });

  describe('deleteSession', () => {
    let sessionId: string;

    beforeEach(() => {
      const session = sessionService.createSession('test-user-id');
      sessionId = session.id;
    });

    it('should delete existing session', () => {
      // Verify session exists
      expect(sessionService.getSession(sessionId)).not.toBeUndefined();

      // Delete session
      sessionService.deleteSession(sessionId);

      // Verify session is deleted
      expect(sessionService.getSession(sessionId)).toBeUndefined();
    });
  });

  describe('deleteSimpleWordsSession', () => {
    let sessionId: string;

    beforeEach(() => {
      const session = sessionService.createSimpleWordsSession('test-user-id');
      sessionId = session.id;
    });

    it('should delete existing simple words session', () => {
      // Verify session exists
      expect(sessionService.getSimpleWordsSession(sessionId)).not.toBeUndefined();

      // Delete session
      sessionService.deleteSimpleWordsSession(sessionId);

      // Verify session is deleted
      expect(sessionService.getSimpleWordsSession(sessionId)).toBeUndefined();
    });
  });
});