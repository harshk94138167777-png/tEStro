import dotenv from 'dotenv';

// Prefer values from backend/.env over inherited OS env (fixes wrong MONGO_URI like cluster.mongodb.net).
dotenv.config({ override: true });
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectDB, isDbConnected } from './config/db.js';
import { getPlanLimitsPublic } from './config/plans.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '128kb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'tEStro API',
    stack: 'MERN',
    db: isDbConnected() ? 'connected' : 'disconnected',
    planLimits: getPlanLimitsPublic(),
    misuseWarning: 'Use only on authorized systems. Educational simulation only.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

async function start() {
  const hasSplitAtlas = Boolean(
    (process.env.MONGO_ATLAS_USER || '').trim() && (process.env.MONGO_ATLAS_HOST || '').trim()
  );
  const hasMongoUri = Boolean(process.env.MONGODB_URL || process.env.MONGO_URI);
  const missing = ['JWT_SECRET'].filter((k) => !process.env[k]);
  if (!hasSplitAtlas && !hasMongoUri) {
    missing.push('MongoDB: MONGO_URI / MONGODB_URL, or MONGO_ATLAS_USER + MONGO_ATLAS_HOST (+ password)');
  }
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  try {
    await connectDB();
  } catch (err) {
    console.error(err.message || err);
    console.error('Failed to connect to MongoDB. Exiting.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`tEStro API listening on port ${PORT}`);
  });
}

start();
