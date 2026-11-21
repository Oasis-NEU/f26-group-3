import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getMe, createMe, updateMe } from '../controllers/users.controller.js';

const router = express.Router();

router.get('/me', requireAuth, getMe);
router.post('/me/profile', requireAuth, createMe);
router.patch('/me', requireAuth, updateMe);

export default router;
