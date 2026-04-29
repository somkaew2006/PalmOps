import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Add user from payload to request
      (req as any).user = decoded;
      
      next();
    } catch (error) {
      console.error('JWT verification failed:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  } else {
    console.warn('[AuthMiddleware] No token found in headers:', req.headers);
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as any).user?.role;
    
    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({ 
        message: `Role ${userRole} is not authorized to access this route` 
      });
      return;
    }
    
    next();
  };
};
