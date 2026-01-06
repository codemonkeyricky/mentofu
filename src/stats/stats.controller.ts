import { Router, Request, Response } from 'express';
import { statsService } from './stats.service';
import { authenticate } from '../middleware/auth.middleware';

export const statsRouter = Router();

// GET /stats - Get total score for current user
statsRouter.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    // Get user from auth middleware
    const user = (req as any).user;

    const stats = await statsService.getUserStats(user.userId);

    res.status(200).json({
      totalScore: stats.totalScore,
      sessionsCount: stats.sessionsCount,
      details: stats.details
    });
  } catch (error) {
    console.error('Error retrieving user stats:', error);
    res.status(500).json({
      error: {
        message: 'Failed to retrieve user stats',
        code: 'USER_STATS_RETRIEVAL_FAILED'
      }
    });
  }
});