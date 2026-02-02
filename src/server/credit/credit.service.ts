import { DatabaseService } from '../database/interface/database.service';
import { sessionService } from '../session/session.service.impl';
import { ICreditService } from './interface/credit.service.interface';

export class CreditService implements ICreditService {
  private databaseService: DatabaseService | null = null;

  setDatabaseService(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  async getTotalEarned(userId: string): Promise<number> {
    if (!this.databaseService) {
      throw new Error('Database service not initialized');
    }

    // Get manual earned credits from database
    const manualEarned = await this.databaseService.getEarnedCredits(userId);

    return manualEarned;
  }

  async addEarnedCredits(userId: string, amount: number): Promise<void> {
    if (!this.databaseService) {
      throw new Error('Database service not initialized');
    }
    await this.databaseService.addEarnedCredits(userId, amount);
  }

  async getTotalClaimed(userId: string): Promise<number> {
    if (!this.databaseService) {
      throw new Error('Database service not initialized');
    }
    return await this.databaseService.getClaimedCredits(userId);
  }

  async addClaimedCredits(userId: string, amount: number): Promise<void> {
    if (!this.databaseService) {
      throw new Error('Database service not initialized');
    }

    // Validate amount is positive
    if (amount <= 0) {
      throw new Error('Claim amount must be positive');
    }

    let totalEarned = await this.getTotalEarned(userId);
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Try atomic update
      const success = await this.databaseService.addClaimedCreditsAtomic(
        userId,
        amount,
        totalEarned
      );

      if (success) {
        return; // Success!
      }

      // Atomic update failed - check if earned credits changed
      if (attempt < maxRetries - 1) {
        const newTotalEarned = await this.getTotalEarned(userId);
        if (newTotalEarned !== totalEarned) {
          // Earned credits changed, update and retry immediately
          totalEarned = newTotalEarned;
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
    throw new Error('Total claimed credit cannot be larger than total earned credit');
  }
}

export const creditService = new CreditService();
