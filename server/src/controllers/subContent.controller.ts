import { Request, Response } from 'express';
import { subContentService } from '../services/subContent.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

export const getSubContentsByParent = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const list = await subContentService.getSubContentsByParent(req.params.parentId, user);
  res.json(list);
});

export const createSubContent = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const body = { ...req.body };
  
  if (req.file) {
    body.image = req.file.path;
  }

  const item = await subContentService.createSubContent(req.params.parentId, body, user.id);
  res.status(201).json(item);
});

export const updateSubContent = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const body = { ...req.body };

  if (req.file) {
    body.image = req.file.path;
  }

  const item = await subContentService.updateSubContent(req.params.id, body, user.id);
  res.json(item);
});

export const deleteSubContent = catchAsync(async (req: Request, res: Response) => {
  await subContentService.deleteSubContent(req.params.id);
  res.status(204).end();
});

export const submitSubContent = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const item = await subContentService.submitSubContent(req.params.id, user.id);
  res.json(item);
});

export const approveSubContent = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { comment } = req.body;
  const item = await subContentService.approveSubContent(req.params.id, user.id, user.role, comment);
  res.json(item);
});

export const rejectSubContent = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { comment } = req.body;
  const item = await subContentService.rejectSubContent(req.params.id, user.id, user.role, comment);
  res.json(item);
});
