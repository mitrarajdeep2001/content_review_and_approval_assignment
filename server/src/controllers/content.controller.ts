import { Request, Response } from 'express';
import crypto from 'crypto';
import { contentService } from '../services/content.service.js';

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
export const getContents = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { page, limit, search, status } = req.query;
    
    const data = await contentService.fetchAllContents(user, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      search: search as string,
      status: status as string,
    });
    
    res.status(200).json(data);
  } catch (error) {
    console.error('getContents error', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── POST /api/content ────────────────────────────────────────────────────────
export const createContent = async (req: Request, res: Response) => {
  try {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    if (user.role !== 'CREATOR') {
      return res.status(403).json({ message: 'Only creators can create content' });
    }

    const { title, description, body, status } = req.body;
    let image = req.body.image;
    if (req.file) {
      image = req.file.path;
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
  } catch (error) {
    console.error('createContent error', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── PUT /api/content/:id ─────────────────────────────────────────────────────
export const updateContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    const all = await contentService.fetchAllContents(user);
    const item = all.find((c) => c.id === id);
    if (!item) return res.status(404).json({ message: 'Content not found' });
    if (item.status === 'IN_REVIEW' || item.status === 'APPROVED') {
      return res.status(403).json({ message: 'Content is locked and cannot be edited' });
    }

    const { title, description, body } = req.body;
    let image = req.body.image;
    if (req.file) {
      image = req.file.path;
    }

    const updated = await contentService.updateContent(
      id,
      { title, description, body, image: image !== undefined ? image : item.image },
      user.id
    );
    res.status(200).json(updated);
  } catch (error) {
    console.error('updateContent error', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── DELETE /api/content/:id ──────────────────────────────────────────────────
export const deleteContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    const all = await contentService.fetchAllContents(user);
    const item = all.find((c) => c.id === id);
    if (!item) return res.status(404).json({ message: 'Content not found' });
    if (item.status !== 'DRAFT') {
      return res.status(403).json({ message: 'Content can only be deleted in DRAFT status' });
    }

    await contentService.deleteContent(id);
    res.status(200).json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('deleteContent error', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── PATCH /api/content/:id/submit ───────────────────────────────────────────
export const submitContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    if (user.role !== 'CREATOR') {
      return res.status(403).json({ message: 'Only creators can submit content' });
    }

    const updated = await contentService.submitContent(id, user.id);
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('submitContent error', error);
    const isKnown = error?.message?.includes('Only') || error?.message?.includes('DRAFT');
    res.status(isKnown ? 400 : 500).json({ message: error?.message || 'Internal server error' });
  }
};

// ─── PATCH /api/content/:id/approve ──────────────────────────────────────────
export const approveContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    if (!['REVIEWER_L1', 'REVIEWER_L2'].includes(user.role)) {
      return res.status(403).json({ message: 'Only reviewers can approve content' });
    }

    const { comment } = req.body;
    const updated = await contentService.approveContent(id, user.id, user.role, comment);

    // Return full updated content list item with fresh history
    const all = await contentService.fetchAllContents(user);
    const fresh = all.find((c) => c.id === id);
    res.status(200).json(fresh ?? updated);
  } catch (error: any) {
    console.error('approveContent error', error);
    const isKnown =
      error?.message?.includes('Only') ||
      error?.message?.includes('Stage') ||
      error?.message?.includes('IN_REVIEW');
    res.status(isKnown ? 400 : 500).json({ message: error?.message || 'Internal server error' });
  }
};

// ─── PATCH /api/content/:id/reject ───────────────────────────────────────────
export const rejectContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    if (!['REVIEWER_L1', 'REVIEWER_L2'].includes(user.role)) {
      return res.status(403).json({ message: 'Only reviewers can reject content' });
    }

    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'A comment is required when requesting changes' });
    }

    const updated = await contentService.rejectContent(id, user.id, user.role, comment);

    // Return fresh content with history
    const all = await contentService.fetchAllContents(user);
    const fresh = all.find((c) => c.id === id);
    res.status(200).json(fresh ?? updated);
  } catch (error: any) {
    console.error('rejectContent error', error);
    const isKnown =
      error?.message?.includes('Only') ||
      error?.message?.includes('Stage') ||
      error?.message?.includes('IN_REVIEW');
    res.status(isKnown ? 400 : 500).json({ message: error?.message || 'Internal server error' });
  }
};
