/**
 * Cron Scheduler
 * 
 * Schedules automatic cleanup tasks to run daily
 * 
 * Schedule: Every day at 2:00 AM (server time)
 * Tasks: Clean old audio files and newsletter records
 */

import cron from 'node-cron';
import { runCleanup } from './cleanupService.js';

let cleanupJob = null;

/**
 * Start the cleanup cron job
 */
export function startCleanupScheduler() {
  // Stop existing job if running
  if (cleanupJob) {
    cleanupJob.stop();
  }

  // Schedule: Every day at 2:00 AM
  // Cron format: second minute hour day month weekday
  // '0 2 * * *' = At 02:00 every day
  cleanupJob = cron.schedule('0 2 * * *', async () => {
    console.log('\n⏰ Scheduled cleanup triggered at:', new Date().toISOString());
    
    try {
      const results = await runCleanup();
      console.log('✅ Scheduled cleanup completed:', results);
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'UTC', // Use UTC to avoid timezone issues
  });

  console.log('✅ Cleanup scheduler started');
  console.log('📅 Schedule: Daily at 02:00 UTC');
  console.log('🧹 Tasks: Clean audio files (>14 days) and newsletters (>365 days)');
  
  return cleanupJob;
}

/**
 * Stop the cleanup scheduler
 */
export function stopCleanupScheduler() {
  if (cleanupJob) {
    cleanupJob.stop();
    cleanupJob = null;
    console.log('🛑 Cleanup scheduler stopped');
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    running: cleanupJob !== null,
    schedule: '0 2 * * * (Daily at 02:00 UTC)',
    nextRun: cleanupJob ? getNextRunTime() : null,
  };
}

/**
 * Calculate next run time
 */
function getNextRunTime() {
  const now = new Date();
  const next = new Date(now);
  
  // Set to 2:00 AM
  next.setUTCHours(2, 0, 0, 0);
  
  // If 2:00 AM has already passed today, schedule for tomorrow
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  
  return next.toISOString();
}
