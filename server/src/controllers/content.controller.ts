import { Request, Response } from 'express';
import crypto from 'crypto';
import { contentService } from '../services/content.service.js';

export const getContents = async (req: Request, res: Response) => {
  try {
    const data = await contentService.fetchAllContents();
    const withHistory = data.map(item => ({ ...item, history: [] }));
    res.status(200).json(withHistory);
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

    const { title, description, body } = req.body;
    let image = req.body.image;

    if (req.file) {
      const host = req.protocol + '://' + req.get('host');
      image = `${host}/uploads/${req.file.filename}`;
    }

    const newContent = await contentService.createContent({
      title,
      description,
      body,
      image,
      createdBy: user.id
    });

    const contentWithHistory = {
      ...newContent,
      history: [
        {
          id: crypto.randomUUID(),
          action: 'CREATED',
          actor: user.name,
          role: user.role,
          timestamp: newContent.createdAt,
          comment: 'Draft created',
        }
      ]
    };

    res.status(201).json(contentWithHistory);
  } catch (error) {
    console.error('createContent error', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
