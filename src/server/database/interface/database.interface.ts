import { User } from '../../auth/auth.types';
import { Session } from '../../session/session.types';
import { SimpleWordsSession } from '../../session/simple.words.types';

export interface DatabaseOperations {
  createUser(user: Omit<User, 'createdAt'>): Promise<User>;
  findUserByUsername(username: string): Promise<User | null>;
  findUserById(userId: string): Promise<User | null>;

  // Session storage methods
  saveSession(session: Session | SimpleWordsSession, quizType: string): Promise<void>;
  getSession(sessionId: string): Promise<Session | SimpleWordsSession | null>;
  deleteSession(sessionId: string): Promise<void>;
  markSessionAsCompleted(sessionId: string, score: number, total: number, multiplier: number): Promise<void>;

  // Score methods (legacy - now handled by markSessionAsCompleted)
  saveSessionScore(userId: string, sessionId: string, score: number, total: number, sessionType: string, multiplier: number): Promise<void>;
  getSessionScore(sessionId: string): Promise<{ score: number, total: number, multiplier?: number } | null>;
  getUserSessionScores(userId: string): Promise<Array<{ sessionId: string, score: number, total: number, sessionType: string, completedAt: Date, multiplier?: number }>>;
  getUserSessionHistory(userId: string): Promise<any[]>;

  setUserMultiplier(userId: string, quizType: string, multiplier: number): Promise<void>;
  getUserMultiplier(userId: string, quizType: string): Promise<number>;
  addEarnedCredits(userId: string, amount: number): Promise<void>;
  getEarnedCredits(userId: string): Promise<number>;
  addClaimedCredits(userId: string, amount: number): Promise<void>;
  getClaimedCredits(userId: string): Promise<number>;
  getAllUsers(): Promise<User[]>;
}
