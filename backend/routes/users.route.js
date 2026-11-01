import express from 'express';
import { getUsers } from '../config/supabase.js';
import requireAuth from '../middleware/requireAuth.js';
import { getMe } from '../controllers/users.controller.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const users = await getUsers();
  res.json(users);
});

router.get('/me', requireAuth, getMe);

export default router;
