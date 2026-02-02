import { DatabaseService } from '../database/interface/database.service';
import { User } from '../auth/auth.types';
import { QUIZ_TYPES } from '../session/quiz-types.constants';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreditUpdate {
  earnedCredits?: number;
  claimedCredits?: number;
  earnedDelta?: number;
  claimedDelta?: number;
  field?: 'earned' | 'claimed';
  amount?: number;
}

export class ParentService {
  constructor(
    private databaseService: DatabaseService,
    private authService: any
  ) {}

  private async atomicAddClaimedCredits(
    userId: string,
    amount: number,
    expectedCurrentClaimed?: number
  ): Promise<void> {
    // Get current earned credits for validation
    let currentEarned = await this.databaseService.getEarnedCredits(userId);
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Try atomic update
      const success = await this.databaseService.addClaimedCreditsAtomic(
        userId,
        amount,
        currentEarned,
        expectedCurrentClaimed
      );

      if (success) {
        return; // Success!
      }

      // Atomic update failed - check if earned credits changed
      if (attempt < maxRetries - 1) {
        const newEarned = await this.databaseService.getEarnedCredits(userId);
        if (newEarned !== currentEarned) {
          // Earned credits changed, update and retry immediately
          currentEarned = newEarned;
          continue;
        }
      }

      // Wait with exponential backoff before retry
      if (attempt < maxRetries - 1) {
        const delayMs = 50 * Math.pow(2, attempt); // 50ms, 100ms, 200ms
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // All retries failed
    throw new Error('Cannot update claimed credits. Validation failed.');
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const authResponse = await this.authService.login(username, password);

    if (!authResponse.user.isParent) {
      throw new Error('User is not a parent/admin');
    }

    return authResponse;
  }

  async validate(token: string): Promise<User> {
    const decoded = this.authService.verifyToken(token);
    if (!decoded) {
      throw new Error('Invalid or expired token');
    }

    const user = await this.authService.getUserById(decoded.userId);
    if (!user || !user.isParent) {
      throw new Error('User is not a parent/admin');
    }

    return user;
  }

  async getUser(idOrUsername: string): Promise<User> {
    let user = await this.databaseService.findUserById(idOrUsername);
    if (user) {
      return user;
    }

    user = await this.databaseService.findUserByUsername(idOrUsername);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async getUsers(search?: string | undefined, limit?: string | number | undefined): Promise<User[]> {
    let users: User[] = [];

    if (search) {
      const user = await this.databaseService.findUserByUsername(search);
      if (user) {
        users = [user];
      }
    } else {
      users = await this.databaseService.getAllUsers();
    }

    const limitNum = typeof limit === 'number' ? limit : (limit ? parseInt(limit) : 20);
    return users.slice(0, limitNum);
  }

  async updateMultiplier(userId: string, quizType: string, multiplier: number): Promise<User> {
    const user = await this.getUser(userId);

    await this.databaseService.setUserMultiplier(user.id, quizType, multiplier);

    return user;
  }

  async updateCredits(userId: string, updates: CreditUpdate): Promise<User> {
    const user = await this.getUser(userId);

    const currentEarned = user.earned_credits || 0;
    const currentClaimed = user.claimed_credits || 0;
    const finalEarned = Math.max(0, currentEarned);
    const finalClaimed = Math.max(0, currentClaimed);

    if (updates.field !== undefined) {
      const targetAmount = Math.max(0, updates.amount || 0);

      if (updates.field === 'earned') {
        await this.databaseService.addEarnedCredits(user.id, targetAmount - currentEarned);
      } else if (updates.field === 'claimed') {
        if (targetAmount > finalEarned) {
          throw new Error('Cannot set claimed credits above earned credits');
        }
        await this.atomicAddClaimedCredits(user.id, targetAmount - currentClaimed, currentClaimed);
      }
    } else {
      let earnedDelta = 0;
      let claimedDelta = 0;

      if (updates.earnedCredits !== undefined) {
        earnedDelta = updates.earnedCredits - currentEarned;
      }
      if (updates.claimedCredits !== undefined) {
        claimedDelta = updates.claimedCredits - currentClaimed;
      }
      if (updates.earnedDelta !== undefined) {
        earnedDelta = updates.earnedDelta;
      }
      if (updates.claimedDelta !== undefined) {
        claimedDelta = updates.claimedDelta;
      }

      if (earnedDelta !== 0) {
        await this.databaseService.addEarnedCredits(user.id, earnedDelta);
      }
      if (claimedDelta !== 0) {
        await this.atomicAddClaimedCredits(user.id, claimedDelta, currentClaimed);
      }
    }

    const updatedUser = await this.getUser(userId);
    return updatedUser;
  }

  async getMultipliersForUser(userId: string): Promise<Record<string, number>> {
    const user = await this.getUser(userId);
    const multipliers: Record<string, number> = {};

    for (const quizType of QUIZ_TYPES) {
      const multiplier = await this.databaseService.getUserMultiplier(user.id, quizType);
      multipliers[quizType] = multiplier;
    }

    return multipliers;
  }

  validQuizTypes: readonly string[] = QUIZ_TYPES;
}
