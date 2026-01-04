import * as sqlite from 'better-sqlite3';
import { User } from '../auth/auth.types';

// Import Vercel Postgres for cloud deployment
import { sql } from '@vercel/postgres';
// Import NeonDatabase for serverless PostgreSQL
import { neon } from '@neondatabase/serverless';

export class DatabaseService {
  private db: any;
  private readonly databasePath: string;
  private readonly isVercel: boolean;
  private readonly isNeon: boolean;

  // Store database type for runtime decision making
  private readonly databaseType: 'sqlite' | 'vercel-postgres' | 'neon';

  constructor(databasePath: string = './quiz.db') {
    this.databasePath = databasePath;

    // Check if we're running in Vercel environment or Neon environment
    // Use POSTGRES_URL as the indicator for Vercel Postgres and Neon
    this.isVercel = !!process.env.VERCEL;
    this.isNeon = !!process.env.DATABASE_URL && !this.isVercel;

    if (this.isVercel) {
      this.databaseType = 'vercel-postgres';
    } else if (this.isNeon) {
      this.databaseType = 'neon';
    } else {
      this.databaseType = 'sqlite';
    }

    // Initialize the appropriate database
    if (this.databaseType === 'sqlite') {
      console.log('Using SQLite database for local development');
      this.db = new sqlite.default(this.databasePath);
      this.initSQLite();
    } else {
      console.log('Using PostgreSQL database (Vercel or Neon)');
      // No initialization needed for Vercel Postgres or Neon
      this.db = null;
    }
  }

  private async initSQLite(): Promise<void> {
    // Create users table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create session_scores table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_scores (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        session_type TEXT NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
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

  private async initNeon(): Promise<void> {
    // Initialize tables in Neon if they don't exist
    try {
      const sql = neon(process.env.DATABASE_URL!);

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
      console.error('Error initializing Neon tables:', error);
      throw error;
    }
  }

  public async createUser(user: Omit<User, 'createdAt'>): Promise<User> {
    if (this.databaseType === 'sqlite') {
      const stmt = this.db.prepare(`
        INSERT INTO users (id, username, password_hash)
        VALUES (?, ?, ?)
      `);

      try {
        stmt.run(user.id, user.username, user.passwordHash);
      } catch (error: any) {
        // Re-throw SQLite constraint errors
        if (error.message.includes('UNIQUE constraint failed') || error.message.includes('UNIQUE')) {
          throw new Error('User already exists');
        }
        throw error;
      }

      // Retrieve the created user with proper column mapping
      const getUserStmt = this.db.prepare('SELECT id, username, password_hash as passwordHash, created_at as createdAt FROM users WHERE id = ?');
      const createdUser = getUserStmt.get(user.id) as User;
      return createdUser;
    } else {
      // Vercel Postgres or Neon implementation
      try {
        if (this.databaseType === 'vercel-postgres') {
          await this.initVercelPostgres(); // Ensure tables exist
        } else {
          await this.initNeon(); // Ensure tables exist for Neon
        }

        const sqlClient = this.databaseType === 'vercel-postgres' ? sql : neon(process.env.DATABASE_URL!);

        await sqlClient`
          INSERT INTO users (id, username, password_hash)
          VALUES (${user.id}, ${user.username}, ${user.passwordHash})
        `;

        const result = await sqlClient`
          SELECT id, username, password_hash as "passwordHash", created_at as "createdAt"
          FROM users
          WHERE id = ${user.id}
        `;

        // Handle different return types from Vercel Postgres vs Neon
        if (this.databaseType === 'vercel-postgres') {
          const queryResult = result as any;
          if (!queryResult.rows || queryResult.rows.length === 0) {
            throw new Error('Failed to create user');
          }
          return queryResult.rows[0] as User;
        } else {
          // For Neon, result is an array of rows
          const neonResult = result as any[];
          if (neonResult.length === 0) {
            throw new Error('Failed to create user');
          }
          return neonResult[0] as User;
        }
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
    if (this.databaseType === 'sqlite') {
      const stmt = this.db.prepare('SELECT id, username, password_hash as passwordHash, created_at as createdAt FROM users WHERE username = ?');
      const user = stmt.get(username) as User | undefined;
      return user || null;
    } else {
      // Vercel Postgres or Neon implementation
      const sqlClient = this.databaseType === 'vercel-postgres' ? sql : neon(process.env.DATABASE_URL!);

      const result = await sqlClient`
        SELECT id, username, password_hash as "passwordHash", created_at as "createdAt"
        FROM users
        WHERE username = ${username}
      `;

      // Handle different return types from Vercel Postgres vs Neon
      if (this.databaseType === 'vercel-postgres') {
        const queryResult = result as any;
        return queryResult.rows && queryResult.rows.length > 0 ? (queryResult.rows[0] as User) : null;
      } else {
        // For Neon, result is an array of rows
        const neonResult = result as any[];
        return neonResult.length > 0 ? (neonResult[0] as User) : null;
      }
    }
  }

  public async findUserById(userId: string): Promise<User | null> {
    if (this.databaseType === 'sqlite') {
      const stmt = this.db.prepare('SELECT id, username, password_hash as passwordHash, created_at as createdAt FROM users WHERE id = ?');
      const user = stmt.get(userId) as User | undefined;
      return user || null;
    } else {
      // Vercel Postgres or Neon implementation
      const sqlClient = this.databaseType === 'vercel-postgres' ? sql : neon(process.env.DATABASE_URL!);

      const result = await sqlClient`
        SELECT id, username, password_hash as "passwordHash", created_at as "createdAt"
        FROM users
        WHERE id = ${userId}
      `;

      // Handle different return types from Vercel Postgres vs Neon
      if (this.databaseType === 'vercel-postgres') {
        const queryResult = result as any;
        return queryResult.rows && queryResult.rows.length > 0 ? (queryResult.rows[0] as User) : null;
      } else {
        // For Neon, result is an array of rows
        const neonResult = result as any[];
        return neonResult.length > 0 ? (neonResult[0] as User) : null;
      }
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

    if (this.databaseType === 'sqlite') {
      const stmt = this.db.prepare(`
        INSERT INTO session_scores (id, user_id, session_id, score, total, session_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      try {
        stmt.run(scoreId, userId, sessionId, score, total, sessionType);
      } catch (error: any) {
        throw error;
      }
    } else {
      // Vercel Postgres or Neon implementation
      const sqlClient = this.databaseType === 'vercel-postgres' ? sql : neon(process.env.DATABASE_URL!);

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
    if (this.databaseType === 'sqlite') {
      const stmt = this.db.prepare(`
        SELECT score, total
        FROM session_scores
        WHERE session_id = ?
      `);

      const result = stmt.get(sessionId);

      if (!result) {
        return null;
      }

      return {
        score: result.score,
        total: result.total
      };
    } else {
      // Vercel Postgres or Neon implementation
      const sqlClient = this.databaseType === 'vercel-postgres' ? sql : neon(process.env.DATABASE_URL!);

      const result = await sqlClient`
        SELECT score, total
        FROM session_scores
        WHERE session_id = ${sessionId}
      `;

      // Handle different return types from Vercel Postgres vs Neon
      if (this.databaseType === 'vercel-postgres') {
        const queryResult = result as any;
        if (queryResult.rows && queryResult.rows.length === 0) {
          return null;
        }

        return {
          score: queryResult.rows[0].score,
          total: queryResult.rows[0].total
        };
      } else {
        // For Neon, result is an array of rows
        const neonResult = result as any[];
        if (neonResult.length === 0) {
          return null;
        }

        return {
          score: neonResult[0].score,
          total: neonResult[0].total
        };
      }
    }
  }

  public async getUserSessionScores(userId: string): Promise<Array<{ sessionId: string, score: number, total: number, sessionType: string, completedAt: Date }>> {
    if (this.databaseType === 'sqlite') {
      const stmt = this.db.prepare(`
        SELECT session_id, score, total, session_type, completed_at
        FROM session_scores
        WHERE user_id = ?
        ORDER BY completed_at DESC
      `);

      const results = stmt.all(userId) as any[];

      return results.map(row => ({
        sessionId: row.session_id,
        score: row.score,
        total: row.total,
        sessionType: row.session_type,
        completedAt: new Date(row.completed_at)
      }));
    } else {
      // Vercel Postgres or Neon implementation
      const sqlClient = this.databaseType === 'vercel-postgres' ? sql : neon(process.env.DATABASE_URL!);

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

      // Handle different return types from Vercel Postgres vs Neon
      if (this.databaseType === 'vercel-postgres') {
        const queryResult = result as any;
        return queryResult.rows.map((row: any) => ({
          sessionId: row.sessionId,
          score: row.score,
          total: row.total,
          sessionType: row.sessionType,
          completedAt: new Date(row.completedAt)
        }));
      } else {
        // For Neon, result is an array of rows
        const neonResult = result as any[];
        return neonResult.map((row: any) => ({
          sessionId: row.sessionId,
          score: row.score,
          total: row.total,
          sessionType: row.sessionType,
          completedAt: new Date(row.completedAt)
        }));
      }
    }
  }

  public async getUserSessionHistory(userId: string): Promise<any[]> {
    if (this.databaseType === 'sqlite') {
      const stmt = this.db.prepare(`
        SELECT id, user_id, session_id, score, total, session_type, completed_at
        FROM session_scores
        WHERE user_id = ?
        ORDER BY completed_at DESC
      `);

      return stmt.all(userId) as any[];
    } else {
      // Vercel Postgres or Neon implementation
      const sqlClient = this.databaseType === 'vercel-postgres' ? sql : neon(process.env.DATABASE_URL!);

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

      // Handle different return types from Vercel Postgres vs Neon
      if (this.databaseType === 'vercel-postgres') {
        const queryResult = result as any;
        return queryResult.rows;
      } else {
        // For Neon, result is an array of rows
        return result as any[];
      }
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
    if (this.databaseType === 'sqlite') {
      this.db.close();
    }
    // Vercel Postgres and Neon connections are managed automatically
  }
}
