import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getMe, createMyProfile } from '../controllers/users.controller.js';

const router = express.Router();

router.get('/me', requireAuth, getMe);
router.post('/me/profile', requireAuth, createMyProfile);

export default router;
