import { Session } from './session.types';
import { SimpleWordsSession } from './simple.words.types';
import { DatabaseService } from '../database/interface/database.service';

export type SessionType = Session | SimpleWordsSession;

export interface ISessionService {
  createQuizSession(userId: string, quizType: string): SessionType;
  validateQuizAnswers(sessionId: string, userId: string, userAnswers: (number | string)[], quizType: string): Promise<{ score: number; total: number }>;
  getSession(sessionId: string): Session | undefined;
  getSimpleWordsSession(sessionId: string): SimpleWordsSession | undefined;
  deleteSession(sessionId: string): void;
  deleteSimpleWordsSession(sessionId: string): void;
  cleanupExpiredSessions(): void;
  clearAllTimeouts(): void;
  setUserMultiplier(userId: string, quizType: string, multiplier: number): Promise<void>;
  getUserMultiplier(userId: string, quizType: string): Promise<number>;
  getSessionScore(sessionId: string): Promise<{ score: number; total: number } | null>;
  getUserSessionScores(userId: string): Promise<Array<{
    sessionId: string;
    score: number;
    total: number;
    sessionType: string;
    completedAt: Date;
    multiplier?: number;
  }>>;
  getUserSessions(userId: string): Promise<Array<{
    sessionId: string;
    sessionType: string;
    score: number;
    total: number;
    completedAt: Date;
    createdAt: Date;
    multiplier?: number;
  }>>;
  getUserStats(userId: string): Promise<{
    totalScore: number;
    sessionsCount: number;
    details: Array<{
      sessionId: string;
      score: number;
      multiplier: number;
      weightedScore: number;
      sessionType: string;
    }>;
  }>;
}

export { Session };
export { SimpleWordsSession };
