import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/parent.middleware';
import { DatabaseService } from '../database/interface/database.service';
import { authService } from '../auth/auth.service';
import { User } from '../auth/auth.types';
import { IParentController } from './interface/parent.controller.interface';

export class ParentController implements IParentController {
  private router: Router;
  private databaseService: DatabaseService;
  private authService: typeof authService;

  private readonly _VALID_QUIZ_TYPES: string[] = [
    'simple-math',
    'simple-math-2',
    'simple-math-3',
    'simple-math-4',
    'simple-math-5',
    'simple-words'
  ];

  constructor() {
    this.router = Router();
    this.databaseService = new DatabaseService();
    this.authService = authService;

    this.setupRoutes();
  }

  private setupRoutes(): void {
    const router = this.router;

    router.post('/login', this.login.bind(this));
    router.get('/validate', this.validate.bind(this));
    router.patch('/users/:userId/multiplier', requireAdmin, this.updateMultiplier.bind(this));
    router.patch('/users/:userId/credits', requireAdmin, this.updateCredits.bind(this));
    router.get('/users', requireAdmin, this.getUsers.bind(this));
    router.get('/users/:userId', requireAdmin, this.getUser.bind(this));
  }

  public async login(req: Request, res: Response): Promise<any> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          error: {
            message: 'Username and password are required',
            code: 'MISSING_CREDENTIALS'
          }
        });
      }

      const authResponse = await this.authService.login(username, password);

      if (!authResponse.user.isParent) {
        return res.status(403).json({
          error: {
            message: 'Access denied. Admin privileges required.',
            code: 'FORBIDDEN'
          }
        });
      }

      res.status(200).json(authResponse);
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          error: {
            message: 'Invalid username or password',
            code: 'INVALID_CREDENTIALS'
          }
        });
      }

      console.error('Error in parent login:', error);
      res.status(500).json({
        error: {
          message: 'Failed to login',
          code: 'LOGIN_FAILED'
        }
      });
    }
  }

  public async validate(req: Request, res: Response): Promise<any> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: {
            message: 'Authorization token is missing or invalid',
            code: 'AUTH_TOKEN_REQUIRED'
          }
        });
      }

      const token = authHeader.substring(7);
      const decoded = this.authService.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          error: {
            message: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
          }
        });
      }

      const user = await this.authService.getUserById(decoded.userId);
      if (!user || !user.isParent) {
        return res.status(403).json({
          error: {
            message: 'Access denied. Admin privileges required.',
            code: 'FORBIDDEN'
          }
        });
      }

      res.status(200).json({ valid: true, user: { id: user.id, username: user.username } });
    } catch (error: any) {
      console.error('Error validating token:', error);
      res.status(500).json({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  }

  private async getUserByIdOrUsername(idOrUsername: string): Promise<User | null> {
    let user = await this.databaseService.findUserById(idOrUsername);
    if (user) {
      return user;
    }

    user = await this.databaseService.findUserByUsername(idOrUsername);
    return user;
  }

  public async updateMultiplier(req: Request, res: Response): Promise<any> {
    try {
      const { userId } = req.params;
      const { quizType, multiplier } = req.body;

      if (!quizType || !this._VALID_QUIZ_TYPES.includes(quizType)) {
        return res.status(400).json({
          error: {
            message: 'Invalid quiz type. Must be one of: simple-math, simple-math-2, simple-math-3, simple-math-4, simple-math-5, simple-words',
            code: 'INVALID_QUIZ_TYPE'
          }
        });
      }

      if (typeof multiplier !== 'number' || multiplier < 0 || multiplier > 5 || !Number.isInteger(multiplier)) {
        return res.status(400).json({
          error: {
            message: 'Multiplier must be an integer between 0 and 5',
            code: 'INVALID_MULTIPLIER'
          }
        });
      }

      const user = await this.getUserByIdOrUsername(userId);
      if (!user) {
        return res.status(404).json({
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        });
      }

      await this.databaseService.setUserMultiplier(user.id, quizType, multiplier);

      let category = quizType;
      if (quizType.startsWith('simple-math')) {
        category = 'math';
      } else if (quizType === 'simple-words') {
        category = 'simple_words';
      }
      if (category !== quizType) {
        await this.databaseService.setUserMultiplier(user.id, category, multiplier);
      }

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
  }

  public async updateCredits(req: Request, res: Response): Promise<any> {
    try {
      const { userId } = req.params;
      const { field, amount, earnedCredits, claimedCredits, earnedDelta, claimedDelta } = req.body;

      const hasAnyCreditField = earnedCredits !== undefined || claimedCredits !== undefined ||
                                earnedDelta !== undefined || claimedDelta !== undefined || field !== undefined;

      if (!hasAnyCreditField) {
        return res.status(400).json({
          error: {
            message: 'At least one credit field is required (earnedCredits, claimedCredits, earnedDelta, claimedDelta, field)',
            code: 'MISSING_CREDIT_FIELDS'
          }
        });
      }

      if (field !== undefined) {
        if (field !== 'earned' && field !== 'claimed') {
          return res.status(400).json({
            error: {
              message: 'Field must be either "earned" or "claimed"',
              code: 'INVALID_FIELD'
            }
          });
        }

        if (typeof amount !== 'number' || amount < 0 || !Number.isInteger(amount)) {
          return res.status(400).json({
            error: {
              message: 'Amount must be a non-negative integer',
              code: 'INVALID_AMOUNT'
            }
          });
        }

        const user = await this.getUserByIdOrUsername(userId);
        if (!user) {
          return res.status(404).json({
            error: {
              message: 'User not found',
              code: 'USER_NOT_FOUND'
            }
          });
        }

        const currentEarned = user.earned_credits || 0;
        const currentClaimed = user.claimed_credits || 0;
        const targetAmount = Math.max(0, amount);

        if (field === 'earned') {
          if (targetAmount < currentEarned) {
            return res.status(409).json({
              error: {
                message: 'Cannot set earned credits below current earned credits',
                code: 'INVALID_AMOUNT'
              }
            });
          }

          await this.databaseService.addEarnedCredits(user.id, targetAmount - currentEarned);
        } else if (field === 'claimed') {
          if (targetAmount > currentEarned) {
            return res.status(409).json({
              error: {
                message: 'Cannot set claimed credits above earned credits',
                code: 'CLAIMED_EXCEEDS_EARNED'
              }
            });
          }

          await this.databaseService.addClaimedCredits(user.id, targetAmount - currentClaimed);
        }

        res.json({
          message: 'Credits updated successfully',
          userId: user.id,
          earnedCredits: field === 'earned' ? targetAmount : currentEarned,
          claimedCredits: field === 'claimed' ? targetAmount : currentClaimed,
          field,
          amount: targetAmount
        });
        return;
      }

      const hasLegacyFields = earnedCredits !== undefined || claimedCredits !== undefined ||
                             earnedDelta !== undefined || claimedDelta !== undefined;

      if (!hasLegacyFields) {
        return res.status(400).json({
          error: {
            message: 'At least one credit field is required (earnedCredits, claimedCredits, earnedDelta, claimedDelta)',
            code: 'MISSING_CREDIT_FIELDS'
          }
        });
      }

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

      const user = await this.getUserByIdOrUsername(userId);
      if (!user) {
        return res.status(404).json({
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        });
      }

      let finalEarned = user.earned_credits || 0;
      let finalClaimed = user.claimed_credits || 0;

      if (earnedCredits !== undefined) {
        finalEarned = earnedCredits;
      }
      if (claimedCredits !== undefined) {
        finalClaimed = claimedCredits;
      }

      if (earnedDelta !== undefined) {
        finalEarned += earnedDelta;
      }
      if (claimedDelta !== undefined) {
        finalClaimed += claimedDelta;
      }

      finalEarned = Math.max(0, finalEarned);
      finalClaimed = Math.max(0, finalClaimed);

      if (finalClaimed > finalEarned) {
        return res.status(409).json({
          error: {
            message: 'Claimed credits cannot exceed earned credits',
            code: 'CLAIMED_EXCEEDS_EARNED'
          }
        });
      }

      if (earnedCredits !== undefined || earnedDelta !== undefined) {
        await this.databaseService.addEarnedCredits(user.id, finalEarned - (user.earned_credits || 0));
      }

      if (claimedCredits !== undefined || claimedDelta !== undefined) {
        await this.databaseService.addClaimedCredits(user.id, finalClaimed - (user.claimed_credits || 0));
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
  }

  public async getUsers(req: Request, res: Response): Promise<any> {
    try {
      const { search, limit } = req.query;

      let users: User[] = [];

      if (search) {
        const user = await this.databaseService.findUserByUsername(search as string);
        if (user) {
          users = [user];
        }
      } else {
        users = await this.databaseService.getAllUsers();
      }

      const limitNum = parseInt(limit as string) || 20;
      const limitedUsers = users.slice(0, limitNum);

      const formattedUsers = await Promise.all(limitedUsers.map(async (user) => {
        const multipliers: Record<string, number> = {};

        for (const quizType of this.validQuizTypes) {
          const multiplier = await this.databaseService.getUserMultiplier(user.id, quizType);
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
  }

  public async getUser(req: Request, res: Response): Promise<any> {
    try {
      const { userId } = req.params;

      const user = await this.getUserByIdOrUsername(userId);
      if (!user) {
        return res.status(404).json({
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }
        });
      }

      const multipliers: Record<string, number> = {};

      for (const quizType of this.validQuizTypes) {
        const multiplier = await this.databaseService.getUserMultiplier(user.id, quizType);
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
  }

  public getRouter(): Router {
    return this.router;
  }

  public get validQuizTypes(): string[] {
    return this._VALID_QUIZ_TYPES;
  }
}
