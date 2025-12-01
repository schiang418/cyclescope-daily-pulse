/**
 * Newsletter Service
 * 
 * Orchestrates the complete newsletter generation workflow:
 * 1. Generate content with Gemini
 * 2. Generate audio with TTS
 * 3. Save to database
 */

import { generateNewsletterContent } from './geminiService.js';
import { generateNewsletterAudio } from './ttsService.js';
import { Newsletter } from '../models/newsletter.js';
import { config } from '../config.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Generate complete daily newsletter (content + audio)
 * 
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} - Newsletter record from database
 */
export async function generateDailyNewsletter(date) {
  console.log(`\n🚀 Starting newsletter generation for ${date}...`);
  
  try {
    // Step 1: Update status to 'generating'
    await Newsletter.create({
      publish_date: date,
      title: `Generating newsletter for ${date}...`,
      hook: '',
      sections: [],
      conclusion: '',
      sources: [],
      generation_status: 'generating',
    });

    // Step 2: Generate content with Gemini
    console.log('\n📝 Step 1: Generating content with Gemini...');
    const content = await generateNewsletterContent(date);
    
    // Step 3: Generate audio with TTS
    console.log('\n🎙️ Step 2: Generating audio with TTS...');
    const audioFileName = `daily-pulse-${date}.wav`;
    const audioPath = getAudioStoragePath(audioFileName);
    
    const audioResult = await generateNewsletterAudio(content, audioPath);
    
    // Step 4: Get audio URL
    const audioUrl = getAudioPublicUrl(audioFileName);
    
    // Step 5: Save complete newsletter to database
    console.log('\n💾 Step 3: Saving to database...');
    const newsletter = await Newsletter.create({
      publish_date: date,
      title: content.title,
      hook: content.hook,
      sections: content.sections,
      conclusion: content.conclusion,
      sources: content.sources || [],
      audio_url: audioUrl,
      audio_duration_seconds: audioResult.durationSeconds,
      generation_status: 'complete',
      error_message: null,
    });

    console.log(`\n✅ Newsletter generation complete!`);
    console.log(`   - Content: ${content.sections.length} sections`);
    console.log(`   - Sources: ${content.sources?.length || 0} citations`);
    console.log(`   - Audio: ${audioResult.durationSeconds}s`);
    console.log(`   - URL: ${audioUrl}`);

    return newsletter;

  } catch (error) {
    console.error(`\n❌ Newsletter generation failed:`, error);

    // Save error to database
    await Newsletter.create({
      publish_date: date,
      title: `Failed to generate newsletter for ${date}`,
      hook: '',
      sections: [],
      conclusion: '',
      sources: [],
      generation_status: 'failed',
      error_message: error.message,
    });

    throw error;
  }
}

/**
 * Get audio storage path (Railway Volume or local)
 */
function getAudioStoragePath(fileName) {
  // Use Railway Volume if available, otherwise local storage
  const storageDir = config.useS3 
    ? '/tmp/audio'  // Temporary for S3 upload
    : path.join(config.railwayVolumePath, 'audio');
  
  return path.join(storageDir, fileName);
}

/**
 * Get public URL for audio file
 */
function getAudioPublicUrl(fileName) {
  if (config.useS3) {
    // TODO: Upload to S3 and return S3 URL (Phase 4)
    return `${config.publicUrl}/audio/${fileName}`;
  } else {
    // Railway Volume served via static route
    return `${config.publicUrl}/audio/${fileName}`;
  }
}

/**
 * Ensure audio storage directory exists
 */
export async function ensureAudioStorageExists() {
  try {
    const audioDir = config.useS3
      ? '/tmp/audio'
      : path.join(config.railwayVolumePath, 'audio');
    
    await fs.mkdir(audioDir, { recursive: true });
    console.log(`✅ Audio storage directory ready: ${audioDir}`);
  } catch (error) {
    console.error('❌ Failed to create audio storage directory:', error);
    throw error;
  }
}

/**
 * Get newsletter by date (from database)
 */
export async function getNewsletterByDate(date) {
  return await Newsletter.getByDate(date);
}

/**
 * Get latest newsletter (from database)
 */
export async function getLatestNewsletter() {
  return await Newsletter.getLatest();
}

/**
 * Get newsletter history (from database)
 */
export async function getNewsletterHistory(limit = 30) {
  return await Newsletter.getHistory(limit);
}
