import 'dotenv/config'; // loads environment variables from .env

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true, // lets the browser send the session cookies
})); // allows frontend to talk to this backend
app.use(express.json({ limit: '10kb' })); // allows server to parse JSON data from frontend
app.use(cookieParser()); // lets us read the session cookies (see utils/authCookies.js)

// ---------- routes ----------

// test route
app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.use('/api', routes);

// Anything that throws ends up here: log it, but don't send internals to the browser.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'something went wrong. please try again.' });
});

// start server
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
