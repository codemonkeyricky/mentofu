import { User } from '../auth/auth.types';
import { sql } from '@vercel/postgres';
import { DatabaseOperations } from './database.types';

class MemoryDatabase {
  private static instance: MemoryDatabase;
  private db: Map<string, Map<string, any>>;

  private constructor() {
    this.db = new Map();
    this.init();
  }

  public static getInstance(): MemoryDatabase {
    if (!MemoryDatabase.instance) {
      MemoryDatabase.instance = new MemoryDatabase();
    }
    return MemoryDatabase.instance;
  }

  private init(): void {
    if (!this.db.has('users')) this.db.set('users', new Map());
    if (!this.db.has('session_scores')) this.db.set('session_scores', new Map());
    if (!this.db.has('user_multipliers')) this.db.set('user_multipliers', new Map());
  }

  public getTable(tableName: string): Map<string, any> {
    if (!this.db.has(tableName)) this.db.set(tableName, new Map());
    return this.db.get(tableName)!;
  }

  public clear(): void {
    this.db.clear();
    this.init();
  }
}

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

  private handlePostgresResult<T>(result: any): T {
    return result.rows && result.rows.length > 0 ? result.rows[0] as T : null as T;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
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
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          earned_credits INTEGER DEFAULT 0,
          claimed_credits INTEGER DEFAULT 0,
          is_admin BOOLEAN DEFAULT FALSE
        )
      `;

      await sql`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='earned_credits') THEN
                ALTER TABLE users ADD COLUMN earned_credits INTEGER DEFAULT 0;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='claimed_credits') THEN
                ALTER TABLE users ADD COLUMN claimed_credits INTEGER DEFAULT 0;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_admin') THEN
                ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
            END IF;
        END $$;
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS session_scores (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          score INTEGER NOT NULL,
          total INTEGER NOT NULL,
          session_type TEXT NOT NULL,
          multiplier INTEGER DEFAULT 1,
          completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `;

      await sql`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='session_scores' AND column_name='multiplier') THEN
                ALTER TABLE session_scores ADD COLUMN multiplier INTEGER DEFAULT 1;
            END IF;
        END $$;
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS user_multipliers (
          user_id TEXT NOT NULL,
          quiz_type TEXT NOT NULL,
          multiplier INTEGER NOT NULL,
          PRIMARY KEY (user_id, quiz_type),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `;

      await this.createAdminUserIfNotExists();
    } catch (error) {
      console.error('Error initializing Vercel Postgres tables:', error);
      throw error;
    }
  }

  private async createAdminUserIfNotExists(): Promise<void> {
    try {
      const result = await sql`SELECT id, is_admin FROM users WHERE username = 'parent'`;
      if (result.rows.length === 0) {
        console.log('Creating hardcoded parent user: parent:admin2');
        await sql`
          INSERT INTO users (id, username, password_hash, is_admin)
          VALUES ('parent-user-id', 'parent', \$2b\$10\$ZahMR5.ug6j/ELTQ947Izu76AE.si3OOlY/tzD9VMs0oDeYSI7g.i, true)
        `;
      } else {
        const user = result.rows[0];
        if (!user.is_admin) {
          console.log('Updating existing parent user to have admin privileges');
          await sql`UPDATE users SET is_admin = true WHERE username = 'parent'`;
        }
      }
    } catch (error) {
      console.error('Error creating parent user in PostgreSQL:', error);
    }
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
      try {
        await this.initVercelPostgres();
        await sql`
          INSERT INTO users (id, username, password_hash, is_admin)
          VALUES (${user.id}, ${user.username}, ${user.passwordHash}, ${user.isParent || false})
        `;
        const result = await sql`
          SELECT id, username, password_hash as "passwordHash", created_at as "createdAt", earned_credits, claimed_credits, is_admin as "isParent"
          FROM users WHERE id = ${user.id}
        `;
        return this.handlePostgresResult<User>(result);
      } catch (error: any) {
        if (error.message.includes('duplicate key') || error.code === '23505') {
          throw new Error('User already exists');
        }
        throw error;
      }
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
      const result = await sql`
        SELECT id, username, password_hash as "passwordHash", created_at as "createdAt", earned_credits, claimed_credits, is_admin as "isParent"
        FROM users WHERE username = ${username}
      `;
      return this.handlePostgresResult<User>(result);
    }
  }

  public async findUserById(userId: string): Promise<User | null> {
    if (this.databaseType === 'memory') {
      return this.getUsersTable().get(userId) || null;
    } else {
      const result = await sql`
        SELECT id, username, password_hash as "passwordHash", created_at as "createdAt", earned_credits, claimed_credits, is_admin as "isParent"
        FROM users WHERE id = ${userId}
      `;
      return this.handlePostgresResult<User>(result);
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
      await sql`
        INSERT INTO session_scores (id, user_id, session_id, score, total, session_type, multiplier)
        VALUES (${scoreId}, ${userId}, ${sessionId}, ${score}, ${total}, ${sessionType}, ${Math.floor(multiplier)})
      `;
    }
  }

  public async getSessionScore(sessionId: string): Promise<{ score: number, total: number, multiplier?: number } | null> {
    if (this.databaseType === 'memory') {
      for (const score of this.getSessionScoresTable().values()) {
        if (score.session_id === sessionId) return { score: score.score, total: score.total, multiplier: score.multiplier };
      }
      return null;
    } else {
      const result = await sql`
        SELECT score, total, multiplier FROM session_scores WHERE session_id = ${sessionId}
      `;
      return this.handlePostgresResult<{ score: number, total: number, multiplier?: number }>(result);
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
      const result = await sql`
        SELECT
          session_id as "sessionId",
          score,
          total,
          session_type as "sessionType",
          completed_at as "completedAt",
          multiplier
        FROM session_scores
        WHERE user_id = ${userId}
        ORDER BY completed_at DESC
      `;
      return result.rows.map((row: any) => ({
        sessionId: row.sessionId,
        score: row.score,
        total: row.total,
        sessionType: row.sessionType,
        completedAt: new Date(row.completedAt),
        multiplier: row.multiplier
      }));
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
      const result = await sql`
        SELECT
          id,
          user_id as "userId",
          session_id as "sessionId",
          score,
          total,
          session_type as "sessionType",
          completed_at as "completedAt"
        FROM session_scores
        WHERE user_id = ${userId}
        ORDER BY completed_at DESC
      `;
      return result.rows;
    }
  }

  public async setUserMultiplier(userId: string, quizType: string, multiplier: number): Promise<void> {
    if (this.databaseType === 'memory') {
      const multipliers = this.getMultipliersTable();
      multipliers.set(`${userId}-${quizType}`, Math.floor(multiplier));
    } else {
      await sql`
        INSERT INTO user_multipliers (user_id, quiz_type, multiplier)
        VALUES (${userId}, ${quizType}, ${Math.floor(multiplier)})
        ON CONFLICT (user_id, quiz_type)
        DO UPDATE SET multiplier = EXCLUDED.multiplier
      `;
    }
  }

  public async getUserMultiplier(userId: string, quizType: string): Promise<number> {
    if (this.databaseType === 'memory') {
      return Math.floor(this.getMultipliersTable().get(`${userId}-${quizType}`) || 1);
    } else {
      try {
        const result = await sql`
          SELECT multiplier FROM user_multipliers WHERE user_id = ${userId} AND quiz_type = ${quizType}
        `;
        const postgresResult = this.handlePostgresResult<{ multiplier: number }>(result);
        if (postgresResult) return Math.floor(postgresResult.multiplier);
        return 1;
      } catch (error: any) {
        throw error;
      }
    }
  }

  public async addEarnedCredits(userId: string, amount: number): Promise<void> {
    if (this.databaseType === 'memory') {
      const users = this.getUsersTable();
      const user = users.get(userId);
      if (user) user.earned_credits = (user.earned_credits || 0) + amount;
      else throw new Error('User not found');
    } else {
      const result = await sql`UPDATE users SET earned_credits = earned_credits + ${amount} WHERE id = ${userId}`;
      if (result.rowCount === 0) throw new Error('User not found');
    }
  }

  public async getEarnedCredits(userId: string): Promise<number> {
    if (this.databaseType === 'memory') {
      return this.getUsersTable().get(userId)?.earned_credits || 0;
    } else {
      const result = await sql`SELECT earned_credits FROM users WHERE id = ${userId}`;
      const postgresResult = this.handlePostgresResult<{ earned_credits: number }>(result);
      return postgresResult?.earned_credits || 0;
    }
  }

  public async addClaimedCredits(userId: string, amount: number): Promise<void> {
    if (this.databaseType === 'memory') {
      const users = this.getUsersTable();
      const user = users.get(userId);
      if (user) user.claimed_credits = (user.claimed_credits || 0) + amount;
      else throw new Error('User not found');
    } else {
      const result = await sql`UPDATE users SET claimed_credits = claimed_credits + ${amount} WHERE id = ${userId}`;
      if (result.rowCount === 0) throw new Error('User not found');
    }
  }

  public async getClaimedCredits(userId: string): Promise<number> {
    if (this.databaseType === 'memory') {
      return this.getUsersTable().get(userId)?.claimed_credits || 0;
    } else {
      const result = await sql`SELECT claimed_credits FROM users WHERE id = ${userId}`;
      const postgresResult = this.handlePostgresResult<{ claimed_credits: number }>(result);
      return postgresResult?.claimed_credits || 0;
    }
  }

  public async getAllUsers(): Promise<User[]> {
    if (this.databaseType === 'memory') {
      return Array.from(this.getUsersTable().values());
    } else {
      const result = await sql`
        SELECT id, username, password_hash as "passwordHash", created_at as "createdAt", earned_credits, claimed_credits, is_admin as "isParent"
        FROM users
      `;
      return result.rows.map((row: any) => ({
        id: row.id,
        username: row.username,
        passwordHash: row.passwordHash,
        createdAt: row.createdAt,
        earned_credits: row.earned_credits,
        claimed_credits: row.claimed_credits,
        isParent: row.isParent
      }));
    }
  }

  public async close(): Promise<void> {}

  public clearMemoryDatabase(): void {
    if (this.databaseType === 'memory') {
      this.memoryDB!.clear();
    }
  }
}
