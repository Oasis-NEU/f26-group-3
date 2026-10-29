import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';

// loads environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors()); // allows frontend to talk to this backend
app.use(express.json()); // allows server to parse JSON data from frontend

// test route
app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.use('/api', routes);

// start server
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

