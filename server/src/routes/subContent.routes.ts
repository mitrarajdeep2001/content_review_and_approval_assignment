import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { subContentValidation } from '../validations/subContent.validation.js';
import {
  updateSubContent,
  deleteSubContent,
  submitSubContent,
  approveSubContent,
  rejectSubContent
} from '../controllers/subContent.controller.js';

const router = Router();

router.put('/:id', authenticate, upload.single('imageFile'), validate(subContentValidation.updateSubContent), updateSubContent);
router.delete('/:id', authenticate, deleteSubContent);
router.patch('/:id/submit', authenticate, validate(subContentValidation.processAction), submitSubContent);
router.patch('/:id/approve', authenticate, validate(subContentValidation.reviewAction), approveSubContent);
router.patch('/:id/reject', authenticate, validate(subContentValidation.rejectAction), rejectSubContent);

export default router;
