import * as sqlite from 'better-sqlite3';
import { User } from '../auth/auth.types';

export class DatabaseService {
  private db: any; // Using 'any' to avoid TypeScript compilation issues
  private readonly databasePath: string;

  constructor(databasePath: string = './quiz.db') {
    this.databasePath = databasePath;
    this.db = new sqlite.default(this.databasePath);
    this.init();
  }

  private init(): void {
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

  public async createUser(user: Omit<User, 'createdAt'>): Promise<User> {
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
  }

  public async findUserByUsername(username: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT id, username, password_hash as passwordHash, created_at as createdAt FROM users WHERE username = ?');
    const user = stmt.get(username) as User | undefined;
    return user || null;
  }

  public async findUserById(userId: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT id, username, password_hash as passwordHash, created_at as createdAt FROM users WHERE id = ?');
    const user = stmt.get(userId) as User | undefined;
    return user || null;
  }

  public async saveSessionScore(
    userId: string,
    sessionId: string,
    score: number,
    total: number,
    sessionType: 'math' | 'simple_words'
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO session_scores (id, user_id, session_id, score, total, session_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const scoreId = this.generateUUID();
    try {
      stmt.run(scoreId, userId, sessionId, score, total, sessionType);
    } catch (error: any) {
      throw error;
    }
  }

  public async getSessionScore(sessionId: string): Promise<{ score: number, total: number } | null> {
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
  }

  public async getUserSessionScores(userId: string): Promise<Array<{ sessionId: string, score: number, total: number, sessionType: string, completedAt: Date }>> {
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
  }

  public async getUserSessionHistory(userId: string): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT id, user_id, session_id, score, total, session_type, completed_at
      FROM session_scores
      WHERE user_id = ?
      ORDER BY completed_at DESC
    `);

    return stmt.all(userId) as any[];
  }

  // Simple UUID generator function
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  public close(): void {
    this.db.close();
  }
}