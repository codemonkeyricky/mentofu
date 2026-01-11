import express, { Application, Request, Response } from 'express';
import { sessionRouter } from './session/session.controller';
import { authRouter } from './auth/auth.controller';
import { creditRouter } from './credit/credit.controller';
import path from 'path';
import { DatabaseService } from './database/database.service';
import { sessionService } from './session/session.service';
import listEndpoints from 'express-list-endpoints';
import * as dotenv from 'dotenv';
dotenv.config();

const app: Application = express();
const PORT: number = 4000;

// Initialize database service - will automatically use SQLite for local dev or Vercel Postgres when deployed
const databaseService = new DatabaseService();

// Connect database service to services
import { authService } from './auth/auth.service';
authService.setDatabaseService(databaseService);
sessionService.setDatabaseService(databaseService);

// Connect database service to credit service
import { creditService } from './credit/credit.service';
creditService.setDatabaseService(databaseService);

// Middleware
app.use(express.json());

// Simple CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const publicPath = path.join(__dirname, '../../dist/public');
app.use(express.static(publicPath));

// Routes
app.use('/auth', authRouter);
app.use('/session', sessionRouter);
app.use('/credit', creditRouter);

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
  const indexPath = path.join(publicPath, 'index.html');
  // Check if file exists to avoid crashing if not built
  import('fs').then(fs => {
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ message: 'Frontend not built yet. Please run npm run build.' });
    }
  });
});

// Export app for testing
export { app };

// Export for vercel deployment
export default app;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
