import { Request, Response } from 'express';
import crypto from 'crypto';
import { contentService } from '../services/content.service.js';

export const getContents = async (req: Request, res: Response) => {
  try {
    const data = await contentService.fetchAllContents();
    res.status(200).json(data);
  } catch (error) {
    console.error('getContents error', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createContent = async (req: Request, res: Response) => {
  try {
    const userCookie = req.cookies.cf_user_session;
    if (!userCookie) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const user = JSON.parse(userCookie);
    
    if (user.role !== 'CREATOR') {
      return res.status(403).json({ message: 'Only creators can create content' });
    }

    const { title, description, body, status } = req.body;
    let image = req.body.image;

    if (req.file) {
      const host = req.protocol + '://' + req.get('host');
      image = `${host}/uploads/${req.file.filename}`;
    }

    const initialStatus = status === 'IN_REVIEW' ? 'IN_REVIEW' : 'DRAFT';

    const newContent = await contentService.createContent({
      title,
      description,
      body,
      image,
      status: initialStatus,
      createdBy: user.id
    }, user.id);

    // After creation, fetching the full list to return the correct populated content
    // Actually, just fetching all contents is wasteful, let's just assemble it for the response using the known new content.
    const contentWithHistory = {
      ...newContent,
      history: [
        {
          id: crypto.randomUUID(), // Temp ID for the frontend just so it has something right now
          action: initialStatus,
          actor: user.name,
          role: user.role,
          timestamp: newContent.createdAt.toISOString(),
          comment: initialStatus === 'IN_REVIEW' ? 'Submitted for review' : 'Draft created',
        }
      ]
    };

    res.status(201).json(contentWithHistory);
  } catch (error) {
    console.error('createContent error', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
