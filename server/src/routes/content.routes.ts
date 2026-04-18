import { Router } from 'express';
import {
  getContents,
  createContent,
  updateContent,
  deleteContent,
  submitContent,
  approveContent,
  rejectContent,
  markAsRead,
} from '../controllers/content.controller.js';
import { getSubContentsByParent, createSubContent } from '../controllers/subContent.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { contentValidation } from '../validations/content.validation.js';
import { subContentValidation } from '../validations/subContent.validation.js';

const router = Router();

// ─── CRUD ─────────────────────────────────────────────────────────────────────
router.get('/', authenticate, getContents);
router.post('/', authenticate, upload.single('imageFile'), validate(contentValidation.createContent), createContent);
router.put('/:id', authenticate, upload.single('imageFile'), validate(contentValidation.updateContent), updateContent);
router.delete('/:id', authenticate, deleteContent);

// ─── Workflow Actions ─────────────────────────────────────────────────────────
router.patch('/:id/submit', authenticate, validate(contentValidation.processAction), submitContent);
router.patch('/:id/approve', authenticate, validate(contentValidation.reviewAction), approveContent);
router.patch('/:id/reject', authenticate, validate(contentValidation.rejectAction), rejectContent);
router.post('/:id/read', authenticate, validate(contentValidation.markRead), markAsRead);

// ─── Sub-Content ──────────────────────────────────────────────────────────────
router.get('/:parentId/sub-content', authenticate, getSubContentsByParent);
router.post('/:parentId/sub-content', authenticate, upload.single('imageFile'), validate(subContentValidation.createSubContent), createSubContent);

export default router;
