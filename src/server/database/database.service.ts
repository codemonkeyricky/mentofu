import { User } from '../auth/auth.types';
import { sql } from '@vercel/postgres';

// Singleton in-memory database
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
    if (!this.db.has('users')) {
      this.db.set('users', new Map());
    }
    if (!this.db.has('session_scores')) {
      this.db.set('session_scores', new Map());
    }
    if (!this.db.has('user_multipliers')) {
      this.db.set('user_multipliers', new Map());
    }
  }

  public getTable(tableName: string): Map<string, any> {
    if (!this.db.has(tableName)) {
      this.db.set(tableName, new Map());
    }
    return this.db.get(tableName)!;
  }

  public clear(): void {
    this.db.clear();
    this.init();
  }
}

// Base database operations interface
interface DatabaseOperations {
  initVercelPostgres(): Promise<void>;
  createUser(user: Omit<User, 'createdAt'>): Promise<User>;
  findUserByUsername(username: string): Promise<User | null>;
  findUserById(userId: string): Promise<User | null>;
  saveSessionScore(
    userId: string,
    sessionId: string,
    score: number,
    total: number,
    sessionType: 'math' | 'simple_words',
    multiplier: number
  ): Promise<void>;
  getSessionScore(sessionId: string): Promise<{ score: number, total: number, multiplier?: number } | null>;
  getUserSessionScores(userId: string): Promise<Array<{ sessionId: string, score: number, total: number, sessionType: string, completedAt: Date, multiplier?: number }>>;
  getUserSessionHistory(userId: string): Promise<any[]>;
  setUserMultiplier(userId: string, quizType: string, multiplier: number): Promise<void>;
  getUserMultiplier(userId: string, quizType: string): Promise<number>;
  addEarnedCredits(userId: string, amount: number): Promise<void>;
  getEarnedCredits(userId: string): Promise<number>;
  addClaimedCredits(userId: string, amount: number): Promise<void>;
  getClaimedCredits(userId: string): Promise<number>;
}

export class DatabaseService implements DatabaseOperations {
  private readonly databaseType: 'memory' | 'vercel-postgres';
  private memoryDB: MemoryDatabase | null = null;

  constructor(databasePath: string = './quiz.db') {
    // Check if we're running in Vercel environment
    this.databaseType = process.env.POSTGRES_URL ? 'vercel-postgres' : 'memory';

    if (this.databaseType === 'memory') {
      console.log('Using singleton in-memory database for local development');
      this.memoryDB = MemoryDatabase.getInstance();
    } else {
      console.log('Using PostgreSQL database (Vercel)');
      // No initialization needed for Vercel Postgres
    }
  }

  public async initVercelPostgres(): Promise<void> {
    // Initialize tables in Vercel Postgres if they don't exist
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          earned_credits INTEGER DEFAULT 0,
          claimed_credits INTEGER DEFAULT 0
        )
      `;

      // Migration: Add columns if they don't exist
      await sql`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='earned_credits') THEN
                ALTER TABLE users ADD COLUMN earned_credits INTEGER DEFAULT 0;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='claimed_credits') THEN
                ALTER TABLE users ADD COLUMN claimed_credits INTEGER DEFAULT 0;
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

      // Migration: Add 'multiplier' column to 'session_scores' if it doesn't exist
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
    } catch (error) {
      console.error('Error initializing Vercel Postgres tables:', error);
      throw error;
    }
  }

  // Helper method to get database operations based on type
  private getDatabaseOperations() {
    if (this.databaseType === 'memory') {
      return {
        getUsersTable: () => this.memoryDB!.getTable('users'),
        getSessionScoresTable: () => this.memoryDB!.getTable('session_scores'),
        getMultipliersTable: () => this.memoryDB!.getTable('user_multipliers')
      };
    } else {
      return {
        getUsersTable: null,
        getSessionScoresTable: null,
        getMultipliersTable: null
      };
    }
  }

  // Helper method to handle PostgreSQL query results consistently
  private handlePostgresResult<T>(result: any): T {
    if (result.rows && result.rows.length > 0) {
      return result.rows[0] as T;
    }
    return null as T;
  }

  public async createUser(user: Omit<User, 'createdAt'>): Promise<User> {
    if (this.databaseType === 'memory') {
      const users = this.memoryDB!.getTable('users');

      // Check if user already exists by ID or username
      if (users.has(user.id)) {
        throw new Error('User already exists');
      }

      // Also check for duplicate username
      for (const existingUser of users.values()) {
        if (existingUser.username === user.username) {
          throw new Error('User already exists');
        }
      }

      // Create the user in memory
      const newUser = {
        id: user.id,
        username: user.username,
        passwordHash: user.passwordHash,
        createdAt: new Date(),
        earned_credits: 0,
        claimed_credits: 0
      };

      users.set(user.id, newUser);

      return newUser;
    } else {
      // Vercel Postgres implementation only
      try {
        await this.initVercelPostgres(); // Ensure tables exist

        const sqlClient = sql;

        await sqlClient`
          INSERT INTO users (id, username, password_hash)
          VALUES (${user.id}, ${user.username}, ${user.passwordHash})
        `;

        const result = await sqlClient`
          SELECT id, username, password_hash as "passwordHash", created_at as "createdAt", earned_credits, claimed_credits
          FROM users
          WHERE id = ${user.id}
        `;

        return this.handlePostgresResult<User>(result);
      } catch (error: any) {
        // Handle unique constraint violation for Postgres
        if (error.message.includes('duplicate key') || error.code === '23505') {
          throw new Error('User already exists');
        }
        throw error;
      }
    }
  }

  public async findUserByUsername(username: string): Promise<User | null> {
    if (this.databaseType === 'memory') {
      const users = this.memoryDB!.getTable('users');
      for (const user of users.values()) {
        if (user.username === username) {
          return user;
        }
      }
      return null;
    } else {
      // Vercel Postgres implementation only
      const sqlClient = sql;

      // Initialize tables if they don't exist (for PostgreSQL databases)
      await this.initVercelPostgres();

      const result = await sqlClient`
        SELECT id, username, password_hash as "passwordHash", created_at as "createdAt", earned_credits, claimed_credits
        FROM users
        WHERE username = ${username}
      `;

      return this.handlePostgresResult<User>(result);
    }
  }

  public async findUserById(userId: string): Promise<User | null> {
    if (this.databaseType === 'memory') {
      const users = this.memoryDB!.getTable('users');
      return users.get(userId) || null;
    } else {
      // Vercel Postgres implementation only
      const sqlClient = sql;

      const result = await sqlClient`
        SELECT id, username, password_hash as "passwordHash", created_at as "createdAt", earned_credits, claimed_credits
        FROM users
        WHERE id = ${userId}
      `;

      return this.handlePostgresResult<User>(result);
    }
  }

  public async saveSessionScore(
    userId: string,
    sessionId: string,
    score: number,
    total: number,
    sessionType: 'math' | 'simple_words',
    multiplier: number = 1.0
  ): Promise<void> {
    const scoreId = this.generateUUID();

    if (this.databaseType === 'memory') {
      // Create the session score in memory
      const sessionScores = this.memoryDB!.getTable('session_scores');
      const newScore = {
        id: scoreId,
        user_id: userId,
        session_id: sessionId,
        score: score,
        total: total,
        session_type: sessionType,
        multiplier: Math.floor(multiplier),
        completed_at: new Date()
      };

      sessionScores.set(scoreId, newScore);
    } else {
      // Vercel Postgres implementation only
      const sqlClient = sql;

      try {
        await sqlClient`
          INSERT INTO session_scores (id, user_id, session_id, score, total, session_type, multiplier)
          VALUES (${scoreId}, ${userId}, ${sessionId}, ${score}, ${total}, ${sessionType}, ${Math.floor(multiplier)})
        `;
      } catch (error: any) {
        throw error;
      }
    }
  }

  public async getSessionScore(sessionId: string): Promise<{ score: number, total: number, multiplier?: number } | null> {
    if (this.databaseType === 'memory') {
      const sessionScores = this.memoryDB!.getTable('session_scores');
      for (const score of sessionScores.values()) {
        if (score.session_id === sessionId) {
          return {
            score: score.score,
            total: score.total,
            multiplier: score.multiplier
          };
        }
      }
      return null;
    } else {
      // Vercel Postgres implementation only
      const sqlClient = sql;

      const result = await sqlClient`
        SELECT score, total, multiplier
        FROM session_scores
        WHERE session_id = ${sessionId}
      `;

      const postgresResult = this.handlePostgresResult<{ score: number, total: number, multiplier?: number }>(result);
      return postgresResult;
    }
  }

  public async getUserSessionScores(userId: string): Promise<Array<{ sessionId: string, score: number, total: number, sessionType: string, completedAt: Date, multiplier?: number }>> {
    if (this.databaseType === 'memory') {
      const sessionScores = this.memoryDB!.getTable('session_scores');
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

      // Sort by completed_at descending
      return userScores.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    } else {
      // Vercel Postgres implementation only
      const sqlClient = sql;

      const result = await sqlClient`
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
      const sessionScores = this.memoryDB!.getTable('session_scores');
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

      // Sort by completed_at descending
      return history.sort((a, b) => b.completed_at.getTime() - a.completed_at.getTime());
    } else {
      // Vercel Postgres implementation only
      const sqlClient = sql;

      const result = await sqlClient`
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

  // Simple UUID generator function
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  public async close(): Promise<void> {
    // In-memory database doesn't need explicit closing
    if (this.databaseType === 'memory') {
      // Nothing to do for in-memory db
    }
    // Vercel Postgres connections are managed automatically
  }

  public async setUserMultiplier(userId: string, quizType: string, multiplier: number): Promise<void> {
    if (this.databaseType === 'memory') {
      const multipliers = this.memoryDB!.getTable('user_multipliers');
      const key = `${userId}-${quizType}`;
      multipliers.set(key, Math.floor(multiplier)); // Store as integer
    } else {
      // Vercel Postgres implementation only
      const sqlClient = sql;

      try {
        await sqlClient`
          INSERT INTO user_multipliers (user_id, quiz_type, multiplier)
          VALUES (${userId}, ${quizType}, ${Math.floor(multiplier)})
          ON CONFLICT (user_id, quiz_type)
          DO UPDATE SET multiplier = EXCLUDED.multiplier
        `;
      } catch (error: any) {
        throw error;
      }
    }
  }

  public async getUserMultiplier(userId: string, quizType: string): Promise<number> {
    if (this.databaseType === 'memory') {
      const multipliers = this.memoryDB!.getTable('user_multipliers');
      const key = `${userId}-${quizType}`;
      return Math.floor(multipliers.get(key) || 1); // Default multiplier of 1 (integer)
    } else {
      // Vercel Postgres implementation only
      const sqlClient = sql;

      try {
        const result = await sqlClient`
          SELECT multiplier
          FROM user_multipliers
          WHERE user_id = ${userId} AND quiz_type = ${quizType}
        `;

        const postgresResult = this.handlePostgresResult<{ multiplier: number }>(result);
        if (postgresResult) {
          return Math.floor(postgresResult.multiplier);
        }
        return 1; // Default multiplier of 1 (integer)
      } catch (error: any) {
        throw error;
      }
    }
  }

  public async addEarnedCredits(userId: string, amount: number): Promise<void> {
    if (this.databaseType === 'memory') {
      const users = this.memoryDB!.getTable('users');
      const user = users.get(userId);
      if (user) {
        user.earned_credits = (user.earned_credits || 0) + amount;
      } else {
        throw new Error('User not found');
      }
    } else {
      try {
        const result = await sql`
          UPDATE users
          SET earned_credits = earned_credits + ${amount}
          WHERE id = ${userId}
        `;
        if (result.rowCount === 0) {
          throw new Error('User not found');
        }
      } catch (error: any) {
        throw error;
      }
    }
  }

  public async getEarnedCredits(userId: string): Promise<number> {
    if (this.databaseType === 'memory') {
      const users = this.memoryDB!.getTable('users');
      const user = users.get(userId);
      return user?.earned_credits || 0;
    } else {
      try {
        const result = await sql`
          SELECT earned_credits
          FROM users
          WHERE id = ${userId}
        `;
        const postgresResult = this.handlePostgresResult<{ earned_credits: number }>(result);
        if (postgresResult) {
          return postgresResult.earned_credits || 0;
        }
        return 0;
      } catch (error: any) {
        throw error;
      }
    }
  }

  public async addClaimedCredits(userId: string, amount: number): Promise<void> {
    if (this.databaseType === 'memory') {
      const users = this.memoryDB!.getTable('users');
      const user = users.get(userId);
      if (user) {
        user.claimed_credits = (user.claimed_credits || 0) + amount;
      } else {
        throw new Error('User not found');
      }
    } else {
      try {
        const result = await sql`
          UPDATE users
          SET claimed_credits = claimed_credits + ${amount}
          WHERE id = ${userId}
        `;
        if (result.rowCount === 0) {
          throw new Error('User not found');
        }
      } catch (error: any) {
        throw error;
      }
    }
  }

  public async getClaimedCredits(userId: string): Promise<number> {
    if (this.databaseType === 'memory') {
      const users = this.memoryDB!.getTable('users');
      const user = users.get(userId);
      return user?.claimed_credits || 0;
    } else {
      try {
        const result = await sql`
          SELECT claimed_credits
          FROM users
          WHERE id = ${userId}
        `;
        const postgresResult = this.handlePostgresResult<{ claimed_credits: number }>(result);
        if (postgresResult) {
          return postgresResult.claimed_credits || 0;
        }
        return 0;
      } catch (error: any) {
        throw error;
      }
    }
  }

  // Compatibility methods for existing code
  public async setUserClaim(userId: string, claimAmount: number): Promise<void> {
    await this.addClaimedCredits(userId, claimAmount - await this.getClaimedCredits(userId));
  }

  public async getUserClaim(userId: string): Promise<number> {
    return await this.getClaimedCredits(userId);
  }

  // Optional: Add a method to clear the in-memory database (useful for testing)
  public clearMemoryDatabase(): void {
    if (this.databaseType === 'memory') {
      this.memoryDB!.clear();
    }
  }
}