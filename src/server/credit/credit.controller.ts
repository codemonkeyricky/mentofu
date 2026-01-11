import { Router, Request, Response } from 'express';
import { creditService } from './credit.service';
import { authenticate } from '../middleware/auth.middleware';

export const creditRouter = Router();

// GET /credit/earned - Get total earned credits
creditRouter.get('/earned', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const earned = await creditService.getTotalEarned(user.userId);
    res.status(200).json({ earned });
  } catch (error) {
    console.error('Error retrieving earned credits:', error);
    res.status(500).json({
      error: { message: 'Failed to retrieve earned credits' }
    });
  }
});

// POST /credit/earned - Add to earned credits
creditRouter.post('/earned', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({
        error: { message: 'Invalid amount. Must be a non-negative number.' }
      });
    }

    await creditService.addEarnedCredits(user.userId, amount);
    const totalEarned = await creditService.getTotalEarned(user.userId);
    
    res.status(200).json({ 
      message: 'Earned credits added successfully',
      amount,
      totalEarned
    });
  } catch (error) {
    console.error('Error adding earned credits:', error);
    res.status(500).json({
      error: { message: 'Failed to add earned credits' }
    });
  }
});

// GET /credit/claimed - Get total claimed credits
creditRouter.get('/claimed', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const claimed = await creditService.getTotalClaimed(user.userId);
    res.status(200).json({ claimed });
  } catch (error) {
    console.error('Error retrieving claimed credits:', error);
    res.status(500).json({
      error: { message: 'Failed to retrieve claimed credits' }
    });
  }
});

// POST /credit/claimed - Add to claimed credits
creditRouter.post('/claimed', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({
        error: { message: 'Invalid amount. Must be a non-negative number.' }
      });
    }

    try {
      await creditService.addClaimedCredits(user.userId, amount);
      const totalClaimed = await creditService.getTotalClaimed(user.userId);
      const totalEarned = await creditService.getTotalEarned(user.userId);
      
      res.status(200).json({ 
        message: 'Claimed credits added successfully',
        amount,
        totalClaimed,
        totalEarned
      });
    } catch (error: any) {
      if (error.message === 'Total claimed credit cannot be larger than total earned credit') {
        return res.status(400).json({
          error: { message: error.message }
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error adding claimed credits:', error);
    res.status(500).json({
      error: { message: 'Failed to add claimed credits' }
    });
  }
});
