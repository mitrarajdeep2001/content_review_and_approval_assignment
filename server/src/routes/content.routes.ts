import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getContents, createContent, updateContent, deleteContent } from '../controllers/content.controller.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
const router = Router();

router.get('/', getContents);
router.post('/', upload.single('imageFile'), createContent);
router.put('/:id', upload.single('imageFile'), updateContent);
router.delete('/:id', deleteContent);

export default router;
