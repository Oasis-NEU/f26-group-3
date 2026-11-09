import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getMe, updateMe } from '../controllers/users.controller.js';

const router = express.Router();

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, updateMe);

export default router;
