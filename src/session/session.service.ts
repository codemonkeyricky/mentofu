import { Session, Question } from './session.types';
import { generateQuestions, generateDivisionQuestions, generateFractionComparisonQuestions, generateBODMASQuestions } from '../utils/question.generator';
import { generateSimpleWords } from '../utils/simple.words.generator';
import { SimpleWordsSession } from './simple.words.types';
import { DatabaseService } from '../database/database.service';

// Simple UUID generator function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class SessionService {
  private sessions: Map<string, Session> = new Map();
  private simpleWordsSessions: Map<string, SimpleWordsSession> = new Map();
  private readonly SESSION_TTL: number = 10 * 60 * 1000; // 10 minutes in milliseconds
  private databaseService: DatabaseService | null = null;
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private simpleWordsSessionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(databaseService?: DatabaseService) {
    this.databaseService = databaseService || null;
  }

  public setDatabaseService(databaseService: DatabaseService): void {
    this.databaseService = databaseService;
  }

  public createSession(userId: string): Session {
    const sessionId = generateUUID();
    const questions = generateQuestions(10);

    const session: Session = {
      id: sessionId,
      userId: userId,
      questions: questions,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, session);

    // Set up cleanup for expired sessions
    const timeout = setTimeout(() => {
      this.deleteSession(sessionId);
    }, this.SESSION_TTL);

    // Store the timeout so we can clear it later
    this.sessionTimeouts.set(sessionId, timeout);

    // Save session metadata to database if database service is available
    if (this.databaseService) {
      // We'll save a placeholder or just ensure that when answers are submitted,
      // the score will be properly tracked. The key is that we need to make sure
      // there's a way for /session/all to return session information.
    }

    return session;
  }

  public createDivisionSession(userId: string): Session {
    const sessionId = generateUUID();
    const questions = generateDivisionQuestions(10);

    const session: Session = {
      id: sessionId,
      userId: userId,
      questions: questions,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, session);

    // Set up cleanup for expired sessions
    const timeout = setTimeout(() => {
      this.deleteSession(sessionId);
    }, this.SESSION_TTL);

    // Store the timeout so we can clear it later
    this.sessionTimeouts.set(sessionId, timeout);

    // Save session metadata to database if database service is available
    if (this.databaseService) {
      // We'll save a placeholder or just ensure that when answers are submitted,
      // the score will be properly tracked. The key is that we need to make sure
      // there's a way for /session/all to return session information.
    }

    return session;
  }

  public createBODMASession(userId: string): Session {
    const sessionId = generateUUID();
    const questions = generateBODMASQuestions(10);

    const session: Session = {
      id: sessionId,
      userId: userId,
      questions: questions,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, session);

    // Set up cleanup for expired sessions
    const timeout = setTimeout(() => {
      this.deleteSession(sessionId);
    }, this.SESSION_TTL);

    // Store the timeout so we can clear it later
    this.sessionTimeouts.set(sessionId, timeout);

    // Save session metadata to database if database service is available
    if (this.databaseService) {
      // We'll save a placeholder or just ensure that when answers are submitted,
      // the score will be properly tracked. The key is that we need to make sure
      // there's a way for /session/all to return session information.
    }

    return session;
  }

  public createFractionComparisonSession(userId: string): Session {
    const sessionId = generateUUID();
    const questions = generateFractionComparisonQuestions(10);

    const session: Session = {
      id: sessionId,
      userId: userId,
      questions: questions,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, session);

    // Set up cleanup for expired sessions
    const timeout = setTimeout(() => {
      this.deleteSession(sessionId);
    }, this.SESSION_TTL);

    // Store the timeout so we can clear it later
    this.sessionTimeouts.set(sessionId, timeout);

    // Save session metadata to database if database service is available
    if (this.databaseService) {
      // We'll save a placeholder or just ensure that when answers are submitted,
      // the score will be properly tracked. The key is that we need to make sure
      // there's a way for /session/all to return session information.
    }

    return session;
  }

  public createSimpleWordsSession(userId: string): SimpleWordsSession {
    const sessionId = generateUUID();
    const words = generateSimpleWords(10);

    const session: SimpleWordsSession = {
      id: sessionId,
      userId: userId,
      words: words,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.simpleWordsSessions.set(sessionId, session);

    // Set up cleanup for expired sessions
    const timeout = setTimeout(() => {
      this.deleteSimpleWordsSession(sessionId);
    }, this.SESSION_TTL);

    // Store the timeout so we can clear it later
    this.simpleWordsSessionTimeouts.set(sessionId, timeout);

    return session;
  }

  public getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);

    if (session) {
      // Update last accessed time
      session.updatedAt = new Date();
    }

    return session;
  }

  public getSimpleWordsSession(sessionId: string): SimpleWordsSession | undefined {
    const session = this.simpleWordsSessions.get(sessionId);

    if (session) {
      // Update last accessed time
      session.updatedAt = new Date();
    }

    return session;
  }

  public validateAnswers(sessionId: string, userId: string, userAnswers: (number | string)[]): { score: number; total: number } {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Verify that the session belongs to the user
    if (session.userId !== userId) {
      throw new Error('Unauthorized access to session');
    }

    let correctCount = 0;

    // Compare each user answer with the correct answer
    for (let i = 0; i < session.questions.length; i++) {
      // Check if this is a MathQuestion (regular math question)
      if ('question' in session.questions[i] && typeof session.questions[i].question === 'string') {
        // For regular math questions, convert both values to strings for comparison since API sends them as strings
        if (String(userAnswers[i]) === String(session.questions[i].answer)) {
          correctCount++;
        }
      } else {
        // For fraction comparison questions, we should not be calling this function with them
        throw new Error('Invalid question type for validateAnswers');
      }
    }

    const result = {
      score: correctCount,
      total: session.questions.length
    };

    // Save the score to database if database service is available
    if (this.databaseService) {
      this.databaseService.saveSessionScore(userId, sessionId, result.score, result.total, 'math');
    }

    return result;
  }

  private convertFractionAnswerToNumber(answer: string): number {
    switch(answer) {
      case '>': return 1;
      case '<': return 2;
      case '=': return 3;
      default: return 0;
    }
  }

  private convertNumberToFractionAnswer(answer: number): string {
    switch(answer) {
      case 1: return '>';
      case 2: return '<';
      case 3: return '=';
      default: return '';
    }
  }

  public validateBODMASAnswers(sessionId: string, userId: string, userAnswers: (number | string)[]): { score: number; total: number } {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Verify that the session belongs to the user
    if (session.userId !== userId) {
      throw new Error('Unauthorized access to session');
    }

    let correctCount = 0;

    // Compare each user answer with the correct answer
    for (let i = 0; i < session.questions.length; i++) {
      // Check if this is a MathQuestion (regular math question)
      if ('question' in session.questions[i] && typeof session.questions[i].question === 'string') {
        // For BODMAS questions, convert both values to strings for comparison since API sends them as strings
        if (String(userAnswers[i]) === String(session.questions[i].answer)) {
          correctCount++;
        }
      } else {
        // For fraction comparison questions, we should not be calling this function with them
        throw new Error('Invalid question type for validateBODMASAnswers');
      }
    }

    const result = {
      score: correctCount,
      total: session.questions.length
    };

    // Save the score to database if database service is available
    if (this.databaseService) {
      this.databaseService.saveSessionScore(userId, sessionId, result.score, result.total, 'math');
    }

    return result;
  }

  public validateFractionComparisonAnswers(sessionId: string, userId: string, userAnswers: (number | string)[]): { score: number; total: number } {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Verify that the session belongs to the user
    if (session.userId !== userId) {
      throw new Error('Unauthorized access to session');
    }

    let correctCount = 0;

    // Compare each user answer with the correct answer
    for (let i = 0; i < session.questions.length; i++) {
      // Check if this is a FractionComparisonQuestion
      if ('question' in session.questions[i] && Array.isArray(session.questions[i].question)) {
        // For fraction comparison questions, direct string comparison
        if (String(userAnswers[i]) === String(session.questions[i].answer)) {
          correctCount++;
        }
      } else {
        // For regular math questions, we should not be calling this function with them
        throw new Error('Invalid question type for validateFractionComparisonAnswers');
      }
    }

    const result = {
      score: correctCount,
      total: session.questions.length
    };

    // Save the score to database if database service is available
    if (this.databaseService) {
      this.databaseService.saveSessionScore(userId, sessionId, result.score, result.total, 'math');
    }

    return result;
  }

  public validateSimpleWordsAnswers(sessionId: string, userId: string, userAnswers: string[]): { score: number; total: number } {
    const session = this.simpleWordsSessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Verify that the session belongs to the user
    if (session.userId !== userId) {
      throw new Error('Unauthorized access to session');
    }

    let correctCount = 0;

    // Compare each user answer with the correct word (case insensitive)
    for (let i = 0; i < session.words.length && i < userAnswers.length; i++) {
      if (userAnswers[i] && userAnswers[i].toLowerCase() === session.words[i].word.toLowerCase()) {
        correctCount++;
      }
    }

    const result = {
      score: correctCount,
      total: session.words.length
    };

    // Save the score to database if database service is available
    if (this.databaseService) {
      this.databaseService.saveSessionScore(userId, sessionId, result.score, result.total, 'simple_words');
    }

    return result;
  }

  public async getSessionScore(sessionId: string): Promise<{score: number, total: number} | null> {
    if (!this.databaseService) {
      return null;
    }

    return this.databaseService.getSessionScore(sessionId);
  }

  public async getUserSessionScores(userId: string): Promise<Array<{sessionId: string, score: number, total: number, sessionType: string, completedAt: Date}>> {
    if (!this.databaseService) {
      return [];
    }

    return this.databaseService.getUserSessionScores(userId);
  }

  public async getUserSessions(userId: string): Promise<Array<{sessionId: string, sessionType: string, score: number, total: number, completedAt: Date, createdAt: Date}>> {
    if (!this.databaseService) {
      return [];
    }

    // Get all session scores for the user
    const scores = await this.databaseService.getUserSessionScores(userId);

    // Transform to include creation date and other metadata
    return scores.map(score => ({
      sessionId: score.sessionId,
      sessionType: score.sessionType,
      score: score.score,
      total: score.total,
      completedAt: score.completedAt,
      createdAt: score.completedAt // For consistency, we'll use completedAt as created time for now
    }));
  }

  public deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);

    // Clear the timeout if it exists
    const timeout = this.sessionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.sessionTimeouts.delete(sessionId);
    }
  }

  public deleteSimpleWordsSession(sessionId: string): void {
    this.simpleWordsSessions.delete(sessionId);

    // Clear the timeout if it exists
    const timeout = this.simpleWordsSessionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.simpleWordsSessionTimeouts.delete(sessionId);
    }
  }

  public cleanupExpiredSessions(): void {
    const now = new Date().getTime();

    // Cleanup regular sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionAge = now - session.createdAt.getTime();

      if (sessionAge > this.SESSION_TTL) {
        this.deleteSession(sessionId);
      }
    }

    // Cleanup simple words sessions
    for (const [sessionId, session] of this.simpleWordsSessions.entries()) {
      const sessionAge = now - session.createdAt.getTime();

      if (sessionAge > this.SESSION_TTL) {
        this.deleteSimpleWordsSession(sessionId);
      }
    }
  }

  // For test environments to clear all timeouts
  public clearAllTimeouts(): void {
    // Clear all regular session timeouts
    for (const [sessionId, timeout] of this.sessionTimeouts.entries()) {
      clearTimeout(timeout);
    }
    this.sessionTimeouts.clear();

    // Clear all simple words session timeouts
    for (const [sessionId, timeout] of this.simpleWordsSessionTimeouts.entries()) {
      clearTimeout(timeout);
    }
    this.simpleWordsSessionTimeouts.clear();
  }
}

export const sessionService = new SessionService();