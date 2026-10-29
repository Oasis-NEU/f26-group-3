import express from 'express';
import { getUsers } from '../config/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const users = await getUsers();
  res.json(users);
});

export default router;
