import { User } from '../../auth/auth.types';
import { DatabaseOperations } from '../interface/database.interface';
import { PostgresDatabase } from '../postgres/postgres.database';

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
    if (!this.db.has('sessions')) this.db.set('sessions', new Map());
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

export { MemoryDatabase };
