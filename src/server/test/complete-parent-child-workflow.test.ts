import { setupTestEnvironment } from './setup';
import { DatabaseService } from '../database/interface/database.service';

describe('Complete Parent-Child Workflow', () => {
  let dbService: DatabaseService;
  let parentUser: any;

  beforeEach(async () => {
    const setup = await setupTestEnvironment();
    dbService = setup.dbService;
    parentUser = setup.parentUser;
  });

  it('should complete full workflow from parent registration to child management', async () => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const childUsernames = [`child1${timestamp}a${randomSuffix}`, `child2${timestamp}b${randomSuffix}`];

    const parent = parentUser;

    const child1 = await dbService.createChildAccount(
      parent.id,
      childUsernames[0],
      'childpass123'
    );

    const child2 = await dbService.createChildAccount(
      parent.id,
      childUsernames[1],
      'childpass456'
    );

    const children = await dbService.getChildrenByParent(parent.id);

    expect(children.length).toBe(2);

    const childIds = children.map(c => c.childId);
    expect(childIds).toContain(child1?.id);
    expect(childIds).toContain(child2?.id);

    const childUsernamesList = children.map(c => c.childUsername);
    expect(childUsernamesList).toContain(childUsernames[0]);
    expect(childUsernamesList).toContain(childUsernames[1]);

    const child1Data = await dbService.findUserById(child1?.id!);
    const child2Data = await dbService.findUserById(child2?.id!);

    expect(child1Data?.parent_id).toBe(parent.id);
    expect(child2Data?.parent_id).toBe(parent.id);
    expect(child1Data?.isParent).toBe(false);
    expect(child2Data?.isParent).toBe(false);

    await dbService.updateChildPassword(child1?.id!, 'newchildpass123');

    const updatedChild1 = await dbService.findUserById(child1?.id!);
    expect(updatedChild1?.passwordHash).toBe('newchildpass123');

    const finalChildren = await dbService.getChildrenByParent(parent.id);
    const updatedChildFromList = finalChildren.find(c => c.childId === child1?.id);

    expect(updatedChildFromList?.childUsername).toBe(childUsernames[0]);
  });
});
