import request from 'supertest';
import express from 'express';
import { creditRouter } from '../credit/credit.controller';
import { creditService } from '../credit/credit.service';
import { authenticate } from '../middleware/auth.middleware';

// Mock the middleware and service
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, res, next) => {
    (req as any).user = { userId: 'test-user-id' };
    next();
  })
}));
jest.mock('../credit/credit.service');

const app = express();
app.use(express.json());
app.use('/credit', creditRouter);

describe('CreditController', () => {
  const mockCreditService = creditService as jest.Mocked<typeof creditService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /credit/claimed', () => {
    it('should return total claimed credits', async () => {
      mockCreditService.getTotalClaimed.mockResolvedValue(150);

      const response = await request(app).get('/credit/claimed');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ claimed: 150 });
      expect(mockCreditService.getTotalClaimed).toHaveBeenCalledWith('test-user-id');
    });

    it('should return 500 when service fails', async () => {
      mockCreditService.getTotalClaimed.mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get('/credit/claimed');

      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe('Failed to retrieve claimed credits');
    });
  });

  describe('POST /credit/claimed', () => {
    it('should add claimed credits successfully', async () => {
      mockCreditService.addClaimedCredits.mockResolvedValue(undefined);
      mockCreditService.getTotalClaimed.mockResolvedValue(100);
      mockCreditService.getTotalEarned.mockResolvedValue(200);

      const response = await request(app)
        .post('/credit/claimed')
        .send({ amount: 50 });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Claimed credits added successfully');
      expect(response.body.totalClaimed).toBe(100);
      expect(mockCreditService.addClaimedCredits).toHaveBeenCalledWith('test-user-id', 50);
    });

    it('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post('/credit/claimed')
        .send({ amount: -10 });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid amount');
    });

    it('should return 400 when amount is not a number', async () => {
      const response = await request(app)
        .post('/credit/claimed')
        .send({ amount: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should return 400 when claiming more than earned', async () => {
      mockCreditService.addClaimedCredits.mockRejectedValue(
        new Error('Total claimed credit cannot be larger than total earned credit')
      );

      const response = await request(app)
        .post('/credit/claimed')
        .send({ amount: 500 });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Total claimed credit cannot be larger than total earned credit');
    });
  });
});
