import { setupTestEnvironment } from './setup';
import { DatabaseService } from '../database/interface/database.service';

describe('Child Account Creation and Parent-Child Association', () => {
  let dbService: DatabaseService;
  let parentUser: any;

  beforeEach(async () => {
    const setup = await setupTestEnvironment();
    dbService = setup.dbService;
    parentUser = setup.parentUser;
  });

  it('should create child account and establish parent-child association', async () => {
    const timestamp = Date.now();
    const childUsername = `childuser1${timestamp}${Math.random().toString(36).substring(2, 8)}`;

    const createdChild = await dbService.createChildAccount(
      parentUser.id,
      childUsername,
      'hashedpassword123'
    );

    expect(createdChild).toBeDefined();
    expect(createdChild).toHaveProperty('username', childUsername);
    expect(createdChild).toHaveProperty('isParent', false);
    expect(createdChild).toHaveProperty('earned_credits', 0);
    expect(createdChild).toHaveProperty('claimed_credits', 0);

    const retrievedChild = await dbService.findUserById(createdChild.id);
    expect(retrievedChild).toBeDefined();
    expect(retrievedChild?.id).toBe(createdChild.id);
    expect(retrievedChild?.username).toBe(childUsername);
    expect(retrievedChild?.isParent).toBe(false);
    expect(retrievedChild?.parent_id).toBe(parentUser.id);
  });

  it('should create multiple child accounts for the same parent', async () => {
    const timestamp = Date.now();
    const childUsernames = [
      `childuser1${timestamp}${Math.random().toString(36).substring(2, 8)}`,
      `childuser2${timestamp}${Math.random().toString(36).substring(2, 8)}`
    ];

    const child1 = await dbService.createChildAccount(
      parentUser.id,
      childUsernames[0],
      'hashedpassword123'
    );

    const child2 = await dbService.createChildAccount(
      parentUser.id,
      childUsernames[1],
      'hashedpassword456'
    );

    expect(child1).toBeDefined();
    expect(child2).toBeDefined();
    expect(child1?.username).toBe(childUsernames[0]);
    expect(child2?.username).toBe(childUsernames[1]);
    expect(child1?.id).not.toBe(child2?.id);
    expect(child1?.parent_id).toBe(parentUser.id);
    expect(child2?.parent_id).toBe(parentUser.id);
  });

  it('should verify parent-child association via getChildrenByParent', async () => {
    const timestamp = Date.now();
    const childUsername = `childuser${timestamp}${Math.random().toString(36).substring(2, 8)}`;

    const createdChild = await dbService.createChildAccount(
      parentUser.id,
      childUsername,
      'hashedpassword123'
    );

    const children = await dbService.getChildrenByParent(parentUser.id);

    expect(children).toBeDefined();
    expect(Array.isArray(children)).toBe(true);
    expect(children.length).toBeGreaterThanOrEqual(1);

    const foundChild = children.find(c => c.childId === createdChild.id);
    expect(foundChild).toBeDefined();
    expect(foundChild?.childId).toBe(createdChild.id);
    expect(foundChild?.childUsername).toBe(childUsername);
  });
});
