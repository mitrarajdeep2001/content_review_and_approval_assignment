import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

const sendErrorDev = (err: any, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: any, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err, {});
    error.message = err.message;
    error.name = err.name;

    // Handle Zod validation errors specially format
    if (error instanceof ZodError || error.name === 'ZodError') {
      const messages = error.errors.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`);
      const message = `Validation Error: ${messages.join(', ')}`;
      error = new AppError(message, 400);
    }

    sendErrorProd(error, res);
  } else {
    if (err instanceof ZodError || err.name === 'ZodError') {
      err.statusCode = 400;
      err.status = 'fail';
      err.message = 'Validation Error';
    }
    sendErrorDev(err, res);
  }
};
