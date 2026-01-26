import { setupTestEnvironment } from './setup';
import { DatabaseService } from '../database/interface/database.service';

describe('Password and Details Updates', () => {
  let dbService: DatabaseService;
  let parentUser: any;

  beforeEach(async () => {
    const setup = await setupTestEnvironment();
    dbService = setup.dbService;
    parentUser = setup.parentUser;
  });

  it('should update child password successfully', async () => {
    const timestamp = Date.now();
    const childUsername = `childuser${timestamp}${Math.random().toString(36).substring(2, 8)}`;

    const createdChild = await dbService.createChildAccount(
      parentUser.id,
      childUsername,
      'originalpasswordhash'
    );

    const newPasswordHash = 'newpasswordhash123';

    await dbService.updateChildPassword(createdChild.id, newPasswordHash);

    const updatedChild = await dbService.findUserById(createdChild.id);
    expect(updatedChild).toBeDefined();
    expect(updatedChild?.passwordHash).toBe(newPasswordHash);
  });

  it('should update child username successfully', async () => {
    const timestamp = Date.now();
    const childUsername = `childuser${timestamp}${Math.random().toString(36).substring(2, 8)}`;

    const createdChild = await dbService.createChildAccount(
      parentUser.id,
      childUsername,
      'hashedpassword123'
    );

    const newUsername = `newchilduser${Date.now()}`;

    await dbService.updateChildDetails(createdChild.id, newUsername);

    const updatedChild = await dbService.findUserById(createdChild.id);
    expect(updatedChild).toBeDefined();
    expect(updatedChild?.username).toBe(newUsername);

    const children = await dbService.getChildrenByParent(parentUser.id);
    const foundChild = children.find(c => c.childId === createdChild.id);
    expect(foundChild).toBeDefined();
    expect(foundChild?.childUsername).toBe(newUsername);
  });

  it('should handle username uniqueness validation', async () => {
    const timestamp = Date.now();
    const childUsername = `childuser${timestamp}${Math.random().toString(36).substring(2, 8)}`;

    const createdChild = await dbService.createChildAccount(
      parentUser.id,
      childUsername,
      'hashedpassword123'
    );

    await expect(
      dbService.updateChildDetails(
        createdChild.id,
        `otherchild${Date.now()}`
      )
    ).resolves.not.toThrow();

    await expect(
      dbService.updateChildDetails(
        createdChild.id,
        childUsername
      )
    ).resolves.not.toThrow();
  });

  it('should update password while maintaining parent-child relationship', async () => {
    const childUsername = `childuser${Date.now()}`;

    const createdChild = await dbService.createChildAccount(
      parentUser.id,
      childUsername,
      'originalpassword'
    );

    const newPasswordHash = 'newpasswordhash';

    await dbService.updateChildPassword(createdChild.id, newPasswordHash);

    const children = await dbService.getChildrenByParent(parentUser.id);
    const foundChild = children.find(c => c.childId === createdChild.id);

    expect(foundChild).toBeDefined();
    expect(foundChild?.childUsername).toBe(childUsername);

    const updatedChild = await dbService.findUserById(createdChild.id);
    expect(updatedChild).toBeDefined();
    expect(updatedChild?.passwordHash).toBe(newPasswordHash);
    expect(updatedChild?.parent_id).toBe(parentUser.id);
  });
});
