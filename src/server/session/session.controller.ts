import { Router, Request, Response } from 'express';
import { sessionService } from './session.service';
import { Session } from './session.types';
import { SimpleWordsSession } from './simple.words.types';
import { authenticate } from '../middleware/auth.middleware';

export const sessionRouter = Router();

// GET /session/simple-math - Create new math quiz session with questions
sessionRouter.get('/simple-math', authenticate, (req: Request, res: Response) => {
  try {
    // Get user from auth middleware
    const user = (req as any).user;

    const session = sessionService.createSession(user.userId);

    res.status(200).json({
      sessionId: session.id,
      questions: session.questions
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      error: {
        message: 'Failed to create session',
        code: 'SESSION_CREATION_FAILED'
      }
    });
  }
});

// GET /session/simple-math-2 - Create new division math quiz session with questions
sessionRouter.get('/simple-math-2', authenticate, (req: Request, res: Response) => {
  try {
    // Get user from auth middleware
    const user = (req as any).user;

    const session = sessionService.createDivisionSession(user.userId);

    res.status(200).json({
      sessionId: session.id,
      questions: session.questions
    });
  } catch (error) {
    console.error('Error creating division session:', error);
    res.status(500).json({
      error: {
        message: 'Failed to create division session',
        code: 'DIVISION_SESSION_CREATION_FAILED'
      }
    });
  }
});

// GET /session/simple-math-3 - Create new fraction comparison math quiz session with questions
sessionRouter.get('/simple-math-3', authenticate, (req: Request, res: Response) => {
  try {
    // Get user from auth middleware
    const user = (req as any).user;

    const session = sessionService.createFractionComparisonSession(user.userId);

    res.status(200).json({
      sessionId: session.id,
      questions: session.questions
    });
  } catch (error) {
    console.error('Error creating fraction comparison session:', error);
    res.status(500).json({
      error: {
        message: 'Failed to create fraction comparison session',
        code: 'FRACTION_COMPARISON_SESSION_CREATION_FAILED'
      }
    });
  }
});

// GET /session/simple-math-4 - Create new BODMAS math quiz session with questions
sessionRouter.get('/simple-math-4', authenticate, (req: Request, res: Response) => {
  try {
    // Get user from auth middleware
    const user = (req as any).user;

    const session = sessionService.createBODMASession(user.userId);

    res.status(200).json({
      sessionId: session.id,
      questions: session.questions
    });
  } catch (error) {
    console.error('Error creating BODMAS session:', error);
    res.status(500).json({
      error: {
        message: 'Failed to create BODMAS session',
        code: 'BODMAS_SESSION_CREATION_FAILED'
      }
    });
  }
});

// GET /session/simple-words - Create new simple words quiz session
sessionRouter.get('/simple-words', authenticate, (req: Request, res: Response) => {
  try {
    // Get user from auth middleware
    const user = (req as any).user;

    const session = sessionService.createSimpleWordsSession(user.userId);

    res.status(200).json({
      sessionId: session.id,
      words: session.words
    });
  } catch (error) {
    console.error('Error creating simple words session:', error);
    res.status(500).json({
      error: {
        message: 'Failed to create simple words session',
        code: 'SIMPLE_WORDS_SESSION_CREATION_FAILED'
      }
    });
  }
});

// POST /session/simple-math-4 - Validate BODMAS quiz answers and return score
sessionRouter.post('/simple-math-4', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId, answers } = req.body;
    // Get user from auth middleware
    const user = (req as any).user;

    // Validate input
    if (!sessionId) {
      return res.status(400).json({
        error: {
          message: 'Session ID is required',
          code: 'MISSING_SESSION_ID'
        }
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        error: {
          message: 'Answers array is required',
          code: 'MISSING_ANSWERS'
        }
      });
    }

    const result = await sessionService.validateBODMASAnswers(sessionId, user.userId, answers);

    res.status(200).json({
      score: result.score,
      total: result.total
    });
  } catch (error: any) {
    if (error.message === 'Session not found') {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    if (error.message === 'Unauthorized access to session') {
      return res.status(403).json({
        error: {
          message: 'Unauthorized access to session',
          code: 'UNAUTHORIZED_ACCESS'
        }
      });
    }

    console.error('Error processing BODMAS answers:', error);
    res.status(500).json({
      error: {
        message: 'Failed to process BODMAS answers',
        code: 'BODMAS_ANSWER_PROCESSING_FAILED'
      }
    });
  }
});

// POST /session/simple-math-3 - Validate fraction comparison quiz answers and return score
sessionRouter.post('/simple-math-3', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId, answers } = req.body;
    // Get user from auth middleware
    const user = (req as any).user;

    // Validate input
    if (!sessionId) {
      return res.status(400).json({
        error: {
          message: 'Session ID is required',
          code: 'MISSING_SESSION_ID'
        }
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        error: {
          message: 'Answers array is required',
          code: 'MISSING_ANSWERS'
        }
      });
    }

    const result = await sessionService.validateFractionComparisonAnswers(sessionId, user.userId, answers);

    res.status(200).json({
      score: result.score,
      total: result.total
    });
  } catch (error: any) {
    if (error.message === 'Session not found') {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    if (error.message === 'Unauthorized access to session') {
      return res.status(403).json({
        error: {
          message: 'Unauthorized access to session',
          code: 'UNAUTHORIZED_ACCESS'
        }
      });
    }

    console.error('Error processing fraction comparison answers:', error);
    res.status(500).json({
      error: {
        message: 'Failed to process fraction comparison answers',
        code: 'FRACTION_COMPARISON_ANSWER_PROCESSING_FAILED'
      }
    });
  }
});

// POST /session/simple-math - Validate math quiz answers and return score
sessionRouter.post('/simple-math', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId, answers } = req.body;
    // Get user from auth middleware
    const user = (req as any).user;

    // Validate input
    if (!sessionId) {
      return res.status(400).json({
        error: {
          message: 'Session ID is required',
          code: 'MISSING_SESSION_ID'
        }
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        error: {
          message: 'Answers array is required',
          code: 'MISSING_ANSWERS'
        }
      });
    }

    const result = await sessionService.validateAnswers(sessionId, user.userId, answers);

    res.status(200).json({
      score: result.score,
      total: result.total
    });
  } catch (error: any) {
    if (error.message === 'Session not found') {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    if (error.message === 'Unauthorized access to session') {
      return res.status(403).json({
        error: {
          message: 'Unauthorized access to session',
          code: 'UNAUTHORIZED_ACCESS'
        }
      });
    }

    console.error('Error processing answers:', error);
    res.status(500).json({
      error: {
        message: 'Failed to process answers',
        code: 'ANSWER_PROCESSING_FAILED'
      }
    });
  }
});

// POST /session/simple-math-2 - Validate division math quiz answers and return score
sessionRouter.post('/simple-math-2', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId, answers } = req.body;
    // Get user from auth middleware
    const user = (req as any).user;

    // Validate input
    if (!sessionId) {
      return res.status(400).json({
        error: {
          message: 'Session ID is required',
          code: 'MISSING_SESSION_ID'
        }
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        error: {
          message: 'Answers array is required',
          code: 'MISSING_ANSWERS'
        }
      });
    }

    const result = await sessionService.validateAnswers(sessionId, user.userId, answers);

    res.status(200).json({
      score: result.score,
      total: result.total
    });
  } catch (error: any) {
    if (error.message === 'Session not found') {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    if (error.message === 'Unauthorized access to session') {
      return res.status(403).json({
        error: {
          message: 'Unauthorized access to session',
          code: 'UNAUTHORIZED_ACCESS'
        }
      });
    }

    console.error('Error processing division math answers:', error);
    res.status(500).json({
      error: {
        message: 'Failed to process division math answers',
        code: 'DIVISION_MATH_ANSWER_PROCESSING_FAILED'
      }
    });
  }
});

// POST /session/simple-words - Validate simple words quiz answers and return score
sessionRouter.post('/simple-words', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId, answers } = req.body;
    // Get user from auth middleware
    const user = (req as any).user;

    // Validate input
    if (!sessionId) {
      return res.status(400).json({
        error: {
          message: 'Session ID is required',
          code: 'MISSING_SESSION_ID'
        }
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        error: {
          message: 'Answers array is required',
          code: 'MISSING_ANSWERS'
        }
      });
    }

    const result = await sessionService.validateSimpleWordsAnswers(sessionId, user.userId, answers);

    res.status(200).json({
      score: result.score,
      total: result.total
    });
  } catch (error: any) {
    if (error.message === 'Session not found') {
      return res.status(404).json({
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }
      });
    }

    if (error.message === 'Unauthorized access to session') {
      return res.status(403).json({
        error: {
          message: 'Unauthorized access to session',
          code: 'UNAUTHORIZED_ACCESS'
        }
      });
    }

    console.error('Error processing simple words answers:', error);
    res.status(500).json({
      error: {
        message: 'Failed to process simple words answers',
        code: 'SIMPLE_WORDS_ANSWER_PROCESSING_FAILED'
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

