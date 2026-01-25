import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/parent.middleware';
import { IParentController } from './interface/parent.controller.interface';
import { ParentService } from './parent.service';
import { ParentValidator } from './parent.validator';
import { LoginResponse, ValidateResponse, UserResponse, UsersResponse, MultiplierResponse, CreditsResponse, ErrorResponse } from './dtos/parent.dto';

export class ParentController implements IParentController {
  private router: Router;
  private parentService: ParentService;

  constructor(parentService: ParentService) {
    this.router = Router();
    this.parentService = parentService;

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
    const { username, password } = req.body;

    const validation = ParentValidator.validateLoginCredentials(username, password);
    if (!validation.valid) {
      return this.sendErrorResponse(res, validation.error as string, 'Username and password are required', 400);
    }

    try {
      const authResponse = await this.parentService.login(username, password);

      res.status(200).json(authResponse);
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return this.sendErrorResponse(res, 'INVALID_CREDENTIALS', 'Invalid username or password', 401);
      }

      console.error('Error in parent login:', error);
      this.sendErrorResponse(res, 'LOGIN_FAILED', 'Failed to login', 500);
    }
  }

  public async validate(req: Request, res: Response): Promise<any> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return this.sendErrorResponse(res, 'AUTH_TOKEN_REQUIRED', 'Authorization token is missing or invalid', 401);
    }

    const token = authHeader.substring(7);

    try {
      const user = await this.parentService.validate(token);

      res.status(200).json({ valid: true, user: { id: user.id, username: user.username } });
    } catch (error: any) {
      console.error('Error validating token:', error);
      this.sendErrorResponse(res, 'INVALID_TOKEN', 'Invalid or expired token', 401);
    }
  }

  public async updateMultiplier(req: Request, res: Response): Promise<any> {
    const { userId } = req.params;
    const { quizType, multiplier } = req.body;

    const quizTypeValidation = ParentValidator.validateQuizType(quizType || '');
    if (!quizTypeValidation.valid) {
      return this.sendErrorResponse(res, quizTypeValidation.error as string, quizTypeValidation.details || '', 400);
    }

    const multiplierValidation = ParentValidator.validateMultiplier(multiplier || 0);
    if (!multiplierValidation.valid) {
      return this.sendErrorResponse(res, multiplierValidation.error as string, multiplierValidation.details || '', 400);
    }

    try {
      const user = await this.parentService.updateMultiplier(userId, quizType!, multiplier!);

      res.json({
        message: 'Multiplier updated successfully',
        userId: user.id,
        quizType,
        multiplier
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        return this.sendErrorResponse(res, 'USER_NOT_FOUND', error.message, 404);
      }

      console.error('Error updating multiplier:', error);
      this.sendErrorResponse(res, 'INTERNAL_ERROR', 'Internal server error', 500);
    }
  }

  public async updateCredits(req: Request, res: Response): Promise<any> {
    const { userId } = req.params;
    const updates = req.body;

    const validation = ParentValidator.validateCreditsUpdates(updates);
    if (!validation.valid) {
      return this.sendErrorResponse(res, validation.error as string, validation.details || '', 400);
    }

    try {
      const user = await this.parentService.updateCredits(userId, updates);

      const response: any = {
        message: 'Credits updated successfully',
        userId: user.id,
        earnedCredits: user.earned_credits || 0,
        claimedCredits: user.claimed_credits || 0
      };

      if (updates.field) {
        response.field = updates.field;
      }
      if (updates.amount) {
        response.amount = updates.amount;
      }

      res.json(response);
    } catch (error: any) {
      if (error.message === 'Cannot set claimed credits above earned credits' ||
          error.message === 'Claimed credits cannot exceed earned credits') {
        return this.sendErrorResponse(res, 'CLAIMED_EXCEEDS_EARNED', error.message, 409);
      }

      if (error.message === 'User not found') {
        return this.sendErrorResponse(res, 'USER_NOT_FOUND', error.message, 404);
      }

      console.error('Error updating credits:', error);
      this.sendErrorResponse(res, 'INTERNAL_ERROR', 'Internal server error', 500);
    }
  }

  public async getUsers(req: Request, res: Response): Promise<any> {
    const { search, limit } = req.query;

    try {
      const users = await this.parentService.getUsers(search as string, limit as string);

      const formattedUsers = await Promise.all(users.map(async (user) => {
        const multipliers = await this.parentService.getMultipliersForUser(user.id);

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
      this.sendErrorResponse(res, 'INTERNAL_ERROR', 'Internal server error', 500);
    }
  }

  public async getUser(req: Request, res: Response): Promise<any> {
    const { userId } = req.params;

    try {
      const user = await this.parentService.getUser(userId);
      const multipliers = await this.parentService.getMultipliersForUser(user.id);

      res.json({
        id: user.id,
        username: user.username,
        earnedCredits: user.earned_credits || 0,
        claimedCredits: user.claimed_credits || 0,
        multipliers
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        return this.sendErrorResponse(res, 'USER_NOT_FOUND', error.message, 404);
      }

      console.error('Error getting user:', error);
      this.sendErrorResponse(res, 'INTERNAL_ERROR', 'Internal server error', 500);
    }
  }

  public getRouter(): Router {
    return this.router;
  }

  public get validQuizTypes(): readonly string[] {
    return this.parentService.validQuizTypes;
  }

  private sendErrorResponse(res: Response, code: string, message: string, status = 400): void {
    res.status(status).json({
      error: { message, code }
    });
  }
}
