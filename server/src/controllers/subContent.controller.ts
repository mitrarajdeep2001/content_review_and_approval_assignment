import { Request, Response } from 'express';
import { subContentService } from '../services/subContent.service.js';

export const getSubContentsByParent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const list = await subContentService.getSubContentsByParent(req.params.parentId, user);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createSubContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const body = { ...req.body };
    
    if (req.file) {
      body.image = req.file.path;
    }

    const item = await subContentService.createSubContent(req.params.parentId, body, user.id);
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateSubContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const body = { ...req.body };

    if (req.file) {
      body.image = req.file.path;
    }

    const item = await subContentService.updateSubContent(req.params.id, body, user.id);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteSubContent = async (req: Request, res: Response) => {
  try {
    await subContentService.deleteSubContent(req.params.id);
    res.status(204).end();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const submitSubContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const item = await subContentService.submitSubContent(req.params.id, user.id);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const approveSubContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { comment } = req.body;
    const item = await subContentService.approveSubContent(req.params.id, user.id, user.role, comment);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const rejectSubContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { comment } = req.body;
    const item = await subContentService.rejectSubContent(req.params.id, user.id, user.role, comment);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
