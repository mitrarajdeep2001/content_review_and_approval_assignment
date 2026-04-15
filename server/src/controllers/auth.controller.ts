import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await authService.validateUser(email, password);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Set cookie
    res.cookie('cf_user_session', JSON.stringify(user), {
      httpOnly: false, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error('Login controller error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('cf_user_session');
  return res.status(200).json({ message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
  const userCookie = req.cookies.cf_user_session;
  
  if (!userCookie) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const parsedUser = JSON.parse(userCookie);
    const user = await authService.getUserById(parsedUser.id);

    if (!user) {
      res.clearCookie('cf_user_session');
      return res.status(401).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('getMe controller error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
