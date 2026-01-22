// Force memory database for tests - MUST BE FIRST
delete process.env.POSTGRES_URL;

import express, { Application } from 'express';
import { authRouter } from '../auth/auth.controller';
import { sessionRouter } from '../session/session.controller';
import { creditRouter } from '../credit/credit.controller';
import path from 'path';
import { TestDatabaseUtil } from './database.test.util';
import { DatabaseService } from '../database/interface/database.service';
import { authService } from '../auth/auth.service';
import { sessionService } from '../session/session.service.impl';
import { creditService } from '../credit/credit.service';

// Create a new test database path for each test run
export const testDbPath = TestDatabaseUtil.createTestDatabasePath();

// Initialize database service
const databaseService = new DatabaseService();
authService.setDatabaseService(databaseService);
sessionService.setDatabaseService(databaseService);
creditService.setDatabaseService(databaseService);

// Create Express app
const app: Application = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/auth', authRouter);
app.use('/session', sessionRouter);
app.use('/credit', creditRouter);

// Export app and database path for testing
export { app };