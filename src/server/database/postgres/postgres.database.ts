import { User } from '../../auth/auth.types';
import { sql } from '@vercel/postgres';
import { DatabaseOperations } from '../interface/database.interface';

export class PostgresDatabase implements DatabaseOperations {
  private readonly databaseType: 'vercel-postgres' = 'vercel-postgres';

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
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          quiz_type TEXT NOT NULL,
          questions JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `;

      await sql`CREATE INDEX IF NOT EXISTS idx_sessions_id_completed ON sessions(id, completed)`;

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

  public async findUserByUsername(username: string): Promise<User | null> {
    await this.initVercelPostgres();
    const result = await sql`
      SELECT id, username, password_hash as "passwordHash", created_at as "createdAt", earned_credits, claimed_credits, is_admin as "isParent"
      FROM users WHERE username = ${username}
    `;
    return this.handlePostgresResult<User>(result);
  }

  public async findUserById(userId: string): Promise<User | null> {
    await this.initVercelPostgres();
    const result = await sql`
      SELECT id, username, password_hash as "passwordHash", created_at as "createdAt", earned_credits, claimed_credits, is_admin as "isParent"
      FROM users WHERE id = ${userId}
    `;
    return this.handlePostgresResult<User>(result);
  }

  public async saveSession(session: any, quizType: string): Promise<void> {
    await this.initVercelPostgres();
    const isSimpleWords = 'words' in session;
    const questions = isSimpleWords ? { words: session.words } : { questions: session.questions };

    await sql`
      INSERT INTO sessions (id, user_id, quiz_type, questions, created_at, completed)
      VALUES (${session.id}, ${session.userId}, ${quizType}, ${JSON.stringify(questions)}::jsonb, ${session.createdAt}, FALSE)
    `;
  }

  public async getSession(sessionId: string): Promise<any | null> {
    try {
      await this.initVercelPostgres();
      const result = await sql`
        SELECT id, user_id as "userId", quiz_type as "quizType", questions, created_at as "createdAt", completed
        FROM sessions WHERE id = ${sessionId} AND completed = FALSE
      `;

      if (!result.rows.length) return null;

      const row = result.rows[0];
      const questionsData = row.questions;

      if (row.quizType === 'simple-words') {
        return {
          id: row.id,
          userId: row.userId,
          words: questionsData.words,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.createdAt)
        };
      } else {
        return {
          id: row.id,
          userId: row.userId,
          questions: questionsData.questions,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.createdAt)
        };
      }
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    await this.initVercelPostgres();
    await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
  }

  public async markSessionAsCompleted(sessionId: string, score: number, total: number, multiplier: number): Promise<void> {
    await this.initVercelPostgres();
    // Atomically mark session as completed and get its data
    const sessionResult = await sql`
      UPDATE sessions
      SET completed = TRUE
      WHERE id = ${sessionId} AND completed = FALSE
      RETURNING user_id, quiz_type
    `;

    if (!sessionResult.rows.length) {
      // Session not found or already completed
      throw new Error('Session not found or already completed');
    }

    const session = sessionResult.rows[0];

    // Create score record
    const scoreId = this.generateUUID();
    await sql`
      INSERT INTO session_scores (id, user_id, session_id, score, total, session_type, multiplier)
      VALUES (${scoreId}, ${session.user_id}, ${sessionId}, ${score}, ${total}, ${session.quiz_type}, ${multiplier})
    `;
  }

  public async saveSessionScore(userId: string, sessionId: string, score: number, total: number, sessionType: string, multiplier: number = 1.0): Promise<void> {
    await this.initVercelPostgres();
    const scoreId = this.generateUUID();
    await sql`
      INSERT INTO session_scores (id, user_id, session_id, score, total, session_type, multiplier)
      VALUES (${scoreId}, ${userId}, ${sessionId}, ${score}, ${total}, ${sessionType}, ${multiplier})
    `;
  }

  public async getSessionScore(sessionId: string): Promise<{ score: number, total: number, multiplier?: number } | null> {
    await this.initVercelPostgres();
    const result = await sql`
      SELECT score, total, multiplier FROM session_scores WHERE session_id = ${sessionId}
    `;
    return this.handlePostgresResult<{ score: number, total: number, multiplier?: number }>(result);
  }

  public async getUserSessionScores(userId: string): Promise<Array<{ sessionId: string, score: number, total: number, sessionType: string, completedAt: Date, multiplier?: number }>> {
    await this.initVercelPostgres();
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

  public async getUserSessionHistory(userId: string): Promise<any[]> {
    await this.initVercelPostgres();
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

  public async setUserMultiplier(userId: string, quizType: string, multiplier: number): Promise<void> {
    await this.initVercelPostgres();
    await sql`
      INSERT INTO user_multipliers (user_id, quiz_type, multiplier)
      VALUES (${userId}, ${quizType}, ${multiplier})
      ON CONFLICT (user_id, quiz_type)
      DO UPDATE SET multiplier = EXCLUDED.multiplier
    `;
  }

  public async getUserMultiplier(userId: string, quizType: string): Promise<number> {
    await this.initVercelPostgres();
    try {
      const result = await sql`
        SELECT multiplier FROM user_multipliers WHERE user_id = ${userId} AND quiz_type = ${quizType}
      `;
      const postgresResult = this.handlePostgresResult<{ multiplier: number }>(result);
      if (postgresResult) return postgresResult.multiplier;

      const category = quizType === 'simple-words' ? 'simple_words' : quizType.startsWith('simple-math') ? 'math' : quizType;
      const categoryResult = await sql`
        SELECT multiplier FROM user_multipliers WHERE user_id = ${userId} AND quiz_type = ${category}
      `;
      const categoryPostgresResult = this.handlePostgresResult<{ multiplier: number }>(categoryResult);
      if (categoryPostgresResult) return categoryPostgresResult.multiplier;

      return 1;
    } catch (error: any) {
      throw error;
    }
  }

  public async addEarnedCredits(userId: string, amount: number): Promise<void> {
    await this.initVercelPostgres();
    const result = await sql`UPDATE users SET earned_credits = earned_credits + ${amount} WHERE id = ${userId}`;
    if (result.rowCount === 0) throw new Error('User not found');
  }

  public async getEarnedCredits(userId: string): Promise<number> {
    await this.initVercelPostgres();
    const result = await sql`SELECT earned_credits FROM users WHERE id = ${userId}`;
    const postgresResult = this.handlePostgresResult<{ earned_credits: number }>(result);
    return postgresResult?.earned_credits || 0;
  }

  public async addClaimedCredits(userId: string, amount: number): Promise<void> {
    await this.initVercelPostgres();
    const result = await sql`UPDATE users SET claimed_credits = claimed_credits + ${amount} WHERE id = ${userId}`;
    if (result.rowCount === 0) throw new Error('User not found');
  }

  public async getClaimedCredits(userId: string): Promise<number> {
    await this.initVercelPostgres();
    const result = await sql`SELECT claimed_credits FROM users WHERE id = ${userId}`;
    const postgresResult = this.handlePostgresResult<{ claimed_credits: number }>(result);
    return postgresResult?.claimed_credits || 0;
  }

  public async getAllUsers(): Promise<User[]> {
    await this.initVercelPostgres();
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

  public async close(): Promise<void> {}
}
