import express from 'express';
import cors from 'cors';
import path from 'path';
import { config, validateConfig } from './config.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './utils/error-handler.js';
import newsletterRoutes from './routes/newsletter.js';
import { ensureAudioStorageExists } from './services/newsletterService.js';

// Validate configuration on startup
try {
  validateConfig();
  logger.success('Configuration validated successfully');
  
  // Ensure audio storage directory exists
  await ensureAudioStorageExists();
  
} catch (error) {
  logger.error('Startup failed:', error.message);
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'CycleScope Daily Pulse API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      newsletter: {
        generate: 'POST /api/newsletter/generate',
        latest: 'GET /api/newsletter/latest',
        history: 'GET /api/newsletter/history',
        byDate: 'GET /api/newsletter/:date',
      },
    },
  });
});

// Serve audio files from storage
const audioDir = config.useS3
  ? '/tmp/audio'
  : path.join(config.railwayVolumePath, 'audio');
app.use('/audio', express.static(audioDir));

// API routes
app.use('/api/newsletter', newsletterRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      statusCode: 404,
      path: req.path,
    },
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.success(`🚀 Server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
