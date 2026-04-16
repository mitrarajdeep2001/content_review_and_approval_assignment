import { Request, Response, NextFunction } from 'express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const userCookie = req.cookies.cf_user_session;
  
  if (!userCookie) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = typeof userCookie === 'string' ? JSON.parse(userCookie) : userCookie;
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid session' });
  }
};
