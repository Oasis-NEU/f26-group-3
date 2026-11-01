import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';

// loads environment variables from .env file
dotenv.config();

// Refuse to start without a real secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('Missing or weak JWT_SECRET in .env');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
})); // allows frontend to talk to this backend
app.use(express.json({ limit: '10kb' })); // allows server to parse JSON data from frontend
app.use(cookieParser()); // lets us read the JWT cookie

// TEMPORARY: replace with the real database later
//Users disappear every time the server restarts.
const users = [];

// payload holds only the user's id: anyone with the token can read it
function createToken(user) {
  return jwt.sign({}, JWT_SECRET, {
    algorithm: 'HS256',
    subject: user.id,
    expiresIn: '7d',
  });
}

const cookieOptions = {
  httpOnly: true,                                 // browser JS can't read it
  secure: process.env.NODE_ENV === 'production',  // HTTPS only when deployed
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,               // 7 days, matches the token expiry
};

// what a user looks like in API responses (never include passwordHash)
function publicUser(user) {
  return { id: user.id, email: user.email };
}

// protects routes: only requests with a valid JWT get through
function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not logged in.' });

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const user = users.find(u => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: 'Not logged in.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// ---------- routes ----------

// test route
app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

// sign up
app.post('/api/users', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password;

  if (!/^[a-z0-9._%+-]+@northeastern\.edu$/.test(email)) {
    return res.status(400).json({ error: 'Use your @northeastern.edu email.' });
  }
  if (typeof password !== 'string' || password.length < 12) {
    return res.status(400).json({ error: 'Password must be at least 12 characters.' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const user = {
    id: randomUUID(),
    email,
    passwordHash: await bcrypt.hash(password, 12),
  };
  users.push(user);

  res.cookie('token', createToken(user), cookieOptions);
  res.status(201).json({ user: { id: user.id, email: user.email } });
});

// log in
app.post('/api/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password;

  const user = users.find(u => u.email === email);
  const passwordOk = user && typeof password === 'string'
    && await bcrypt.compare(password, user.passwordHash);

  // same message whether the email or the password was wrong
  if (!passwordOk) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  res.cookie('token', createToken(user), cookieOptions);
  res.json({ user: { id: user.id, email: user.email } });
});

app.get('/api/users/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email } });
});

// get the logged-in user (protected)
app.get('/api/users/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});
 
// log out
app.post('/api/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.json({ ok: true });
});

// ---------- start server ----------
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
