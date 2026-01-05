import { User } from '../auth/auth.types';

// Import Vercel Postgres for cloud deployment
import { sql } from '@vercel/postgres';

export class DatabaseService {
  private db: any;
  private readonly databasePath: string;

  // Store database type for runtime decision making
  private readonly databaseType: 'memory' | 'vercel-postgres';

  constructor(databasePath: string = './quiz.db') {
    this.databasePath = databasePath;

    // Check if we're running in Vercel environment
    // Use POSTGRES_URL as the indicator for Vercel Postgres
    this.databaseType = process.env.POSTGRES_URL ? 'vercel-postgres' : 'memory';

    // Initialize the appropriate database
    if (this.databaseType === 'memory') {
      console.log('Using in-memory database for local development');
      this.db = new Map();
      this.initMemoryDB();
    } else {
      console.log('Using PostgreSQL database (Vercel)');
      // No initialization needed for Vercel Postgres
      this.db = null;
    }
  }

  private initMemoryDB(): void {
    // Initialize in-memory tables as Maps
    if (!this.db.has('users')) {
      this.db.set('users', new Map());
    }
    if (!this.db.has('session_scores')) {
      this.db.set('session_scores', new Map());
    }
  }

  private async initVercelPostgres(): Promise<void> {
    // Initialize tables in Vercel Postgres if they don't exist
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS session_scores (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          score INTEGER NOT NULL,
          total INTEGER NOT NULL,
          session_type TEXT NOT NULL,
          completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `;
    } catch (error) {
      console.error('Error initializing Vercel Postgres tables:', error);
      throw error;
    }
  }

  public async createUser(user: Omit<User, 'createdAt'>): Promise<User> {
    if (this.databaseType === 'memory') {
      // Check if user already exists by ID or username
      const users = this.db.get('users');
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
        createdAt: new Date()
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
          SELECT id, username, password_hash as "passwordHash", created_at as "createdAt"
          FROM users
          WHERE id = ${user.id}
        `;

        // Handle return type from Vercel Postgres
        const queryResult = result as any;
        if (!queryResult.rows || queryResult.rows.length === 0) {
          throw new Error('Failed to create user');
        }
        return queryResult.rows[0] as User;
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
      const users = this.db.get('users');
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
        SELECT id, username, password_hash as "passwordHash", created_at as "createdAt"
        FROM users
        WHERE username = ${username}
      `;

      // Handle return type from Vercel Postgres
      const queryResult = result as any;
      return queryResult.rows && queryResult.rows.length > 0 ? (queryResult.rows[0] as User) : null;
    }
  }

  public async findUserById(userId: string): Promise<User | null> {
    if (this.databaseType === 'memory') {
      const users = this.db.get('users');
      return users.get(userId) || null;
    } else {
      // Vercel Postgres implementation only
      const sqlClient = sql;

      const result = await sqlClient`
        SELECT id, username, password_hash as "passwordHash", created_at as "createdAt"
        FROM users
        WHERE id = ${userId}
      `;

      // Handle return type from Vercel Postgres
      const queryResult = result as any;
      return queryResult.rows && queryResult.rows.length > 0 ? (queryResult.rows[0] as User) : null;
    }
  }

  public async saveSessionScore(
    userId: string,
    sessionId: string,
    score: number,
    total: number,
    sessionType: 'math' | 'simple_words'
  ): Promise<void> {
    const scoreId = this.generateUUID();

    if (this.databaseType === 'memory') {
      // Create the session score in memory
      const sessionScores = this.db.get('session_scores');
      const newScore = {
        id: scoreId,
        user_id: userId,
        session_id: sessionId,
        score: score,
        total: total,
        session_type: sessionType,
        completed_at: new Date()
      };

      sessionScores.set(scoreId, newScore);
    } else {
      // Vercel Postgres implementation only
      const sqlClient = sql;

      try {
        await sqlClient`
          INSERT INTO session_scores (id, user_id, session_id, score, total, session_type)
          VALUES (${scoreId}, ${userId}, ${sessionId}, ${score}, ${total}, ${sessionType})
        `;
      } catch (error: any) {
        throw error;
      }
    }
  }

  public async getSessionScore(sessionId: string): Promise<{ score: number, total: number } | null> {
    if (this.databaseType === 'memory') {
      const sessionScores = this.db.get('session_scores');
      for (const score of sessionScores.values()) {
        if (score.session_id === sessionId) {
          return {
            score: score.score,
            total: score.total
          };
        }
      }
      return null;
    } else {
      // Vercel Postgres implementation only
      const sqlClient = sql;

      const result = await sqlClient`
        SELECT score, total
        FROM session_scores
        WHERE session_id = ${sessionId}
      `;

      // Handle return type from Vercel Postgres
      const queryResult = result as any;
      if (queryResult.rows && queryResult.rows.length === 0) {
        return null;
      }

      return {
        score: queryResult.rows[0].score,
        total: queryResult.rows[0].total
      };
    }
  }

  public async getUserSessionScores(userId: string): Promise<Array<{ sessionId: string, score: number, total: number, sessionType: string, completedAt: Date }>> {
    if (this.databaseType === 'memory') {
      const sessionScores = this.db.get('session_scores');
      const userScores: Array<{ sessionId: string, score: number, total: number, sessionType: string, completedAt: Date }> = [];

      for (const score of sessionScores.values()) {
        if (score.user_id === userId) {
          userScores.push({
            sessionId: score.session_id,
            score: score.score,
            total: score.total,
            sessionType: score.session_type,
            completedAt: score.completed_at
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
          completed_at as "completedAt"
        FROM session_scores
        WHERE user_id = ${userId}
        ORDER BY completed_at DESC
      `;

      // Handle return type from Vercel Postgres
      const queryResult = result as any;
      return queryResult.rows.map((row: any) => ({
        sessionId: row.sessionId,
        score: row.score,
        total: row.total,
        sessionType: row.sessionType,
        completedAt: new Date(row.completedAt)
      }));
    }
  }

  public async getUserSessionHistory(userId: string): Promise<any[]> {
    if (this.databaseType === 'memory') {
      const sessionScores = this.db.get('session_scores');
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

      // Handle return type from Vercel Postgres
      const queryResult = result as any;
      return queryResult.rows;
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
}
