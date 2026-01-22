export interface UserCredits {
  earned: number;
  claimed: number;
}

export interface ICreditService {
  setDatabaseService(databaseService: any): void;
  getTotalEarned(userId: string): Promise<number>;
  addEarnedCredits(userId: string, amount: number): Promise<void>;
  getTotalClaimed(userId: string): Promise<number>;
  addClaimedCredits(userId: string, amount: number): Promise<void>;
}
