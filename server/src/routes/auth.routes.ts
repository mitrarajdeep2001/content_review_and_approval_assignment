import { Router } from 'express';
import { login, logout, getMe } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authValidation } from '../validations/auth.validation.js';

const router = Router();

router.post('/login', validate(authValidation.login), login);
router.post('/logout', logout);
router.get('/me', getMe);

export default router;
