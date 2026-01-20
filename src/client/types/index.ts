export interface ParentDashboardUser {
  id: string;
  username: string;
  earned_credits: number;
  claimed_credits: number;
  multipliers: Record<string, number>;
}