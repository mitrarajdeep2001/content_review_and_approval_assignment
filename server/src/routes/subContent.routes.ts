import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import {
  updateSubContent,
  deleteSubContent,
  submitSubContent,
  approveSubContent,
  rejectSubContent
} from '../controllers/subContent.controller.js';

const router = Router();

router.put('/:id', authenticate, upload.single('imageFile'), updateSubContent);
router.delete('/:id', authenticate, deleteSubContent);
router.patch('/:id/submit', authenticate, submitSubContent);
router.patch('/:id/approve', authenticate, approveSubContent);
router.patch('/:id/reject', authenticate, rejectSubContent);

export default router;
