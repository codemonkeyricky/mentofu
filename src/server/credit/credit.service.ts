import { DatabaseService } from '../database/interface/database.service';
import { sessionService } from '../session/session.service';

export interface UserCredits {
  earned: number;
  claimed: number;
}

export class CreditService {
  private databaseService: DatabaseService | null = null;

  setDatabaseService(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  async getTotalEarned(userId: string): Promise<number> {
    if (!this.databaseService) {
      throw new Error('Database service not initialized');
    }

    // Get stats from session service (derived from quiz scores)
    const stats = await sessionService.getUserStats(userId);
    
    // Get manual earned credits from database
    const manualEarned = await this.databaseService.getEarnedCredits(userId);

    return stats.totalScore + manualEarned;
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

    const totalEarned = await this.getTotalEarned(userId);
    const currentClaimed = await this.getTotalClaimed(userId);

    if (currentClaimed + amount > totalEarned) {
      throw new Error('Total claimed credit cannot be larger than total earned credit');
    }

    await this.databaseService.addClaimedCredits(userId, amount);
  }
}

export const creditService = new CreditService();