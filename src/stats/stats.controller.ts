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

// GET /stats/claim - Get current claimed count for the user
statsRouter.get('/claim', authenticate, async (req: Request, res: Response) => {
  try {
    // Get user from auth middleware
    const user = (req as any).user;

    // Retrieve the user's claim amount from database
    const claimAmount = await statsService.getUserClaim(user.userId);

    res.status(200).json({
      claimedAmount: claimAmount,
      message: 'Current claimed amount retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving claimed amount:', error);
    res.status(500).json({
      error: {
        message: 'Failed to retrieve claimed amount',
        code: 'CLAIM_RETRIEVAL_FAILED'
      }
    });
  }
});

// POST /stats/claim - Claim credits against user's score
statsRouter.post('/claim', authenticate, async (req: Request, res: Response) => {
  try {
    // Get user from auth middleware
    const user = (req as any).user;

    // Extract claimed amount from request body
    const { claimedAmount } = req.body;

    if (typeof claimedAmount !== 'number' || claimedAmount <= 0) {
      return res.status(400).json({
        error: {
          message: 'Invalid claimed amount. Must be a positive number.',
          code: 'INVALID_CLAIMED_AMOUNT'
        }
      });
    }

    // Get current stats for the user
    const stats = await statsService.getUserStats(user.userId);

    // Check if claimed amount exceeds total score
    if (claimedAmount > stats.totalScore) {
      return res.status(400).json({
        error: {
          message: 'Claimed amount exceeds total available score.',
          code: 'CLAIM_EXCEEDS_TOTAL'
        }
      });
    }

    // Update the user's claim in the database
    await statsService.setUserClaim(user.userId, claimedAmount);

    // Return success response with updated stats
    res.status(200).json({
      message: 'Stats claimed successfully',
      claimedAmount: claimedAmount,
      remainingScore: stats.totalScore - claimedAmount,
      totalScore: stats.totalScore,
      sessionsCount: stats.sessionsCount
    });
  } catch (error) {
    console.error('Error claiming stats:', error);
    res.status(500).json({
      error: {
        message: 'Failed to claim stats',
        code: 'STATS_CLAIM_FAILED'
      }
    });
  }
});