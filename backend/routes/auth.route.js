import express from 'express';
import { sendLink, confirmLink, logout } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/send-link', sendLink);
router.post('/confirm', confirmLink);
router.post('/logout', logout);

export default router;