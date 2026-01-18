import { Router, Request, Response } from 'express';
import { authService } from './auth.service';
import { AuthResponse } from './auth.types';

export const authRouter = Router();

// POST /auth/register - Register a new user
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, isParent } = req.body;

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
    const user = await authService.register(username, password, isParent || false);

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