import { Session, Question, FactorsQuestion } from './session.types';
import { SessionType } from './session.service.interface';
import { generateQuestions, generateDivisionQuestions, generateFractionComparisonQuestions, generateBODMASQuestions, generateFactorsQuestions } from '../utils/question.generator';
import { generateSimpleWords } from '../utils/simple.words.generator';
import { SimpleWordsSession } from './simple.words.types';
import { DatabaseService } from '../database/interface/database.service';
import { ISessionService } from './session.service.interface';

// Type-safe question generator mapping
const questionGenerators: Record<string, (count: number) => Question[]> = {
  'simple-math': generateQuestions,
  'simple-math-2': generateDivisionQuestions,
  'simple-math-3': generateFractionComparisonQuestions,
  'simple-math-4': generateBODMASQuestions,
  'simple-math-5': generateFactorsQuestions,
};

// Math validation config: maps quiz types to question checks and answer validation
type MathValidationConfig = {
  isApplicable: (question: Question) => boolean;
  validate: (question: Question, userAnswer: number | string) => boolean;
};

const mathValidationConfigs: Record<string, MathValidationConfig> = {
  'simple-math': {
    isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
    validate: (q, ua) => String(ua) === String(q.answer),
  },
  'simple-math-2': {
    isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
    validate: (q, ua) => String(ua) === String(q.answer),
  },
  'simple-math-3': {
    isApplicable: (q) => typeof q === 'object' && 'question' in q && Array.isArray(q.question),
    validate: (q, ua) => String(ua) === String(q.answer),
  },
  'simple-math-4': {
    isApplicable: (q) => typeof q === 'object' && 'question' in q && typeof q.question === 'string',
    validate: (q, ua) => String(ua) === String(q.answer),
  },
  'simple-math-5': {
    isApplicable: (q): q is FactorsQuestion => 'factors' in q,
    validate: (q, ua) => {
      // More explicit type checking to avoid TS errors
      if ((q as any).factors === undefined) {
        return false;
      }
      const userFactors = String(ua)
        .split(',')
        .map(f => f.trim())
        .filter(Boolean)
        .map(Number)
        .filter(n => !isNaN(n));
      return userFactors.every(f => (q as any).factors.includes(f)) && userFactors.length === (q as any).factors.length;
    },
  },
};

// Simple UUID v4 generator
const generateUUID = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

class SessionService implements ISessionService {
  private sessions = new Map<string, Session>();
  private simpleWordsSessions = new Map<string, SimpleWordsSession>();
  private sessionTimeouts = new Map<string, NodeJS.Timeout>();
  private simpleWordsSessionTimeouts = new Map<string, NodeJS.Timeout>();
  private databaseService: DatabaseService | null = null;
  private readonly SESSION_TTL = 10 * 60 * 1000; // 10 minutes

  constructor(databaseService?: DatabaseService) {
    this.databaseService = databaseService || null;
  }

  public setDatabaseService(service: DatabaseService): void {
    this.databaseService = service;
  }

  private getMultiplierCategory(quizType: string): string {
    return quizType === 'simple-words' ? 'simple_words' : quizType.startsWith('simple-math') ? 'math' : quizType;
  }

  // Helper: Create session with auto-expiry timeout
  private createTimedSession<T>(sessionId: string, data: T, map: Map<string, T>, timeoutMap: Map<string, NodeJS.Timeout>): void {
    map.set(sessionId, data);
    const timeout = setTimeout(() => this.deleteSessionFromMap(sessionId, map, timeoutMap), this.SESSION_TTL);
    timeoutMap.set(sessionId, timeout);
  }

  // Helper: Delete session and clear timeout
  private deleteSessionFromMap<T>(sessionId: string, map: Map<string, T>, timeoutMap: Map<string, NodeJS.Timeout>): void {
    map.delete(sessionId);
    const timeout = timeoutMap.get(sessionId);
    timeout && clearTimeout(timeout);
    timeoutMap.delete(sessionId);
  }

  // Helper: Update session's last accessed time
  private touchSession<T extends { updatedAt: Date }>(sessionId: string, map: Map<string, T>): T | undefined {
    const session = map.get(sessionId);
    session && (session.updatedAt = new Date());
    return session;
  }

  // Helper: Save score and fetch multiplier (with error handling)
  private async saveScore(userId: string, sessionId: string, score: number, total: number, quizType: string): Promise<void> {
    if (!this.databaseService) return;

    const multiplier = await this.getUserMultiplier(userId, this.getMultiplierCategory(quizType)).catch(() => 1.0);
    await this.databaseService.saveSessionScore(userId, sessionId, score, total, quizType, multiplier);
  }

  // Helper: Cleanup expired sessions for any map type
  private cleanupExpired<T extends { createdAt: Date }>(map: Map<string, T>, timeoutMap: Map<string, NodeJS.Timeout>): void {
    const now = Date.now();
    for (const [sessionId, session] of map.entries()) {
      if (now - session.createdAt.getTime() > this.SESSION_TTL) this.deleteSessionFromMap(sessionId, map, timeoutMap);
    }
  }

  // ------------------------------ Public Methods ------------------------------
  public createQuizSession(userId: string, quizType: string): SessionType {
    const sessionId = generateUUID();

    if (quizType === 'simple-words') {
      const session: SimpleWordsSession = {
        id: sessionId,
        userId,
        words: generateSimpleWords(10),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.createTimedSession(sessionId, session, this.simpleWordsSessions, this.simpleWordsSessionTimeouts);
      return session;
    }

    const generator = questionGenerators[quizType];
    if (!generator) throw new Error(`Invalid math quiz type: ${quizType}`);

    const session: Session = {
      id: sessionId,
      userId,
      questions: generator(quizType === 'simple-math-5' ? 5 : 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.createTimedSession(sessionId, session, this.sessions, this.sessionTimeouts);
    return session;
  }

  public async validateQuizAnswers(sessionId: string, userId: string, userAnswers: (number | string)[], quizType: string): Promise<{ score: number; total: number }> {
    if (quizType === 'simple-words') return this.validateSimpleWords(sessionId, userId, userAnswers as string[]);

    const config = mathValidationConfigs[quizType];
    if (!config) throw new Error(`Invalid math quiz type: ${quizType}`);

    return this.validateMathSession(sessionId, userId, userAnswers, quizType, config);
  }

  public getSession(sessionId: string): Session | undefined {
    return this.touchSession(sessionId, this.sessions);
  }

  public getSimpleWordsSession(sessionId: string): SimpleWordsSession | undefined {
    return this.touchSession(sessionId, this.simpleWordsSessions);
  }

  public deleteSession(sessionId: string): void {
    this.deleteSessionFromMap(sessionId, this.sessions, this.sessionTimeouts);
  }

  public deleteSimpleWordsSession(sessionId: string): void {
    this.deleteSessionFromMap(sessionId, this.simpleWordsSessions, this.simpleWordsSessionTimeouts);
  }

  public cleanupExpiredSessions(): void {
    this.cleanupExpired(this.sessions, this.sessionTimeouts);
    this.cleanupExpired(this.simpleWordsSessions, this.simpleWordsSessionTimeouts);
  }

  public clearAllTimeouts(): void {
    this.sessionTimeouts.forEach(clearTimeout);
    this.simpleWordsSessionTimeouts.forEach(clearTimeout);
    this.sessionTimeouts.clear();
    this.simpleWordsSessionTimeouts.clear();
  }

  public async setUserMultiplier(userId: string, quizType: string, multiplier: number): Promise<void> {
    if (!this.databaseService) throw new Error('Database not initialized');
    await this.databaseService.setUserMultiplier(userId, quizType, multiplier);
  }

  public async getUserMultiplier(userId: string, quizType: string): Promise<number> {
    if (!this.databaseService) throw new Error('Database not initialized');
    return this.databaseService.getUserMultiplier(userId, quizType);
  }

  public async getSessionScore(sessionId: string): Promise<{ score: number; total: number } | null> {
    return this.databaseService?.getSessionScore(sessionId) || null;
  }

  public async getUserSessionScores(userId: string): Promise<Array<{
    sessionId: string;
    score: number;
    total: number;
    sessionType: string;
    completedAt: Date;
    multiplier?: number;
  }>> {
    return this.databaseService?.getUserSessionScores(userId) || [];
  }

  public async getUserSessions(userId: string): Promise<Array<{
    sessionId: string;
    sessionType: string;
    score: number;
    total: number;
    completedAt: Date;
    createdAt: Date;
    multiplier?: number;
  }>> {
    if (!this.databaseService) return [];
    const scores = await this.databaseService.getUserSessionScores(userId);
    return scores.map((score: { sessionId: string, score: number, total: number, sessionType: string, completedAt: Date, multiplier?: number }) => ({
      ...score,
      createdAt: score.completedAt, // Match original logic
    }));
  }

  public async getUserStats(userId: string): Promise<{
    totalScore: number;
    sessionsCount: number;
    details: Array<{
      sessionId: string;
      score: number;
      multiplier: number;
      weightedScore: number;
      sessionType: string;
    }>;
  }> {
    if (!this.databaseService) throw new Error('Database not initialized');
    const scores = await this.databaseService.getUserSessionScores(userId);

    let totalScore = 0;
    const details = await Promise.all(scores.map(async score => {
      const multiplier = await this.getUserMultiplier(userId, this.getMultiplierCategory(score.sessionType)).catch(() => 1.0);
      const weighted = score.score * multiplier;
      totalScore += weighted;
      return { sessionId: score.sessionId, score: score.score, multiplier, weightedScore: weighted, sessionType: score.sessionType };
    }));

    return { totalScore, sessionsCount: scores.length, details };
  }

  // ------------------------------ Private Validation Methods ------------------------------
  private async validateMathSession(
    sessionId: string,
    userId: string,
    userAnswers: (number | string)[],
    quizType: string,
    config: MathValidationConfig
  ): Promise<{ score: number; total: number }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.userId !== userId) throw new Error('Unauthorized access to session');

    const correctCount = session.questions.reduce((count, question, i) => {
      if (!config.isApplicable(question)) throw new Error(`Invalid question type for ${quizType}`);
      return config.validate(question, userAnswers[i]) ? count + 1 : count;
    }, 0);

    const result = { score: correctCount, total: session.questions.length };
    await this.saveScore(userId, sessionId, result.score, result.total, quizType);
    return result;
  }

  private async validateSimpleWords(
    sessionId: string,
    userId: string,
    userAnswers: string[]
  ): Promise<{ score: number; total: number }> {
    const session = this.simpleWordsSessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.userId !== userId) throw new Error('Unauthorized access to session');

    const correctCount = session.words.reduce((count, word, i) => {
      return userAnswers[i]?.toLowerCase() === word.word.toLowerCase() ? count + 1 : count;
    }, 0);

    const result = { score: correctCount, total: session.words.length };
    await this.saveScore(userId, sessionId, result.score, result.total, 'simple-words');
    return result;
  }
}

export const sessionService = new SessionService();
