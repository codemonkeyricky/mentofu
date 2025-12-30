import { Router, Request, Response } from 'express';
import { sessionService } from './session.service';
import { Session } from './session.types';
import { SimpleWordsSession } from './simple.words.types';
import { authenticate } from '../middleware/auth.middleware';

export const sessionRouter = Router();

/**
 * @swagger
 * /session/simple-math:
 *   get:
 *     summary: Create new math quiz session with questions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   example: "12345"
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "q1"
 *                       question:
 *                         type: string
 *                         example: "What is 5 x 6?"
 *                       answer:
 *                         type: number
 *                         example: 30
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to create session"
 *                     code:
 *                       type: string
 *                       example: "SESSION_CREATION_FAILED"
 */
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

/**
 * @swagger
 * /session/simple-math-2:
 *   get:
 *     summary: Create new division math quiz session with questions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   example: "12345"
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "q1"
 *                       question:
 *                         type: string
 *                         example: "What is 20 ÷ 4?"
 *                       answer:
 *                         type: number
 *                         example: 5
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to create division session"
 *                     code:
 *                       type: string
 *                       example: "DIVISION_SESSION_CREATION_FAILED"
 */
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

/**
 * @swagger
 * /session/simple-math-3:
 *   get:
 *     summary: Create new fraction comparison math quiz session with questions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   example: "12345"
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "q1"
 *                       question:
 *                         type: string
 *                         example: "Which is greater: 3/4 or 2/3?"
 *                       answer:
 *                         type: string
 *                         example: "3/4"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to create fraction comparison session"
 *                     code:
 *                       type: string
 *                       example: "FRACTION_COMPARISON_SESSION_CREATION_FAILED"
 */
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

/**
 * @swagger
 * /session/simple-math-3:
 *   post:
 *     summary: Validate fraction comparison quiz answers and return score
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - answers
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "12345"
 *               answers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["3/4", "2/3", "1/2"]
 *     responses:
 *       200:
 *         description: Score calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: number
 *                   example: 2
 *                 total:
 *                   type: number
 *                   example: 3
 *       400:
 *         description: Missing session ID or answers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Session ID is required"
 *                     code:
 *                       type: string
 *                       example: "MISSING_SESSION_ID"
 *       403:
 *         description: Unauthorized access to session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Unauthorized access to session"
 *                     code:
 *                       type: string
 *                       example: "UNAUTHORIZED_ACCESS"
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Session not found"
 *                     code:
 *                       type: string
 *                       example: "SESSION_NOT_FOUND"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to process fraction comparison answers"
 *                     code:
 *                       type: string
 *                       example: "FRACTION_COMPARISON_ANSWER_PROCESSING_FAILED"
 */
// POST /session/simple-math-3 - Validate fraction comparison quiz answers and return score
sessionRouter.post('/simple-math-3', authenticate, (req: Request, res: Response) => {
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

    const result = sessionService.validateFractionComparisonAnswers(sessionId, user.userId, answers);

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

/**
 * @swagger
 * /session/simple-words:
 *   get:
 *     summary: Create new simple words quiz session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   example: "12345"
 *                 words:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "w1"
 *                       word:
 *                         type: string
 *                         example: "apple"
 *                       definition:
 *                         type: string
 *                         example: "A round fruit with red or green skin"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to create simple words session"
 *                     code:
 *                       type: string
 *                       example: "SIMPLE_WORDS_SESSION_CREATION_FAILED"
 */
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

/**
 * @swagger
 * /session/simple-math:
 *   post:
 *     summary: Validate math quiz answers and return score
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - answers
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "12345"
 *               answers:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [30, 15, 8]
 *     responses:
 *       200:
 *         description: Score calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: number
 *                   example: 2
 *                 total:
 *                   type: number
 *                   example: 3
 *       400:
 *         description: Missing session ID or answers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Session ID is required"
 *                     code:
 *                       type: string
 *                       example: "MISSING_SESSION_ID"
 *       403:
 *         description: Unauthorized access to session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Unauthorized access to session"
 *                     code:
 *                       type: string
 *                       example: "UNAUTHORIZED_ACCESS"
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Session not found"
 *                     code:
 *                       type: string
 *                       example: "SESSION_NOT_FOUND"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to process answers"
 *                     code:
 *                       type: string
 *                       example: "ANSWER_PROCESSING_FAILED"
 */
// POST /session/simple-math - Validate math quiz answers and return score
sessionRouter.post('/simple-math', authenticate, (req: Request, res: Response) => {
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

    const result = sessionService.validateAnswers(sessionId, user.userId, answers);

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

/**
 * @swagger
 * /session/simple-math-2:
 *   post:
 *     summary: Validate division math quiz answers and return score
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - answers
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "12345"
 *               answers:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [5, 8, 3]
 *     responses:
 *       200:
 *         description: Score calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: number
 *                   example: 2
 *                 total:
 *                   type: number
 *                   example: 3
 *       400:
 *         description: Missing session ID or answers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Session ID is required"
 *                     code:
 *                       type: string
 *                       example: "MISSING_SESSION_ID"
 *       403:
 *         description: Unauthorized access to session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Unauthorized access to session"
 *                     code:
 *                       type: string
 *                       example: "UNAUTHORIZED_ACCESS"
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Session not found"
 *                     code:
 *                       type: string
 *                       example: "SESSION_NOT_FOUND"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to process division math answers"
 *                     code:
 *                       type: string
 *                       example: "DIVISION_MATH_ANSWER_PROCESSING_FAILED"
 */
// POST /session/simple-math-2 - Validate division math quiz answers and return score
sessionRouter.post('/simple-math-2', authenticate, (req: Request, res: Response) => {
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

    const result = sessionService.validateAnswers(sessionId, user.userId, answers);

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

/**
 * @swagger
 * /session/simple-math-3:
 *   post:
 *     summary: Validate fraction comparison quiz answers and return score
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - answers
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "12345"
 *               answers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["3/4", "2/3", "1/2"]
 *     responses:
 *       200:
 *         description: Score calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: number
 *                   example: 2
 *                 total:
 *                   type: number
 *                   example: 3
 *       400:
 *         description: Missing session ID or answers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Session ID is required"
 *                     code:
 *                       type: string
 *                       example: "MISSING_SESSION_ID"
 *       403:
 *         description: Unauthorized access to session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Unauthorized access to session"
 *                     code:
 *                       type: string
 *                       example: "UNAUTHORIZED_ACCESS"
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Session not found"
 *                     code:
 *                       type: string
 *                       example: "SESSION_NOT_FOUND"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to process fraction comparison answers"
 *                     code:
 *                       type: string
 *                       example: "FRACTION_COMPARISON_ANSWER_PROCESSING_FAILED"
 */
// POST /session/simple-math-3 - Validate fraction comparison quiz answers and return score
sessionRouter.post('/simple-math-3', authenticate, (req: Request, res: Response) => {
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

    const result = sessionService.validateFractionComparisonAnswers(sessionId, user.userId, answers);

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

/**
 * @swagger
 * /session/simple-words:
 *   post:
 *     summary: Validate simple words quiz answers and return score
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - answers
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "12345"
 *               answers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["apple", "banana", "orange"]
 *     responses:
 *       200:
 *         description: Score calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: number
 *                   example: 2
 *                 total:
 *                   type: number
 *                   example: 3
 *       400:
 *         description: Missing session ID or answers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Session ID is required"
 *                     code:
 *                       type: string
 *                       example: "MISSING_SESSION_ID"
 *       403:
 *         description: Unauthorized access to session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Unauthorized access to session"
 *                     code:
 *                       type: string
 *                       example: "UNAUTHORIZED_ACCESS"
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Session not found"
 *                     code:
 *                       type: string
 *                       example: "SESSION_NOT_FOUND"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to process simple words answers"
 *                     code:
 *                       type: string
 *                       example: "SIMPLE_WORDS_ANSWER_PROCESSING_FAILED"
 */
// POST /session/simple-words - Validate simple words quiz answers and return score
sessionRouter.post('/simple-words', authenticate, (req: Request, res: Response) => {
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

    const result = sessionService.validateSimpleWordsAnswers(sessionId, user.userId, answers);

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

/**
 * @swagger
 * /session/scores/{sessionId}:
 *   get:
 *     summary: Get score for a specific session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID
 *     responses:
 *       200:
 *         description: Session score retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   example: "12345"
 *                 score:
 *                   type: number
 *                   example: 2
 *                 total:
 *                   type: number
 *                   example: 3
 *       400:
 *         description: Missing session ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Session ID is required"
 *                     code:
 *                       type: string
 *                       example: "MISSING_SESSION_ID"
 *       404:
 *         description: Session score not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Session score not found"
 *                     code:
 *                       type: string
 *                       example: "SESSION_SCORE_NOT_FOUND"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to retrieve session score"
 *                     code:
 *                       type: string
 *                       example: "SESSION_SCORE_RETRIEVAL_FAILED"
 */
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

/**
 * @swagger
 * /session/scores:
 *   get:
 *     summary: Get all scores for current user's sessions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User session scores retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scores:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sessionId:
 *                         type: string
 *                         example: "12345"
 *                       score:
 *                         type: number
 *                         example: 2
 *                       total:
 *                         type: number
 *                         example: 3
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to retrieve user session scores"
 *                     code:
 *                       type: string
 *                       example: "USER_SESSION_SCORES_RETRIEVAL_FAILED"
 */
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

/**
 * @swagger
 * /session/all:
 *   get:
 *     summary: Get all sessions for current user
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "12345"
 *                       type:
 *                         type: string
 *                         example: "simple-math"
 *                       createdAt:
 *                         type: string
 *                         example: "2023-01-01T00:00:00Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Failed to retrieve user sessions"
 *                     code:
 *                       type: string
 *                       example: "USER_SESSIONS_RETRIEVAL_FAILED"
 */
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