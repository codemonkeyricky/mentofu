import express, { Application } from 'express';
import { authRouter } from '../auth/auth.controller';
import { sessionRouter } from '../session/session.controller';
import path from 'path';
import { TestDatabaseUtil } from './database.test.util';

// Create a new test database path for each test run
export const testDbPath = TestDatabaseUtil.createTestDatabasePath();

// Create Express app
const app: Application = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/auth', authRouter);
app.use('/session', sessionRouter);

// Export app and database path for testing
export { app };