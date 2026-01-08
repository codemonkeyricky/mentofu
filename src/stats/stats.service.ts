import { DatabaseService } from '../database/database.service';

export interface UserStats {
  totalScore: number;
  sessionsCount: number;
  details: {
    math?: {
      score: number;
      count: number;
    };
    simpleWords?: {
      score: number;
      count: number;
    };
  };
}

export class StatsService {
  private databaseService: DatabaseService | null = null;

  setDatabaseService(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  async getUserStats(userId: string): Promise<UserStats> {
    if (!this.databaseService) {
      throw new Error('Database service not initialized');
    }

    // Get all scores for the user
    const scores = await this.databaseService.getUserSessionScores(userId);

    // Calculate total score and session count
    let totalScore = 0;
    let sessionsCount = 0;
    const details: UserStats['details'] = {};

    // Group by quiz type and calculate totals
    for (const score of scores) {
      // Calculate weighted score using multiplier
      const weightedScore = score.score * (score.multiplier || 1);
      totalScore += weightedScore;
      sessionsCount++;

      if (score.sessionType === 'math') {
        if (!details.math) {
          details.math = { score: 0, count: 0 };
        }
        details.math.score += weightedScore;
        details.math.count++;
      } else if (score.sessionType === 'simple_words') {
        if (!details.simpleWords) {
          details.simpleWords = { score: 0, count: 0 };
        }
        details.simpleWords.score += weightedScore;
        details.simpleWords.count++;
      }
    }

    return {
      totalScore,
      sessionsCount,
      details
    };
  }

  async getUserClaim(userId: string): Promise<number> {
    if (!this.databaseService) {
      throw new Error('Database service not initialized');
    }

    return await this.databaseService.getUserClaim(userId);
  }

  async setUserClaim(userId: string, claimAmount: number): Promise<void> {
    if (!this.databaseService) {
      throw new Error('Database service not initialized');
    }

    await this.databaseService.setUserClaim(userId, claimAmount);
  }
}

export const statsService = new StatsService();