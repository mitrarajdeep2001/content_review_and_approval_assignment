import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await authService.validateUser(email, password);

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Set cookie
  res.cookie('cf_user_session', JSON.stringify(user), {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  return res.status(200).json(user);
});

export const logout = (req: Request, res: Response) => {
  res.clearCookie('cf_user_session');
  return res.status(200).json({ message: 'Logged out successfully' });
};

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const userCookie = req.cookies.cf_user_session;
  
  if (!userCookie) {
    throw new AppError('Not authenticated', 401);
  }

  const parsedUser = JSON.parse(userCookie);
  const user = await authService.getUserById(parsedUser.id);

  if (!user) {
    res.clearCookie('cf_user_session');
    throw new AppError('User not found', 401);
  }

  return res.status(200).json(user);
});
