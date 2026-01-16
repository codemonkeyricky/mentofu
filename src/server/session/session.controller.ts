import { Router, Request, Response } from 'express';
import { sessionService } from './session.service';
import { Session } from './session.types';
import { SimpleWordsSession } from './simple.words.types';
import { authenticate } from '../middleware/auth.middleware';

export const sessionRouter = Router();

const quizTypes = [
  'simple-math',
  'simple-math-2',
  'simple-math-3',
  'simple-math-4',
  'simple-math-5',
  'simple-words',
];
const quizTypePattern = `:quizType(${quizTypes.join('|')})`;

// Create new quiz session
sessionRouter.get(`/${quizTypePattern}`, authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { quizType } = req.params;

    const session = sessionService.createQuizSession(user.userId, quizType);

    if ('words' in session) {
      res.status(200).json({
        sessionId: session.id,
        words: (session as SimpleWordsSession).words
      });
    } else {
      res.status(200).json({
        sessionId: session.id,
        questions: (session as Session).questions
      });
    }
  } catch (error) {
    console.error(`Error creating ${req.params.quizType} session:`, error);
    res.status(500).json({
      error: {
        message: `Failed to create ${req.params.quizType} session`,
        code: 'SESSION_CREATION_FAILED'
      }
    });
  }
});

// Validate quiz answers and return score
sessionRouter.post(`/${quizTypePattern}`, authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId, answers } = req.body;
    const { quizType } = req.params;
    const user = (req as any).user;

    // Validate input
    if (!sessionId) {
      return res.status(400).json({
        error: { message: 'Session ID is required', code: 'MISSING_SESSION_ID' }
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        error: { message: 'Answers array is required', code: 'MISSING_ANSWERS' }
      });
    }

    const result = await sessionService.validateQuizAnswers(sessionId, user.userId, answers, quizType);

    res.status(200).json({
      score: result.score,
      total: result.total
    });
  } catch (error: any) {
    if (error.message === 'Session not found') {
      return res.status(404).json({
        error: { message: 'Session not found', code: 'SESSION_NOT_FOUND' }
      });
    }

    if (error.message === 'Unauthorized access to session') {
      return res.status(403).json({
        error: { message: 'Unauthorized access to session', code: 'UNAUTHORIZED_ACCESS' }
      });
    }

    console.error(`Error processing ${req.params.quizType} answers:`, error);
    res.status(500).json({
      error: {
        message: `Failed to process ${req.params.quizType} answers`,
        code: 'ANSWER_PROCESSING_FAILED'
      }
    });
  }
});

// GET /session/scores/:sessionId - Get score for a specific session
sessionRouter.get('/scores/:sessionId', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    // Get user from auth middleware
    const user = (req as any).user;

    if (!sessionId) {
      return res.status(400).json({
        error: {
          message: 'Session ID is required',
          code: 'MISSING_SESSION_ID'
        }
      });
    }

    const score = await sessionService.getSessionScore(sessionId);

    if (!score) {
      return res.status(404).json({
        error: {
          message: 'Session score not found',
          code: 'SESSION_SCORE_NOT_FOUND'
        }
      });
    }

    res.status(200).json({
      sessionId,
      score: score.score,
      total: score.total
    });
  } catch (error) {
    console.error('Error retrieving session score:', error);
    res.status(500).json({
      error: {
        message: 'Failed to retrieve session score',
        code: 'SESSION_SCORE_RETRIEVAL_FAILED'
      }
    });
  }
});

// GET /session/scores - Get all scores for current user's sessions
sessionRouter.get('/scores', authenticate, async (req: Request, res: Response) => {
  try {
    // Get user from auth middleware
    const user = (req as any).user;

    const scores = await sessionService.getUserSessionScores(user.userId);

    res.status(200).json({
      scores
    });
  } catch (error) {
    console.error('Error retrieving user session scores:', error);
    res.status(500).json({
      error: {
        message: 'Failed to retrieve user session scores',
        code: 'USER_SESSION_SCORES_RETRIEVAL_FAILED'
      }
    });
  }
});

// GET /session/all - Get all sessions for current user
sessionRouter.get('/all', authenticate, async (req: Request, res: Response) => {
  try {
    // Get user from auth middleware
    const user = (req as any).user;

    const sessions = await sessionService.getUserSessions(user.userId);

    console.log('Retrieved sessions:', sessions); // Debug log

    // Ensure we're returning the correct structure
    if (!Array.isArray(sessions)) {
      return res.status(500).json({
        error: {
          message: 'Invalid session data format',
          code: 'INVALID_SESSION_DATA'
        }
      });
    }

    res.status(200).json({
      sessions
    });
  } catch (error) {
    console.error('Error retrieving user sessions:', error);
    res.status(500).json({
      error: {
        message: 'Failed to retrieve user sessions',
        code: 'USER_SESSIONS_RETRIEVAL_FAILED'
      }
    });
  }
});

// GET /session/multiplier/:quizType - Get user multiplier for a specific quiz type
sessionRouter.get('/multiplier/:quizType', authenticate, async (req: Request, res: Response) => {
  try {
    const { quizType } = req.params;
    // Get user from auth middleware
    const user = (req as any).user;

    // Validate quiz type
    const validQuizTypes = ['math', 'simple_words'];
    if (!validQuizTypes.includes(quizType)) {
      return res.status(400).json({
        error: {
          message: 'Invalid quiz type'
        }
      });
    }

    const multiplier = await sessionService.getUserMultiplier(user.userId, quizType);

    res.status(200).json({
      quizType,
      multiplier
    });
  } catch (error) {
    console.error('Error retrieving multiplier:', error);
    res.status(500).json({
      error: {
        message: 'Failed to retrieve multiplier'
      }
    });
  }
});

// POST /session/multiplier/:quizType - Set user multiplier for a specific quiz type
sessionRouter.post('/multiplier/:quizType', authenticate, async (req: Request, res: Response) => {
  try {
    const { quizType } = req.params;
    const { multiplier } = req.body;
    // Get user from auth middleware
    const user = (req as any).user;

    // Validate quiz type
    const validQuizTypes = ['math', 'simple_words'];
    if (!validQuizTypes.includes(quizType)) {
      return res.status(400).json({
        error: {
          message: 'Invalid quiz type'
        }
      });
    }

    // Validate multiplier value
    if (typeof multiplier !== 'number' || multiplier <= 0) {
      return res.status(400).json({
        error: {
          message: 'Invalid multiplier value. Must be a positive number.'
        }
      });
    }

    await sessionService.setUserMultiplier(user.userId, quizType, multiplier);

    res.status(200).json({
      quizType,
      multiplier
    });
  } catch (error) {
    console.error('Error setting multiplier:', error);
    res.status(500).json({
      error: {
        message: 'Failed to set multiplier'
      }
    });
  }
});

