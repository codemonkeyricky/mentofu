import { CreditService } from '../credit/credit.service';
import { DatabaseService } from '../database/interface/database.service';
import { sessionService } from '../session/session.service.impl';

// Mock dependencies
jest.mock('../database/interface/database.service');
jest.mock('../session/session.service.impl');

describe('CreditService', () => {
  let creditService: CreditService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockSessionService: jest.Mocked<typeof sessionService>;

  beforeEach(() => {
    jest.clearAllMocks();
    creditService = new CreditService();
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>;
    mockSessionService = sessionService as jest.Mocked<typeof sessionService>;
    creditService.setDatabaseService(mockDatabaseService);
  });

  describe('getTotalEarned', () => {
    it('should combine session stats and manual earned credits', async () => {
      const userId = 'user-123';
      mockSessionService.getUserStats.mockResolvedValue({ totalScore: 50, sessionsCount: 5, details: [] });
      mockDatabaseService.getEarnedCredits.mockResolvedValue(25);

      const total = await creditService.getTotalEarned(userId);

      expect(total).toBe(75);
      expect(mockSessionService.getUserStats).toHaveBeenCalledWith(userId);
      expect(mockDatabaseService.getEarnedCredits).toHaveBeenCalledWith(userId);
    });
  });

  describe('addClaimedCredits', () => {
    const userId = 'user-123';

    it('should add credits when total claimed is within earned limits', async () => {
      // Total earned: 100 (50 quiz + 50 manual)
      mockSessionService.getUserStats.mockResolvedValue({ totalScore: 50, sessionsCount: 5, details: [] });
      mockDatabaseService.getEarnedCredits.mockResolvedValue(50);
      
      // Current claimed: 20
      mockDatabaseService.getClaimedCredits.mockResolvedValue(20);

      // Add 30 more (Total claimed will be 50, which is <= 100)
      await creditService.addClaimedCredits(userId, 30);

      expect(mockDatabaseService.addClaimedCredits).toHaveBeenCalledWith(userId, 30);
    });

    it('should throw an error when trying to claim more than earned', async () => {
      // Total earned: 50
      mockSessionService.getUserStats.mockResolvedValue({ totalScore: 30, sessionsCount: 3, details: [] });
      mockDatabaseService.getEarnedCredits.mockResolvedValue(20);
      
      // Current claimed: 40
      mockDatabaseService.getClaimedCredits.mockResolvedValue(40);

      // Try to add 11 more (Total claimed would be 51, which is > 50)
      await expect(creditService.addClaimedCredits(userId, 11))
        .rejects.toThrow('Total claimed credit cannot be larger than total earned credit');
      
      expect(mockDatabaseService.addClaimedCredits).not.toHaveBeenCalled();
    });
  });
});
