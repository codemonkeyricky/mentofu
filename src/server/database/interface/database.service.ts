import { User } from '../../auth/auth.types';
import { Session } from '../../session/session.types';
import { SimpleWordsSession } from '../../session/simple.words.types';
import { DatabaseOperations } from '../interface/database.interface';
import { PostgresDatabase } from '../postgres/postgres.database';
import { MemoryDatabase } from '../memory/memory.database';

export class DatabaseService implements DatabaseOperations {
  private readonly databaseType: 'memory' | 'vercel-postgres';
  private memoryDB: MemoryDatabase | null = null;
  private postgresDB: PostgresDatabase | null = null;

  constructor(databasePath: string = './quiz.db') {
    this.databaseType = process.env.POSTGRES_URL ? 'vercel-postgres' : 'memory';

    if (this.databaseType === 'memory') {
      console.log('Using singleton in-memory database for local development');
      this.memoryDB = MemoryDatabase.getInstance();
      this.ensureAdminUserExists();
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        console.warn('WARNING: Using in-memory database in production. This is not persistent across serverless functions. Set POSTGRES_URL environment variable.');
      }
    } else {
      console.log('Using PostgreSQL database (Vercel)');
      this.postgresDB = PostgresDatabase.getInstance();
    }
  }

  private getUsersTable() {
    return this.memoryDB!.getTable('users');
  }

  private getSessionScoresTable() {
    return this.memoryDB!.getTable('session_scores');
  }

  private getMultipliersTable() {
    return this.memoryDB!.getTable('user_multipliers');
  }

  private getSessionsTable() {
    return this.memoryDB!.getTable('sessions');
  }

  private async ensureAdminUserExists(): Promise<void> {
    if (this.databaseType === 'memory') {
      const users = this.getUsersTable();
      let adminExists = false;
      for (const [userId, user] of users.entries()) {
        if (user.username === 'parent') {
          adminExists = true;
          break;
        }
      }
      if (!adminExists || !users.has('parent-user-id')) {
        console.log('Creating hardcoded parent user: parent:admin2');
        const adminUser = {
          id: 'parent-user-id',
          username: 'parent',
          passwordHash: '$2b$10$ZahMR5.ug6j/ELTQ947Izu76AE.si3OOlY/tzD9VMs0oDeYSI7g.i',
          createdAt: new Date(),
          earned_credits: 0,
          claimed_credits: 0,
          isParent: true
        };
        users.set('parent-user-id', adminUser);
      }
    }
  }

  public async saveSession(session: Session | SimpleWordsSession, quizType: string): Promise<void> {
    if (this.databaseType === 'memory') {
      const sessions = this.getSessionsTable();
      sessions.set(session.id, {
        ...session,
        quizType,
        completed: false
      });
    } else {
      await this.postgresDB!.saveSession(session, quizType);
    }
  }

  public async getSession(sessionId: string): Promise<Session | SimpleWordsSession | null> {
    if (this.databaseType === 'memory') {
      const session = this.getSessionsTable().get(sessionId);
      if (!session || session.completed) return null;

      // Remove the quizType and completed fields before returning
      const { quizType, completed, ...sessionData } = session;
      return sessionData;
    } else {
      return this.postgresDB!.getSession(sessionId);
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    if (this.databaseType === 'memory') {
      this.getSessionsTable().delete(sessionId);
    } else {
      await this.postgresDB!.deleteSession(sessionId);
    }
  }

  public async markSessionAsCompleted(sessionId: string, score: number, total: number, multiplier: number): Promise<void> {
    if (this.databaseType === 'memory') {
      const session = this.getSessionsTable().get(sessionId);
      if (!session || session.completed) {
        throw new Error('Session not found or already completed');
      }

      // Mark as completed in sessions table
      session.completed = true;

      // Also save to session_scores table for backward compatibility
      await this.saveSessionScore(session.userId, sessionId, score, total, session.quizType, multiplier);
    } else {
      await this.postgresDB!.markSessionAsCompleted(sessionId, score, total, multiplier);
    }
  }

  public async initVercelPostgres(): Promise<void> {
    if (!this.postgresDB) {
      throw new Error('PostgreSQL database is not initialized. This operation requires POSTGRES_URL environment variable.');
    }
    await this.postgresDB.initVercelPostgres();
  }

  public async createUser(user: Omit<User, 'createdAt'>): Promise<User> {
    if (this.databaseType === 'memory') {
      const users = this.getUsersTable();
      if (users.has(user.id)) throw new Error('User already exists');
      for (const existingUser of users.values()) {
        if (existingUser.username === user.username) throw new Error('User already exists');
      }
      const newUser = {
        id: user.id,
        username: user.username,
        passwordHash: user.passwordHash,
        createdAt: new Date(),
        earned_credits: 0,
        claimed_credits: 0,
        isParent: user.isParent || false
      };
      users.set(user.id, newUser);
      return newUser;
    } else {
      return this.postgresDB!.createUser(user);
    }
  }

  public async findUserByUsername(username: string): Promise<User | null> {
    if (this.databaseType === 'memory') {
      const users = this.getUsersTable();
      for (const user of users.values()) {
        if (user.username === username) return user;
      }
      return null;
    } else {
      return this.postgresDB!.findUserByUsername(username);
    }
  }

  public async findUserById(userId: string): Promise<User | null> {
    if (this.databaseType === 'memory') {
      return this.getUsersTable().get(userId) || null;
    } else {
      return this.postgresDB!.findUserById(userId);
    }
  }

  public async saveSessionScore(userId: string, sessionId: string, score: number, total: number, sessionType: string, multiplier: number = 1.0): Promise<void> {
    const scoreId = this.generateUUID();

    if (this.databaseType === 'memory') {
      const sessionScores = this.getSessionScoresTable();
      sessionScores.set(scoreId, {
        id: scoreId,
        user_id: userId,
        session_id: sessionId,
        score,
        total,
        session_type: sessionType,
        multiplier: Math.floor(multiplier),
        completed_at: new Date()
      });
    } else {
      await this.postgresDB!.saveSessionScore(userId, sessionId, score, total, sessionType, multiplier);
    }
  }

  public async getSessionScore(sessionId: string): Promise<{ score: number, total: number, multiplier?: number } | null> {
    if (this.databaseType === 'memory') {
      for (const score of this.getSessionScoresTable().values()) {
        if (score.session_id === sessionId) return { score: score.score, total: score.total, multiplier: score.multiplier };
      }
      return null;
    } else {
      return this.postgresDB!.getSessionScore(sessionId);
    }
  }

  public async getUserSessionScores(userId: string): Promise<Array<{ sessionId: string, score: number, total: number, sessionType: string, completedAt: Date, multiplier?: number }>> {
    if (this.databaseType === 'memory') {
      const sessionScores = this.getSessionScoresTable();
      const userScores: Array<{ sessionId: string, score: number, total: number, sessionType: string, completedAt: Date, multiplier?: number }> = [];
      for (const score of sessionScores.values()) {
        if (score.user_id === userId) {
          userScores.push({
            sessionId: score.session_id,
            score: score.score,
            total: score.total,
            sessionType: score.session_type,
            completedAt: score.completed_at,
            multiplier: score.multiplier
          });
        }
      }
      return userScores.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    } else {
      return this.postgresDB!.getUserSessionScores(userId);
    }
  }

  public async getUserSessionHistory(userId: string): Promise<any[]> {
    if (this.databaseType === 'memory') {
      const sessionScores = this.getSessionScoresTable();
      const history: any[] = [];
      for (const score of sessionScores.values()) {
        if (score.user_id === userId) {
          history.push({
            id: score.id,
            user_id: score.user_id,
            session_id: score.session_id,
            score: score.score,
            total: score.total,
            session_type: score.session_type,
            completed_at: score.completed_at
          });
        }
      }
      return history.sort((a, b) => b.completed_at.getTime() - a.completed_at.getTime());
    } else {
      return this.postgresDB!.getUserSessionHistory(userId);
    }
  }

  public async setUserMultiplier(userId: string, quizType: string, multiplier: number): Promise<void> {
    if (this.databaseType === 'memory') {
      const multipliers = this.getMultipliersTable();
      multipliers.set(`${userId}-${quizType}`, multiplier);
    } else {
      await this.postgresDB!.setUserMultiplier(userId, quizType, multiplier);
    }
  }

  public async getUserMultiplier(userId: string, quizType: string): Promise<number> {
    if (this.databaseType === 'memory') {
      const value = this.getMultipliersTable().get(`${userId}-${quizType}`);
      return value !== undefined ? value : 1;
    } else {
      return this.postgresDB!.getUserMultiplier(userId, quizType);
    }
  }

  public async addEarnedCredits(userId: string, amount: number): Promise<void> {
    if (this.databaseType === 'memory') {
      const users = this.getUsersTable();
      const user = users.get(userId);
      if (user) user.earned_credits = (user.earned_credits || 0) + amount;
      else throw new Error('User not found');
    } else {
      await this.postgresDB!.addEarnedCredits(userId, amount);
    }
  }

  public async getEarnedCredits(userId: string): Promise<number> {
    if (this.databaseType === 'memory') {
      return this.getUsersTable().get(userId)?.earned_credits || 0;
    } else {
      return this.postgresDB!.getEarnedCredits(userId);
    }
  }

  public async addClaimedCredits(userId: string, amount: number): Promise<void> {
    if (this.databaseType === 'memory') {
      const users = this.getUsersTable();
      const user = users.get(userId);
      if (user) user.claimed_credits = (user.claimed_credits || 0) + amount;
      else throw new Error('User not found');
    } else {
      await this.postgresDB!.addClaimedCredits(userId, amount);
    }
  }

  public async addClaimedCreditsAtomic(userId: string, amount: number, maxTotalEarned: number, expectedCurrentClaimed?: number): Promise<boolean> {
    if (this.databaseType === 'memory') {
      // Use transaction for atomicity in memory database
      return await this.memoryDB!.executeInTransaction(async () => {
        const users = this.getUsersTable();
        const user = users.get(userId);
        if (!user) return false;

        const currentClaimed = user.claimed_credits || 0;
        const currentEarned = user.earned_credits || 0;

        // Check expected current claimed if provided
        if (expectedCurrentClaimed !== undefined && currentClaimed !== expectedCurrentClaimed) {
          return false;
        }

        if (currentClaimed + amount > currentEarned) {
          return false;
        }

        // Ensure earned credits haven't decreased below validation threshold
        if (currentEarned < maxTotalEarned) {
          return false;
        }

        user.claimed_credits = currentClaimed + amount;
        return true;
      });
    } else {
      return await this.postgresDB!.addClaimedCreditsAtomic(userId, amount, maxTotalEarned, expectedCurrentClaimed);
    }
  }

  public async getClaimedCredits(userId: string): Promise<number> {
    if (this.databaseType === 'memory') {
      return this.getUsersTable().get(userId)?.claimed_credits || 0;
    } else {
      return this.postgresDB!.getClaimedCredits(userId);
    }
  }

  public async getAllUsers(): Promise<User[]> {
    if (this.databaseType === 'memory') {
      return Array.from(this.getUsersTable().values());
    } else {
      return this.postgresDB!.getAllUsers();
    }
  }

  public async createChildAccount(parentId: string, username: string, passwordHash: string): Promise<User> {
    if (this.databaseType === 'memory') {
      return this.memoryDB!.executeInTransaction(async () => {
        const users = this.getUsersTable();

        // Validate parent exists and is a parent user
        const parentUser = users.get(parentId);
        if (!parentUser) {
          throw new Error('Parent user not found');
        }
        if (!parentUser.isParent) {
          throw new Error('User is not a parent');
        }

        // Check username uniqueness
        for (const existingUser of users.values()) {
          if (existingUser.username === username) throw new Error('User already exists');
        }

        const newUser: User = {
          id: this.generateUUID(),
          username: username,
          passwordHash: passwordHash,
          createdAt: new Date(),
          earned_credits: 0,
          claimed_credits: 0,
          isParent: false,
          is_admin: false,
          parent_id: parentId
        };
        users.set(newUser.id, newUser);
        this.memoryDB!.createChildRelationship(parentId, newUser.id, username);
        return newUser;
      });
    } else {
      return this.postgresDB!.createChildAccount(parentId, username, passwordHash);
    }
  }

  public async getChildrenByParent(parentId: string): Promise<Array<{ childId: string, childUsername: string }>> {
    if (this.databaseType === 'memory') {
      return this.memoryDB!.getChildrenByParent(parentId);
    } else {
      return this.postgresDB!.getChildrenByParent(parentId);
    }
  }

  public async updateChildPassword(childId: string, passwordHash: string): Promise<void> {
    if (this.databaseType === 'memory') {
      const users = this.getUsersTable();
      const user = users.get(childId);
      if (user) user.passwordHash = passwordHash;
      else throw new Error('User not found');
    } else {
      await this.postgresDB!.updateChildPassword(childId, passwordHash);
    }
  }

  public async updateChildDetails(childId: string, username: string): Promise<void> {
    if (this.databaseType === 'memory') {
      return this.memoryDB!.executeInTransaction(async () => {
        const users = this.getUsersTable();
        const user = users.get(childId);
        if (!user) {
          throw new Error('User not found');
        }

        // Check username uniqueness
        for (const existingUser of users.values()) {
          if (existingUser.username === username && existingUser.id !== childId) {
            throw new Error('User already exists');
          }
        }

        user.username = username;
        this.memoryDB!.updateChildUsername(childId, username);
      });
    } else {
      await this.postgresDB!.updateChildDetails(childId, username);
    }
  }

  public async close(): Promise<void> {}

  public clearMemoryDatabase(): void {
    if (this.databaseType === 'memory') {
      this.memoryDB!.clear();
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
