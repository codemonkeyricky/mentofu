import { Request, Response, NextFunction } from 'express';
import { authService } from '../auth/auth.service';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        message: 'Authorization token is missing or invalid',
        code: 'AUTH_TOKEN_REQUIRED'
      }
    });
    return;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  // Verify token
  const decoded = authService.verifyToken(token);

  if (!decoded) {
    res.status(401).json({
      error: {
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      }
    });
    return;
  }

  // Add user info to request object
  (req as any).user = decoded;

  next();
};