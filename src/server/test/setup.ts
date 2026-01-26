// Force memory database for tests - must be done BEFORE importing app
delete process.env.POSTGRES_URL;

import { DatabaseService } from '../database/interface/database.service';
import { authService } from '../auth/auth.service';
import { User } from '../auth/auth.types';

export async function setupTestEnvironment() {
  const memoryModule = require('../database/memory/memory.database');
  const MemoryDatabase = memoryModule.MemoryDatabase;
  MemoryDatabase.getInstance().clear();

  const dbService = new DatabaseService();

  const parentUsername = `parent${Date.now()}`;
  const foundParent = await dbService.findUserByUsername(parentUsername);
  const parentUser = foundParent || (await authService.register(parentUsername, 'admin2', true));

  return { dbService, parentUser };
}
