// Force memory database for tests - must be done BEFORE importing app
delete process.env.POSTGRES_URL;

import request from 'supertest';
import { app } from '../index';
import { DatabaseService } from '../database/interface/database.service';
import { authService } from '../auth/auth.service';

describe('Admin Login E2E Test', () => {
  beforeEach(() => {
    // Clear the in-memory database before each test to ensure isolation
    const dbService = new DatabaseService();
    dbService.clearMemoryDatabase();
    // Create a new DatabaseService instance to trigger parent user creation
    // This will recreate the parent user in the cleared memory database
    new DatabaseService();
  });

  it('should allow login with default parent credentials', async () => {
    // First, make sure the default parent user is created
    // This is handled by the DatabaseService constructor when creating a new instance

    // Attempt to login with default parent credentials
    const response = await request(app)
      .post('/auth/login')
      .send({
        username: 'parent',
        password: 'admin2'
      })
      .expect(200);

    // Verify the response contains a token and user info
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('username', 'parent');

    // Verify that the returned token is valid by decoding it or using it in a subsequent request
    const token = response.body.token;
    expect(token).toBeDefined();
    expect(token).not.toEqual('');

    // Verify that the user is marked as parent
    const dbService = new DatabaseService();
    const user = await dbService.findUserByUsername('parent');
    expect(user).toBeDefined();
    expect(user).toHaveProperty('isParent', true);
  });

  it('should not allow login with invalid credentials', async () => {
    // Attempt to login with wrong password
    const response = await request(app)
      .post('/auth/login')
      .send({
        username: 'parent',
        password: 'wrongpassword'
      })
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message', 'Invalid username or password');
  });
});