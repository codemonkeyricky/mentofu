import { User } from '../auth/auth.types';

export interface DatabaseOperations {
  createUser(user: Omit<User, 'createdAt'>): Promise<User>;
  findUserByUsername(username: string): Promise<User | null>;
  findUserById(userId: string): Promise<User | null>;
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
