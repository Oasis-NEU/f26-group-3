import 'dotenv/config';

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import cookieParser from 'cookie-parser';

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

app.use('/api', routes);

// start server
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
