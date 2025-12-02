/**
 * Cleanup API Routes
 * 
 * Provides endpoints for manual cleanup and monitoring
 */

import express from 'express';
import { runCleanup, getCleanupStats } from '../services/cleanupService.js';
import { getSchedulerStatus } from '../services/cronScheduler.js';

const router = express.Router();

/**
 * POST /api/cleanup/run
 * Manually trigger cleanup process
 */
router.post('/run', async (req, res) => {
  try {
    console.log('🧹 Manual cleanup triggered via API');
    const results = await runCleanup();
    
    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      results,
    });
  } catch (error) {
    console.error('❌ Manual cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Cleanup failed',
        details: error.message,
      },
    });
  }
});

/**
 * GET /api/cleanup/stats
 * Get cleanup statistics without deleting anything
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getCleanupStats();
    
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('❌ Failed to get cleanup stats:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get cleanup stats',
        details: error.message,
      },
    });
  }
});

/**
 * GET /api/cleanup/scheduler
 * Get scheduler status
 */
router.get('/scheduler', (req, res) => {
  try {
    const status = getSchedulerStatus();
    
    res.json({
      success: true,
      scheduler: status,
    });
  } catch (error) {
    console.error('❌ Failed to get scheduler status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get scheduler status',
        details: error.message,
      },
    });
  }
});

export default router;
