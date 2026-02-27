import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import authRoutes from './routes/auth.js';
import soundcloudRoutes from './routes/soundcloud.js';
import reviewRoutes from './routes/reviews.js';
import feedRoutes from './routes/feed.js';
import userRoutes from './routes/users.js';
import reviewRequestRoutes from './routes/reviewRequests.js';

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

connectDB();
initSocket(httpServer);

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/soundcloud', soundcloudRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/users', userRoutes);
app.use('/api/review-requests', reviewRequestRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

httpServer.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
