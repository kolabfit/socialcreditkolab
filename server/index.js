import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import reportsRoutes from './routes/reports.js';
import rubricsRoutes from './routes/rubrics.js';
import startupsRoutes from './routes/startups.js';
import batchRoutes from './routes/batches.js';
import activitiesRoutes from './routes/activities.js';
import integrationRoutes from './routes/integration.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
// CORS hanya untuk origin yang didaftarkan di CORS_ORIGIN (pisahkan dengan koma).
// Saat dev, frontend lewat proxy Vite (same-origin) sehingga tidak butuh CORS.
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/rubrics', rubricsRoutes);
app.use('/api/startups', startupsRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/integration', integrationRoutes);

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

// Listen hanya kalau dijalankan langsung (bukan di-import oleh test)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`Ko+Lab Social Credit Score API running on http://localhost:${PORT}/api`);
  });
}

export default app;
