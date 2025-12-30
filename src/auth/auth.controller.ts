import { Router, Request, Response } from 'express';
import { authService } from './auth.service';
import { AuthResponse } from './auth.types';

export const authRouter = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 description: The user's password
 *                 example: "secure_password"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "12345"
 *                     username:
 *                       type: string
 *                       example: "john_doe"
 *       400:
 *         description: Missing credentials
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
 *                       example: "Username and password are required"
 *                     code:
 *                       type: string
 *                       example: "MISSING_CREDENTIALS"
 *       409:
 *         description: Username already taken
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
 *                       example: "Username already taken"
 *                     code:
 *                       type: string
 *                       example: "USERNAME_TAKEN"
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
 *                       example: "Failed to register user"
 *                     code:
 *                       type: string
 *                       example: "USER_REGISTRATION_FAILED"
 */
// POST /auth/register - Register a new user
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: {
          message: 'Username and password are required',
          code: 'MISSING_CREDENTIALS'
        }
      });
    }

    // Register user
    const user = await authService.register(username, password);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error: any) {
    if (error.message === 'User already exists') {
      return res.status(409).json({
        error: {
          message: 'Username already taken',
          code: 'USERNAME_TAKEN'
        }
      });
    }

    console.error('Error registering user:', error);
    res.status(500).json({
      error: {
        message: 'Failed to register user',
        code: 'USER_REGISTRATION_FAILED'
      }
    });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and return JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 description: The user's password
 *                 example: "secure_password"
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "12345"
 *                     username:
 *                       type: string
 *                       example: "john_doe"
 *       400:
 *         description: Missing credentials
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
 *                       example: "Username and password are required"
 *                     code:
 *                       type: string
 *                       example: "MISSING_CREDENTIALS"
 *       401:
 *         description: Invalid credentials
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
 *                       example: "Invalid username or password"
 *                     code:
 *                       type: string
 *                       example: "INVALID_CREDENTIALS"
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
 *                       example: "Failed to login user"
 *                     code:
 *                       type: string
 *                       example: "USER_LOGIN_FAILED"
 */
// POST /auth/login - Login user and return JWT token
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: {
          message: 'Username and password are required',
          code: 'MISSING_CREDENTIALS'
        }
      });
    }

    // Login user
    const authResponse = await authService.login(username, password);

    res.status(200).json(authResponse);
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        error: {
          message: 'Invalid username or password',
          code: 'INVALID_CREDENTIALS'
        }
      });
    }

    console.error('Error logging in user:', error);
    res.status(500).json({
      error: {
        message: 'Failed to login user',
        code: 'USER_LOGIN_FAILED'
      }
    });
  }
});