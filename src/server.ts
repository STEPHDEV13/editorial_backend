import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import articleRoutes from './routes/articles';
import categoryRoutes from './routes/categories';
import networkRoutes from './routes/networks';
import notificationRoutes from './routes/notifications';
import importRoutes from './routes/import';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/articles', articleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/networks', networkRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/import', importRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  CMS Editorial API is running`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   Env:     ${process.env.NODE_ENV ?? 'development'}\n`);
});

export default app;
