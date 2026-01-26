import { setupTestEnvironment } from './setup';
import { DatabaseService } from '../database/interface/database.service';

describe('Error Handling', () => {
  let dbService: DatabaseService;
  let parentUser: any;

  beforeEach(async () => {
    const setup = await setupTestEnvironment();
    dbService = setup.dbService;
    parentUser = setup.parentUser;
  });

  it('should handle creation of child for non-existent parent gracefully', async () => {
    const nonExistentParentId = 'non-existent-parent-id';
    const timestamp = Date.now();
    const childUsername = `childuser${timestamp}${Math.random().toString(36).substring(2, 8)}`;

    await expect(
      dbService.createChildAccount(nonExistentParentId, childUsername, 'hashedpassword123')
    ).rejects.toThrow('Parent user not found');
  });

  it('should handle updates for non-existent child', async () => {
    const nonExistentChildId = 'non-existent-child-id';

    await expect(
      dbService.updateChildPassword(nonExistentChildId, 'newpasswordhash')
    ).rejects.toThrow('User not found');

    await expect(
      dbService.updateChildDetails(nonExistentChildId, 'newusername')
    ).rejects.toThrow('User not found');
  });

  it('should handle empty and invalid input data', async () => {
    const timestamp = Date.now();
    const childUsername = `childuser${timestamp}${Math.random().toString(36).substring(2, 8)}`;

    await dbService.createChildAccount(
      parentUser.id,
      childUsername,
      'hashedpassword123'
    );

    await expect(
      dbService.updateChildDetails(childUsername, '')
    ).rejects.toThrow();

    await expect(
      dbService.updateChildPassword('invalid-id', '')
    ).rejects.toThrow('User not found');
  });
});
