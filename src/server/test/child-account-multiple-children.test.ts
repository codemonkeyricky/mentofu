// Force memory database for tests - must be done BEFORE importing app
delete process.env.POSTGRES_URL;

import { DatabaseService } from '../database/interface/database.service';
import { authService } from '../auth/auth.service';
import { User } from '../auth/auth.types';

describe('Multiple Children for Same Parent', () => {
  let dbService: DatabaseService;
  let parentUser: User;

  beforeEach(async () => {
    // Clear the singleton in-memory database before each test to ensure isolation
    const memoryModule = require('../database/memory/memory.database');
    const MemoryDatabase = memoryModule.MemoryDatabase;
    MemoryDatabase.getInstance().clear();

    // Create new DatabaseService instance for the test
    dbService = new DatabaseService();

    // Use unique parent user for testing to prevent conflicts
    const parentUsername = `parent${Date.now()}`;
    const foundParent = await dbService.findUserByUsername(parentUsername);
    parentUser = foundParent || (await authService.register(parentUsername, 'admin2', true));
  });

  it('should handle multiple children and list all correctly', async () => {
    // Use truly unique identifiers to avoid collisions
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);

    const childUsernames = [
      `childuser1${timestamp}a${randomSuffix}`,
      `childuser2${timestamp}b${randomSuffix}`,
      `childuser3${timestamp}c${randomSuffix}`
    ];

    let child1: User | undefined;
    let child2: User | undefined;
    let child3: User | undefined;

    try {
      child1 = await dbService.createChildAccount(
        parentUser.id,
        childUsernames[0],
        'hashedpassword123'
      );
    } catch (error) {
      console.error(`Failed to create child1 with username: ${childUsernames[0]}`, error);
      throw error;
    }

    try {
      child2 = await dbService.createChildAccount(
        parentUser.id,
        childUsernames[1],
        'hashedpassword456'
      );
    } catch (error) {
      console.error(`Failed to create child2 with username: ${childUsernames[1]}`, error);
      throw error;
    }

    try {
      child3 = await dbService.createChildAccount(
        parentUser.id,
        childUsernames[2],
        'hashedpassword789'
      );
    } catch (error) {
      console.error(`Failed to create child3 with username: ${childUsernames[2]}`, error);
      throw error;
    }

    const children = await dbService.getChildrenByParent(parentUser.id);

    expect(children).toBeDefined();
    expect(Array.isArray(children)).toBe(true);
    expect(children.length).toBe(3);

    const childIds = children.map(c => c.childId).sort();
    const createdIds = [child1, child2, child3].filter((c): c is User => c !== undefined);
    const expectedChildIds = createdIds.map(c => c.id).sort();

    expect(childIds).toEqual(expectedChildIds);

    const childUsernamesList = children.map(c => c.childUsername).sort();
    const expectedUsernames = childUsernames.sort();

    expect(childUsernamesList).toEqual(expectedUsernames);
  });

  it('should maintain data integrity across multiple operations', async () => {
    const timestamp = Date.now();
    const childUsername = `childuser${timestamp}${Math.random().toString(36).substring(2, 8)}`;

    const createdChild = await dbService.createChildAccount(
      parentUser.id,
      childUsername,
      'originalpassword'
    );

    const childrenBeforeUpdate = await dbService.getChildrenByParent(parentUser.id);
    expect(childrenBeforeUpdate.length).toBe(1);

    const newUsername = `updatedchild${Date.now()}`;
    const updatedChild = await dbService.updateChildDetails(
      createdChild.id,
      newUsername
    );

    const childrenAfterUpdate = await dbService.getChildrenByParent(parentUser.id);
    expect(childrenAfterUpdate.length).toBe(1);

    const foundChild = childrenAfterUpdate.find(c => c.childId === createdChild.id);
    expect(foundChild).toBeDefined();
    expect(foundChild?.childUsername).toBe(newUsername);
  });
});
