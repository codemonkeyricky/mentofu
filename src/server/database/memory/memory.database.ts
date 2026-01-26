import { User } from '../../auth/auth.types';
import { DatabaseOperations } from '../interface/database.interface';
import { PostgresDatabase } from '../postgres/postgres.database';

class MemoryDatabase {
  private static instance: MemoryDatabase;
  private db: Map<string, Map<string, any>>;
  private currentLock: Promise<any> | null = null;
  private pendingQueue: Array<() => Promise<any>> = [];

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
    if (!this.db.has('parent_children')) {
      const parentChildren = new Map();
      parentChildren.set('parent_children', new Map());
      this.db.set('parent_children', parentChildren);
    }
  }

  public getTable(tableName: string): Map<string, any> {
    if (!this.db.has(tableName)) this.db.set(tableName, new Map());
    return this.db.get(tableName)!;
  }

  public getChildrenByParent(parentId: string): Array<{ childId: string, childUsername: string }> {
    const outerMap = this.db.get('parent_children');
    if (!outerMap) return [];
    const innerMap = outerMap.get('parent_children');
    if (!innerMap) return [];
    const result: Array<{ childId: string, childUsername: string }> = [];
    for (const [childId, data] of innerMap.entries()) {
      if (data && data.parentId === parentId) {
        result.push({ childId, childUsername: data.childUsername });
      }
    }
    return result;
  }

  public createChildRelationship(parentId: string, childId: string, childUsername: string): void {
    let outerMap = this.db.get('parent_children');
    if (!outerMap) {
      outerMap = new Map();
      outerMap.set('parent_children', new Map());
      this.db.set('parent_children', outerMap);
    }
    let innerMap = outerMap.get('parent_children');
    if (!innerMap) {
      innerMap = new Map();
      outerMap.set('parent_children', innerMap);
    }
    innerMap.set(childId, { parentId, childUsername });
  }

  public removeChildRelationship(childId: string): void {
    const children = this.db.get('parent_children');
    const childrenMap = children?.get('parent_children');
    childrenMap?.delete(childId);
  }

  public updateChildUsername(childId: string, newUsername: string): void {
    const children = this.db.get('parent_children');
    const childrenMap = children?.get('parent_children');
    const entry = childrenMap?.get(childId);
    if (entry) {
      entry.childUsername = newUsername;
    }
  }

  public clear(): void {
    this.db.clear();
    this.init();
    this.currentLock = null;
    this.pendingQueue = [];
  }

  public async executeInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    // If there's no current lock, run immediately
    if (!this.currentLock) {
      this.currentLock = this.runTransaction(callback);
      return this.currentLock;
    }

    // Otherwise, queue the transaction and wait for previous to complete
    return new Promise<T>((resolve, reject) => {
      this.pendingQueue.push(async () => {
        try {
          const result = await callback();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async runTransaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      const result = await callback();
      return result;
    } finally {
      // Process next transaction in queue
      if (this.pendingQueue.length > 0) {
        const nextCallback = this.pendingQueue.shift()!;
        this.currentLock = this.runTransaction(nextCallback);
      } else {
        this.currentLock = null;
      }
    }
  }
}

export { MemoryDatabase };
