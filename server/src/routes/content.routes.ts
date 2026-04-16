import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getContents,
  createContent,
  updateContent,
  deleteContent,
  submitContent,
  approveContent,
  rejectContent,
} from '../controllers/content.controller.js';
import { getSubContentsByParent, createSubContent } from '../controllers/subContent.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// ─── CRUD ─────────────────────────────────────────────────────────────────────
router.get('/', authenticate, getContents);
router.post('/', authenticate, upload.single('imageFile'), createContent);
router.put('/:id', authenticate, upload.single('imageFile'), updateContent);
router.delete('/:id', authenticate, deleteContent);

// ─── Workflow Actions ─────────────────────────────────────────────────────────
router.patch('/:id/submit', authenticate, submitContent);
router.patch('/:id/approve', authenticate, approveContent);
router.patch('/:id/reject', authenticate, rejectContent);

// ─── Sub-Content ──────────────────────────────────────────────────────────────
router.get('/:parentId/sub-content', authenticate, getSubContentsByParent);
router.post('/:parentId/sub-content', authenticate, upload.single('imageFile'), createSubContent);

export default router;
