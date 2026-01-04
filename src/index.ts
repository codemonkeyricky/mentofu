import express, { Application, Request, Response } from 'express';
import { sessionRouter } from './session/session.controller';
import { authRouter } from './auth/auth.controller';
import path from 'path';
import { DatabaseService } from './database/database.service';
import { sessionService } from './session/session.service';
import listEndpoints from 'express-list-endpoints';

const app: Application = express();
const PORT: number = 4000;

// Initialize database service
const databaseService = new DatabaseService();

// Connect database service to session service
sessionService.setDatabaseService(databaseService);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/auth', authRouter);
app.use('/session', sessionRouter);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Quiz API is running' });
});

// Endpoint listing all available endpoints
app.get('/endpoints', (req: Request, res: Response) => {
  const endpoints = listEndpoints(app);
  res.json({
    message: 'Available API endpoints',
    endpoints: endpoints.map(endpoint => ({
      path: endpoint.path,
      methods: endpoint.methods
    }))
  });
});

// Serve the main HTML file for all other routes (for SPA)
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Export app for testing
export { app };

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
