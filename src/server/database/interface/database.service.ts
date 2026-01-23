import { User } from '../../auth/auth.types';
import { DatabaseOperations } from '../interface/database.interface';
import { PostgresDatabase } from '../postgres/postgres.database';
import { MemoryDatabase } from '../memory/memory.database';

export class DatabaseService implements DatabaseOperations {
  private readonly databaseType: 'memory' | 'vercel-postgres';
  private memoryDB: MemoryDatabase | null = null;

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

  public async initVercelPostgres(): Promise<void> {
    const postgresDB = new PostgresDatabase();
    await postgresDB.initVercelPostgres();
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
      const postgresDB = new PostgresDatabase();
      return postgresDB.createUser(user);
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
      const postgresDB = new PostgresDatabase();
      return postgresDB.findUserByUsername(username);
    }
  }

  public async findUserById(userId: string): Promise<User | null> {
    if (this.databaseType === 'memory') {
      return this.getUsersTable().get(userId) || null;
    } else {
      const postgresDB = new PostgresDatabase();
      return postgresDB.findUserById(userId);
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
      const postgresDB = new PostgresDatabase();
      await postgresDB.saveSessionScore(userId, sessionId, score, total, sessionType, multiplier);
    }
  }

  public async getSessionScore(sessionId: string): Promise<{ score: number, total: number, multiplier?: number } | null> {
    if (this.databaseType === 'memory') {
      for (const score of this.getSessionScoresTable().values()) {
        if (score.session_id === sessionId) return { score: score.score, total: score.total, multiplier: score.multiplier };
      }
      return null;
    } else {
      const postgresDB = new PostgresDatabase();
      return postgresDB.getSessionScore(sessionId);
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
      const postgresDB = new PostgresDatabase();
      return postgresDB.getUserSessionScores(userId);
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
      const postgresDB = new PostgresDatabase();
      return postgresDB.getUserSessionHistory(userId);
    }
  }

  public async setUserMultiplier(userId: string, quizType: string, multiplier: number): Promise<void> {
    if (this.databaseType === 'memory') {
      const multipliers = this.getMultipliersTable();
      multipliers.set(`${userId}-${quizType}`, multiplier);
    } else {
      const postgresDB = new PostgresDatabase();
      await postgresDB.setUserMultiplier(userId, quizType, multiplier);
    }
  }

  public async getUserMultiplier(userId: string, quizType: string): Promise<number> {
    if (this.databaseType === 'memory') {
      const value = this.getMultipliersTable().get(`${userId}-${quizType}`);
      return value !== undefined ? value : 1;
    } else {
      const postgresDB = new PostgresDatabase();
      return postgresDB.getUserMultiplier(userId, quizType);
    }
  }

  public async addEarnedCredits(userId: string, amount: number): Promise<void> {
    if (this.databaseType === 'memory') {
      const users = this.getUsersTable();
      const user = users.get(userId);
      if (user) user.earned_credits = (user.earned_credits || 0) + amount;
      else throw new Error('User not found');
    } else {
      const postgresDB = new PostgresDatabase();
      await postgresDB.addEarnedCredits(userId, amount);
    }
  }

  public async getEarnedCredits(userId: string): Promise<number> {
    if (this.databaseType === 'memory') {
      return this.getUsersTable().get(userId)?.earned_credits || 0;
    } else {
      const postgresDB = new PostgresDatabase();
      return postgresDB.getEarnedCredits(userId);
    }
  }

  public async addClaimedCredits(userId: string, amount: number): Promise<void> {
    if (this.databaseType === 'memory') {
      const users = this.getUsersTable();
      const user = users.get(userId);
      if (user) user.claimed_credits = (user.claimed_credits || 0) + amount;
      else throw new Error('User not found');
    } else {
      const postgresDB = new PostgresDatabase();
      await postgresDB.addClaimedCredits(userId, amount);
    }
  }

  public async getClaimedCredits(userId: string): Promise<number> {
    if (this.databaseType === 'memory') {
      return this.getUsersTable().get(userId)?.claimed_credits || 0;
    } else {
      const postgresDB = new PostgresDatabase();
      return postgresDB.getClaimedCredits(userId);
    }
  }

  public async getAllUsers(): Promise<User[]> {
    if (this.databaseType === 'memory') {
      return Array.from(this.getUsersTable().values());
    } else {
      const postgresDB = new PostgresDatabase();
      return postgresDB.getAllUsers();
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
