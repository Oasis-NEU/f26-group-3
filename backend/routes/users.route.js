import axios from 'axios';
import express from 'express';
import { getUsers } from '../config/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const users = await getUsers();
  res.json(users);
});