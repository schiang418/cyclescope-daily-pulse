/**
 * Cleanup Service
 * 
 * Automatically removes old audio files and newsletter records
 * to maintain storage efficiency and comply with retention policies.
 * 
 * Retention Policy:
 * - Audio files: 14 days (2 weeks)
 * - Newsletter text: 365 days (1 year)
 */

import fs from 'fs/promises';
import path from 'path';
import { Newsletter } from '../models/newsletter.js';
import { config } from '../config.js';

/**
 * Retention periods in days
 */
const RETENTION_POLICY = {
  AUDIO_DAYS: 14,      // 2 weeks
  NEWSLETTER_DAYS: 365, // 1 year
};

/**
 * Run complete cleanup process
 * Cleans both audio files and database records
 */
export async function runCleanup() {
  console.log('\n🧹 Starting cleanup process...');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  const results = {
    audioFilesDeleted: 0,
    audioErrors: 0,
    newslettersDeleted: 0,
    databaseErrors: 0,
    startTime: new Date().toISOString(),
  };

  try {
    // Step 1: Clean audio files
    console.log('\n📁 Step 1: Cleaning audio files...');
    const audioResult = await cleanupAudioFiles();
    results.audioFilesDeleted = audioResult.deleted;
    results.audioErrors = audioResult.errors;
    
    // Step 2: Clean database records
    console.log('\n🗄️  Step 2: Cleaning database records...');
    const dbResult = await cleanupNewsletterRecords();
    results.newslettersDeleted = dbResult.deleted;
    results.databaseErrors = dbResult.errors;
    
    // Summary
    const duration = Date.now() - startTime;
    results.endTime = new Date().toISOString();
    results.durationMs = duration;
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Cleanup completed successfully');
    console.log('='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`  Audio files deleted:     ${results.audioFilesDeleted}`);
    console.log(`  Audio errors:            ${results.audioErrors}`);
    console.log(`  Newsletters deleted:     ${results.newslettersDeleted}`);
    console.log(`  Database errors:         ${results.databaseErrors}`);
    console.log(`  Duration:                ${duration}ms`);
    console.log('='.repeat(60));
    
    return results;
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    results.error = error.message;
    throw error;
  }
}

/**
 * Clean up audio files older than retention period
 */
async function cleanupAudioFiles() {
  const result = { deleted: 0, errors: 0, files: [] };
  
  try {
    // Get audio storage directory
    const audioDir = path.join(config.railwayVolumePath, 'audio');
    
    // Check if directory exists
    try {
      await fs.access(audioDir);
    } catch (error) {
      console.log(`⚠️  Audio directory does not exist: ${audioDir}`);
      return result;
    }
    
    // Get all audio files
    const files = await fs.readdir(audioDir);
    const wavFiles = files.filter(f => f.endsWith('.wav'));
    
    console.log(`📂 Found ${wavFiles.length} audio files in ${audioDir}`);
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_POLICY.AUDIO_DAYS);
    
    console.log(`🗓️  Cutoff date: ${cutoffDate.toISOString().split('T')[0]} (${RETENTION_POLICY.AUDIO_DAYS} days ago)`);
    
    // Process each file
    for (const file of wavFiles) {
      try {
        const filePath = path.join(audioDir, file);
        const stats = await fs.stat(filePath);
        
        // Check if file is older than retention period
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          result.deleted++;
          result.files.push({
            name: file,
            size: stats.size,
            modified: stats.mtime.toISOString(),
          });
          console.log(`  ✓ Deleted: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        }
      } catch (error) {
        console.error(`  ✗ Error deleting ${file}:`, error.message);
        result.errors++;
      }
    }
    
    if (result.deleted === 0) {
      console.log('  ℹ️  No audio files to delete');
    }
    
  } catch (error) {
    console.error('❌ Audio cleanup error:', error);
    result.errors++;
  }
  
  return result;
}

/**
 * Clean up newsletter records older than retention period
 */
async function cleanupNewsletterRecords() {
  const result = { deleted: 0, errors: 0, records: [] };
  
  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_POLICY.NEWSLETTER_DAYS);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    console.log(`🗓️  Cutoff date: ${cutoffDateStr} (${RETENTION_POLICY.NEWSLETTER_DAYS} days ago)`);
    
    // Get old newsletters (for logging)
    const oldNewsletters = await Newsletter.getOlderThan(cutoffDateStr);
    
    if (oldNewsletters.length === 0) {
      console.log('  ℹ️  No newsletter records to delete');
      return result;
    }
    
    console.log(`📋 Found ${oldNewsletters.length} old newsletter records`);
    
    // Delete old newsletters
    const deleteResult = await Newsletter.deleteOlderThan(cutoffDateStr);
    result.deleted = deleteResult.count;
    result.records = oldNewsletters.map(n => ({
      id: n.id,
      date: n.publish_date,
      title: n.title,
    }));
    
    console.log(`  ✓ Deleted ${result.deleted} newsletter records`);
    
  } catch (error) {
    console.error('❌ Database cleanup error:', error);
    result.errors++;
  }
  
  return result;
}

/**
 * Get cleanup statistics without deleting anything
 */
export async function getCleanupStats() {
  const stats = {
    audioFiles: {
      total: 0,
      toDelete: 0,
      totalSizeMB: 0,
      toDeleteSizeMB: 0,
    },
    newsletters: {
      total: 0,
      toDelete: 0,
    },
    cutoffDates: {
      audio: null,
      newsletter: null,
    },
  };
  
  try {
    // Audio stats
    const audioDir = path.join(config.railwayVolumePath, 'audio');
    const audioCutoff = new Date();
    audioCutoff.setDate(audioCutoff.getDate() - RETENTION_POLICY.AUDIO_DAYS);
    stats.cutoffDates.audio = audioCutoff.toISOString().split('T')[0];
    
    try {
      const files = await fs.readdir(audioDir);
      const wavFiles = files.filter(f => f.endsWith('.wav'));
      stats.audioFiles.total = wavFiles.length;
      
      for (const file of wavFiles) {
        const filePath = path.join(audioDir, file);
        const fileStats = await fs.stat(filePath);
        const sizeMB = fileStats.size / 1024 / 1024;
        stats.audioFiles.totalSizeMB += sizeMB;
        
        if (fileStats.mtime < audioCutoff) {
          stats.audioFiles.toDelete++;
          stats.audioFiles.toDeleteSizeMB += sizeMB;
        }
      }
    } catch (error) {
      // Directory doesn't exist, that's ok
    }
    
    // Newsletter stats
    const newsletterCutoff = new Date();
    newsletterCutoff.setDate(newsletterCutoff.getDate() - RETENTION_POLICY.NEWSLETTER_DAYS);
    stats.cutoffDates.newsletter = newsletterCutoff.toISOString().split('T')[0];
    
    const allNewsletters = await Newsletter.getAll();
    stats.newsletters.total = allNewsletters.length;
    
    const oldNewsletters = await Newsletter.getOlderThan(stats.cutoffDates.newsletter);
    stats.newsletters.toDelete = oldNewsletters.length;
    
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
  }
  
  return stats;
}
