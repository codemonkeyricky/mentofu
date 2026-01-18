import { Request, Response, NextFunction } from 'express';
import { authService } from '../auth/auth.service';
import { User } from '../auth/auth.types';

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
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

  // Check if the user has parent privileges
  // We need to verify the user is actually an parent
  authService.getUserById(decoded.userId).then((user: User | null) => {
    if (!user || !user.isParent) {
      res.status(403).json({
        error: {
          message: 'Access denied. Admin privileges required.',
          code: 'FORBIDDEN'
        }
      });
      return;
    }

    // Add user info to request object
    (req as any).user = decoded;
    (req as any).isParent = true;

    next();
  }).catch(error => {
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    });
  });
};