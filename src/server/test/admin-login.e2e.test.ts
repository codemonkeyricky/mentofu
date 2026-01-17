// Force memory database for tests - must be done BEFORE importing app
delete process.env.POSTGRES_URL;

import request from 'supertest';
import { app } from '../index';
import { DatabaseService } from '../database/database.service';

describe('Admin Login E2E Test', () => {
  beforeEach(() => {
    // Clear the in-memory database before each test to ensure isolation
    const dbService = new DatabaseService();
    dbService.clearMemoryDatabase();
  });

  it('should allow login with default admin credentials', async () => {
    // First, make sure the default admin user is created
    // This is handled by the DatabaseService constructor when creating a new instance

    // Attempt to login with default admin credentials
    const response = await request(app)
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin2'
      })
      .expect(200);

    // Verify the response contains a token and user info
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('username', 'admin');

    // Verify that the returned token is valid by decoding it or using it in a subsequent request
    const token = response.body.token;
    expect(token).toBeDefined();
    expect(token).not.toEqual('');

    // Verify that the user is marked as admin
    const dbService = new DatabaseService();
    const user = await dbService.findUserByUsername('admin');
    expect(user).toBeDefined();
    expect(user).toHaveProperty('isAdmin', true);
  });

  it('should not allow login with invalid credentials', async () => {
    // Attempt to login with wrong password
    const response = await request(app)
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'wrongpassword'
      })
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message', 'Invalid username or password');
  });
});