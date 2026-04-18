import { Request, Response } from 'express';
import crypto from 'crypto';
import { contentService } from '../services/content.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

// ─── Helper: parse user from session cookie ───────────────────────────────────
function getSessionUser(req: Request) {
  const cookie = req.cookies?.cf_user_session;
  if (!cookie) return null;
  try {
    return JSON.parse(cookie);
  } catch {
    return null;
  }
}

// ─── GET /api/content ─────────────────────────────────────────────────────────
export const getContents = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { page, limit, search, status, tab } = req.query;
  
  const data = await contentService.fetchAllContents(user, {
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 10,
    search: search as string,
    status: status as string,
    tab: tab as string,
  });
  
  res.status(200).json(data);
});

// ─── POST /api/content ────────────────────────────────────────────────────────
export const createContent = catchAsync(async (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) throw new AppError('Not authenticated', 401);
  if (user.role !== 'CREATOR') {
    throw new AppError('Only creators can create content', 403);
  }

  const { title, description, body, status } = req.body;
  let image = req.body.image;
  if (req.file) {
    image = `/uploads/${req.file.filename}`;
  }

  const initialStatus = status === 'IN_REVIEW' ? 'IN_REVIEW' : 'DRAFT';

  const newContent = await contentService.createContent(
    { title, description, body, image, status: initialStatus, createdBy: user.id },
    user.id
  );

  // Build the response with history for the frontend
  const contentWithHistory = {
    ...newContent,
    history: [
      {
        id: crypto.randomUUID(),
        action: initialStatus === 'IN_REVIEW' ? 'SUBMITTED' : 'CREATED',
        actor: user.name,
        role: user.role,
        timestamp: newContent.createdAt.toISOString(),
        comment: initialStatus === 'IN_REVIEW' ? 'Submitted for review' : 'Draft created',
      },
    ],
  };

  res.status(201).json(contentWithHistory);
});

// ─── PUT /api/content/:id ─────────────────────────────────────────────────────
export const updateContent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = getSessionUser(req);
  if (!user) throw new AppError('Not authenticated', 401);

  const all = await contentService.fetchAllContents(user);
  const item = all.items.find((c: any) => c.id === id);
  if (!item) throw new AppError('Content not found', 404);
  if (item.status === 'IN_REVIEW' || item.status === 'APPROVED') {
    throw new AppError('Content is locked and cannot be edited', 403);
  }

  const { title, description, body } = req.body;
  let image = req.body.image;
  if (req.file) {
    image = `/uploads/${req.file.filename}`;
  }

  const updated = await contentService.updateContent(
    id,
    { title, description, body, image: image !== undefined ? image : item.image },
    user.id
  );
  res.status(200).json(updated);
});

// ─── DELETE /api/content/:id ──────────────────────────────────────────────────
export const deleteContent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = getSessionUser(req);
  if (!user) throw new AppError('Not authenticated', 401);

  const all = await contentService.fetchAllContents(user);
  const item = all.items.find((c: any) => c.id === id);
  if (!item) throw new AppError('Content not found', 404);
  if (item.status !== 'DRAFT') {
    throw new AppError('Content can only be deleted in DRAFT status', 403);
  }

  await contentService.deleteContent(id);
  res.status(200).json({ message: 'Content deleted successfully' });
});

// ─── PATCH /api/content/:id/submit ───────────────────────────────────────────
export const submitContent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = getSessionUser(req);
  if (!user) throw new AppError('Not authenticated', 401);
  if (user.role !== 'CREATOR') {
    throw new AppError('Only creators can submit content', 403);
  }

  try {
    const updated = await contentService.submitContent(id, user.id);
    res.status(200).json(updated);
  } catch (error: any) {
    const isKnown = error?.message?.includes('Only') || error?.message?.includes('DRAFT');
    throw new AppError(error?.message || 'Internal server error', isKnown ? 400 : 500);
  }
});

// ─── PATCH /api/content/:id/approve ──────────────────────────────────────────
export const approveContent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = getSessionUser(req);
  if (!user) throw new AppError('Not authenticated', 401);
  if (!['REVIEWER_L1', 'REVIEWER_L2'].includes(user.role)) {
    throw new AppError('Only reviewers can approve content', 403);
  }

  const { comment } = req.body;
  try {
    const updated = await contentService.approveContent(id, user.id, user.role, comment);

    // Return full updated content list item with fresh history
    const all = await contentService.fetchAllContents(user);
    const fresh = all.items.find((c: any) => c.id === id);
    res.status(200).json(fresh ?? updated);
  } catch (error: any) {
    const isKnown =
      error?.message?.includes('Only') ||
      error?.message?.includes('Stage') ||
      error?.message?.includes('IN_REVIEW');
    throw new AppError(error?.message || 'Internal server error', isKnown ? 400 : 500);
  }
});

// ─── PATCH /api/content/:id/reject ───────────────────────────────────────────
export const rejectContent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = getSessionUser(req);
  if (!user) throw new AppError('Not authenticated', 401);
  if (!['REVIEWER_L1', 'REVIEWER_L2'].includes(user.role)) {
    throw new AppError('Only reviewers can reject content', 403);
  }

  const { comment } = req.body;
  if (!comment || !comment.trim()) {
    throw new AppError('A comment is required when requesting changes', 400);
  }

  try {
    const updated = await contentService.rejectContent(id, user.id, user.role, comment);

    // Return fresh content with history
    const all = await contentService.fetchAllContents(user);
    const fresh = all.items.find((c: any) => c.id === id);
    res.status(200).json(fresh ?? updated);
  } catch (error: any) {
    const isKnown =
      error?.message?.includes('Only') ||
      error?.message?.includes('Stage') ||
      error?.message?.includes('IN_REVIEW');
    throw new AppError(error?.message || 'Internal server error', isKnown ? 400 : 500);
  }
});

// ─── POST /api/content/:id/read ────────────────────────────────────────────────
export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isSubContent } = req.body;
  const user = getSessionUser(req);
  if (!user) throw new AppError('Not authenticated', 401);

  await contentService.markAsRead(user.id, id, !!isSubContent);
  res.status(200).json({ message: 'Marked as read' });
});
