import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/parent.middleware';
import { DatabaseService } from '../database/database.service';
import { authService } from '../auth/auth.service';
import { User } from '../auth/auth.types';

const adminRouter = Router();
const databaseService = new DatabaseService();

// Middleware to set database service for parent routes
adminRouter.use((req, res, next) => {
  // Make sure database service is initialized
  next();
});

// Helper function to validate quiz types
const VALID_QUIZ_TYPES = [
  'simple-math',
  'simple-math-2',
  'simple-math-3',
  'simple-math-4',
  'simple-math-5',
  'simple-words',
  'lcd'
];

const validateQuizType = (quizType: string): boolean => {
  return VALID_QUIZ_TYPES.includes(quizType);
};

// Helper function to get user by ID or username
const getUserByIdOrUsername = async (idOrUsername: string): Promise<User | null> => {
  // First try to find by ID
  let user = await databaseService.findUserById(idOrUsername);
  if (user) {
    return user;
  }

  // If not found by ID, try by username
  user = await databaseService.findUserByUsername(idOrUsername);
  return user;
};

// PATCH /api/users/:userId/multiplier
adminRouter.patch('/users/:userId/multiplier', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { quizType, multiplier } = req.body;

    // Validate inputs
    if (!quizType || !validateQuizType(quizType)) {
      return res.status(400).json({
        error: {
          message: 'Invalid quiz type. Must be one of: simple-math, simple-math-2, simple-math-3, simple-math-4, simple-math-5, simple-words',
          code: 'INVALID_QUIZ_TYPE'
        }
      });
    }

    if (typeof multiplier !== 'number' || multiplier < 0 || !Number.isInteger(multiplier)) {
      return res.status(400).json({
        error: {
          message: 'Multiplier must be an integer greater than or equal to 0',
          code: 'INVALID_MULTIPLIER'
        }
      });
    }

    // Find the user
    const user = await getUserByIdOrUsername(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Update the multiplier
    await databaseService.setUserMultiplier(user.id, quizType, multiplier);

    res.json({
      message: 'Multiplier updated successfully',
      userId: user.id,
      quizType,
      multiplier
    });
  } catch (error: any) {
    console.error('Error updating multiplier:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// PATCH /api/users/:userId/credits
adminRouter.patch('/users/:userId/credits', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { earnedCredits, claimedCredits, earnedDelta, claimedDelta } = req.body;

    // Validate inputs
    const hasAnyCreditField = earnedCredits !== undefined || claimedCredits !== undefined ||
                              earnedDelta !== undefined || claimedDelta !== undefined;

    if (!hasAnyCreditField) {
      return res.status(400).json({
        error: {
          message: 'At least one credit field is required (earnedCredits, claimedCredits, earnedDelta, claimedDelta)',
          code: 'MISSING_CREDIT_FIELDS'
        }
      });
    }

    // Validate that credit values are integers >= 0
    if (earnedCredits !== undefined && (typeof earnedCredits !== 'number' || earnedCredits < 0 || !Number.isInteger(earnedCredits))) {
      return res.status(400).json({
        error: {
          message: 'Earned credits must be a non-negative integer',
          code: 'INVALID_EARNED_CREDITS'
        }
      });
    }

    if (claimedCredits !== undefined && (typeof claimedCredits !== 'number' || claimedCredits < 0 || !Number.isInteger(claimedCredits))) {
      return res.status(400).json({
        error: {
          message: 'Claimed credits must be a non-negative integer',
          code: 'INVALID_CLAIMED_CREDITS'
        }
      });
    }

    if (earnedDelta !== undefined && (typeof earnedDelta !== 'number' || !Number.isInteger(earnedDelta))) {
      return res.status(400).json({
        error: {
          message: 'Earned delta must be an integer',
          code: 'INVALID_EARNED_DELTA'
        }
      });
    }

    if (claimedDelta !== undefined && (typeof claimedDelta !== 'number' || !Number.isInteger(claimedDelta))) {
      return res.status(400).json({
        error: {
          message: 'Claimed delta must be an integer',
          code: 'INVALID_CLAIMED_DELTA'
        }
      });
    }

    // Find the user
    const user = await getUserByIdOrUsername(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Calculate new values
    let finalEarned = user.earned_credits || 0;
    let finalClaimed = user.claimed_credits || 0;

    // Apply absolute values if provided
    if (earnedCredits !== undefined) {
      finalEarned = earnedCredits;
    }
    if (claimedCredits !== undefined) {
      finalClaimed = claimedCredits;
    }

    // Apply deltas if provided
    if (earnedDelta !== undefined) {
      finalEarned += earnedDelta;
    }
    if (claimedDelta !== undefined) {
      finalClaimed += claimedDelta;
    }

    // Ensure values are not negative
    finalEarned = Math.max(0, finalEarned);
    finalClaimed = Math.max(0, finalClaimed);

    // Ensure claimed credits don't exceed earned credits
    if (finalClaimed > finalEarned) {
      return res.status(409).json({
        error: {
          message: 'Claimed credits cannot exceed earned credits',
          code: 'CLAIMED_EXCEEDS_EARNED'
        }
      });
    }

    // Update user credits
    if (earnedCredits !== undefined || earnedDelta !== undefined) {
      await databaseService.addEarnedCredits(user.id, finalEarned - (user.earned_credits || 0));
    }

    if (claimedCredits !== undefined || claimedDelta !== undefined) {
      await databaseService.addClaimedCredits(user.id, finalClaimed - (user.claimed_credits || 0));
    }

    res.json({
      message: 'Credits updated successfully',
      userId: user.id,
      earnedCredits: finalEarned,
      claimedCredits: finalClaimed
    });
  } catch (error: any) {
    console.error('Error updating credits:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/parent/users
adminRouter.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { search, limit } = req.query;

    // For demonstration purposes, we'll return a simple list
    // In a real implementation, this would query the database for users

    let users: User[] = [];

    // If there's a search parameter, we could filter users
    if (search) {
      // Find user by username or ID
      const user = await databaseService.findUserByUsername(search as string);
      if (user) {
        users = [user];
      }
    } else {
      // For demo purposes, we'll just return a sample of users
      // In a real implementation, this would query the database for all users
      users = await databaseService.getAllUsers();
    }

    // Limit results if specified
    const limitNum = parseInt(limit as string) || 20;
    const limitedUsers = users.slice(0, limitNum);

    // Format the response with user details
    const formattedUsers = await Promise.all(limitedUsers.map(async (user) => {
      const multipliers: Record<string, number> = {};

      // Get multipliers for all quiz types
      for (const quizType of VALID_QUIZ_TYPES) {
        const multiplier = await databaseService.getUserMultiplier(user.id, quizType);
        multipliers[quizType] = multiplier;
      }

      return {
        id: user.id,
        username: user.username,
        earnedCredits: user.earned_credits || 0,
        claimedCredits: user.claimed_credits || 0,
        multipliers
      };
    }));

    res.json({
      users: formattedUsers
    });
  } catch (error: any) {
    console.error('Error getting users:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/parent/users/:userId
adminRouter.get('/users/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await getUserByIdOrUsername(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    const multipliers: Record<string, number> = {};

    // Get multipliers for all quiz types
    for (const quizType of VALID_QUIZ_TYPES) {
      const multiplier = await databaseService.getUserMultiplier(user.id, quizType);
      multipliers[quizType] = multiplier;
    }

    res.json({
      id: user.id,
      username: user.username,
      earnedCredits: user.earned_credits || 0,
      claimedCredits: user.claimed_credits || 0,
      multipliers
    });
  } catch (error: any) {
    console.error('Error getting user:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});


export { adminRouter };