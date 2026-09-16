import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './modules/auth/auth.router.js';
import { hrRouter } from './modules/hr/hr.router.js';
import { attendanceRouter } from './modules/attendance/attendance.router.js';
import { itsmRouter } from './modules/itsm/itsm.router.js';
import { itamRouter } from './modules/itam/itam.router.js';
import { dashboardRouter } from './modules/dashboard/dashboard.router.js';
import { auditRouter } from './modules/audit/audit.router.js';
import { notificationRouter } from './modules/notifications/notification.router.js';
import { aiRouter } from './modules/ai/ai.router.js';
import { MetricsService } from './modules/observability/metrics.service.js';
import { authenticateJwt } from './middleware/auth.js';

import { biometricPushRouter } from './modules/attendance/biometric.router.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security & Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.text({ type: ['text/*', 'application/octet-stream'] }));
app.use(express.json());

// Request logger
app.use((req: Request, _res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), platform: 'EmpOps Unified API v1.0.0' });
});

// Prometheus OpenMetrics Exporter (Scraped by Grafana / Prometheus / Datadog)
app.get('/api/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await MetricsService.getMetricsFormatted();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (err: any) {
    res.status(500).send(`# Error generating metrics: ${err.message}`);
  }
});

// In-App NOC Telemetry Summary for Web Portal
app.get('/api/observability/summary', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const summary = await MetricsService.getNocSummary(tenantId);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch NOC telemetry' });
  }
});

// In-App Native Telemetry Time-Series Datasets for Recharts Studio
app.get('/api/observability/time-series', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const range = (req.query.range as string) || '24h';
    const data = await MetricsService.getTimeSeriesData(tenantId, range);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch time-series telemetry' });
  }
});

// Mount modular routers
app.use('/api/auth', authRouter);
app.use('/api/hr', hrRouter);
app.use('/api/attendance/push', biometricPushRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/itsm', itsmRouter);
app.use('/api/itam', itamRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/audit', auditRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/ai', aiRouter);

// Global 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled API Exception:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 EmpOps Platform API running on http://localhost:${PORT}`);
  console.log(`📋 Health Check available at http://localhost:${PORT}/api/health`);
});
