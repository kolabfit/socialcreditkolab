import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import reportsRoutes from './routes/reports.js';
import rubricsRoutes from './routes/rubrics.js';
import startupsRoutes from './routes/startups.js';
import batchRoutes from './routes/batches.js';
import activitiesRoutes from './routes/activities.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/rubrics', rubricsRoutes);
app.use('/api/startups', startupsRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/activities', activitiesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Terjadi kesalahan internal server.' });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   Ko+Lab Social Credit Score — API Server    ║
  ║──────────────────────────────────────────────║
  ║   🚀 Server running on port ${PORT}            ║
  ║   📡 API base: http://localhost:${PORT}/api     ║
  ║   ❤️  Health: http://localhost:${PORT}/api/health║
  ╚══════════════════════════════════════════════╝
  `);
});

export default app;
