import { CreditService } from '../credit/credit.service';
import { DatabaseService } from '../database/interface/database.service';
import { ICreditService } from '../credit/interface/credit.service.interface';

// Mock dependencies
jest.mock('../database/interface/database.service');

describe('CreditService', () => {
  let creditService: CreditService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    jest.clearAllMocks();
    creditService = new CreditService();
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>;
    creditService.setDatabaseService(mockDatabaseService);
  });

  describe('getTotalEarned', () => {
    it('should return manual earned credits from database', async () => {
      const userId = 'user-123';
      mockDatabaseService.getEarnedCredits.mockResolvedValue(25);

      const total = await creditService.getTotalEarned(userId);

      expect(total).toBe(25);
      expect(mockDatabaseService.getEarnedCredits).toHaveBeenCalledWith(userId);
    });
  });

  describe('addClaimedCredits', () => {
    const userId = 'user-123';

    it('should add credits when total claimed is within earned limits', async () => {
      mockDatabaseService.getEarnedCredits.mockResolvedValue(50);
      mockDatabaseService.getClaimedCredits.mockResolvedValue(20);

      await creditService.addClaimedCredits(userId, 30);

      expect(mockDatabaseService.addClaimedCredits).toHaveBeenCalledWith(userId, 30);
    });

    it('should throw an error when trying to claim more than earned', async () => {
      mockDatabaseService.getEarnedCredits.mockResolvedValue(50);
      mockDatabaseService.getClaimedCredits.mockResolvedValue(40);

      await expect(creditService.addClaimedCredits(userId, 11))
        .rejects.toThrow('Total claimed credit cannot be larger than total earned credit');
      
      expect(mockDatabaseService.addClaimedCredits).not.toHaveBeenCalled();
    });
  });
});
