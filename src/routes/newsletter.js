/**
 * Newsletter API Routes
 * 
 * Endpoints:
 * - POST /api/newsletter/generate - Generate newsletter for a specific date
 * - GET /api/newsletter/latest - Get latest newsletter
 * - GET /api/newsletter/history - Get newsletter history
 * - GET /api/newsletter/:date - Get newsletter by date
 * 
 * IMPORTANT: Specific routes (/latest, /history) must be defined BEFORE /:date
 * to avoid being caught by the date parameter route.
 */

import express from 'express';
import {
  generateDailyNewsletter,
  getNewsletterByDate,
  getLatestNewsletter,
  getNewsletterHistory,
} from '../services/newsletterService.js';

const router = express.Router();

/**
 * POST /api/newsletter/generate
 * Generate newsletter for a specific date
 * 
 * Body: { date: "YYYY-MM-DD" }
 * Auth: Requires API_SECRET_KEY
 */
router.post('/generate', async (req, res) => {
  try {
    // API key authentication
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_SECRET_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    console.log(`📨 API request: Generate newsletter for ${date}`);

    // Return immediately with 202 Accepted and generate in background
    // This prevents HTTP timeout issues during long-running generation (4-5 minutes)
    res.status(202).json({
      success: true,
      message: 'Newsletter generation started',
      date: date,
      status: 'generating',
      estimated_duration: '4-5 minutes',
    });

    // Generate newsletter in background (async, takes 4-5 minutes)
    // Don't await - let it run independently
    generateDailyNewsletter(date)
      .then(newsletter => {
        console.log(`✅ Newsletter generation completed for ${date}`);
        console.log(`   - Title: ${newsletter.title}`);
        console.log(`   - Audio: ${newsletter.audio_duration_seconds}s`);
      })
      .catch(error => {
        console.error(`❌ Newsletter generation failed for ${date}:`, error);
      });

  } catch (error) {
    console.error('❌ Generate newsletter error:', error);
    res.status(500).json({
      error: 'Failed to generate newsletter',
      message: error.message,
    });
  }
});

/**
 * GET /api/newsletter/latest
 * Get the latest published newsletter
 */
router.get('/latest', async (req, res) => {
  try {
    const newsletter = await getLatestNewsletter();

    if (!newsletter) {
      return res.status(404).json({ error: 'No newsletters found' });
    }

    res.json({
      success: true,
      newsletter: formatNewsletterResponse(newsletter, req),
    });

  } catch (error) {
    console.error('❌ Get latest newsletter error:', error);
    res.status(500).json({
      error: 'Failed to retrieve newsletter',
      message: error.message,
    });
  }
});

/**
 * GET /api/newsletter/history
 * Get newsletter history (last 30 days by default)
 * 
 * IMPORTANT: Must be defined BEFORE /:date route to avoid being caught by date parameter
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;

    if (limit < 1 || limit > 365) {
      return res.status(400).json({ error: 'Limit must be between 1 and 365' });
    }

    const newsletters = await getNewsletterHistory(limit);

    res.json({
      success: true,
      count: newsletters.length,
      newsletters: newsletters.map(n => formatNewsletterResponse(n, req)),
    });

  } catch (error) {
    console.error('❌ Get newsletter history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve newsletter history',
      message: error.message,
    });
  }
});

/**
 * GET /api/newsletter/:date
 * Get newsletter by specific date
 * 
 * IMPORTANT: Must be defined AFTER specific routes (/latest, /history)
 */
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const newsletter = await getNewsletterByDate(date);

    if (!newsletter) {
      return res.status(404).json({ error: `No newsletter found for ${date}` });
    }

    res.json({
      success: true,
      newsletter: formatNewsletterResponse(newsletter, req),
    });

  } catch (error) {
    console.error('❌ Get newsletter by date error:', error);
    res.status(500).json({
      error: 'Failed to retrieve newsletter',
      message: error.message,
    });
  }
});

/**
 * Format newsletter for API response
 * Fixes audio URL to use correct public domain
 */
function formatNewsletterResponse(newsletter, req) {
  // Fix audio URL if it's localhost
  let audioUrl = newsletter.audio_url;
  if (audioUrl && audioUrl.includes('localhost')) {
    // Extract the audio filename from the URL
    const audioFileName = audioUrl.split('/').pop();
    // Build correct public URL using request host
    const protocol = req.protocol || 'https';
    const host = req.get('host');
    audioUrl = `${protocol}://${host}/audio/${audioFileName}`;
  }

  return {
    id: newsletter.id,
    publish_date: newsletter.publish_date,
    publishDate: newsletter.publish_date, // Add camelCase alias for frontend compatibility
    title: newsletter.title,
    hook: newsletter.hook,
    sections: newsletter.sections,
    conclusion: newsletter.conclusion,
    sources: newsletter.sources,
    audio_url: audioUrl,
    audioUrl: audioUrl, // Add camelCase alias for frontend compatibility
    audio_duration_seconds: newsletter.audio_duration_seconds,
    generation_status: newsletter.generation_status,
    created_at: newsletter.created_at,
    updated_at: newsletter.updated_at,
    updatedAt: newsletter.updated_at, // Add camelCase alias for frontend compatibility
  };
}

export default router;


/**
 * DELETE /api/newsletter/:id
 * Delete a newsletter by ID (admin only)
 * Requires API key authentication
 */
router.delete('/:id', async (req, res) => {
  try {
    // API key authentication
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_SECRET_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid newsletter ID' });
    }

    // Import Newsletter model
    const { Newsletter } = await import('../models/newsletter.js');
    
    // Check if newsletter exists
    const existing = await Newsletter.getById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }

    // Delete the newsletter
    await Newsletter.deleteById(id);

    res.json({
      success: true,
      message: `Newsletter ID ${id} deleted successfully`,
      deleted: {
        id: existing.id,
        title: existing.title,
        publish_date: existing.publish_date,
      },
    });

  } catch (error) {
    console.error('❌ Delete newsletter error:', error);
    res.status(500).json({
      error: 'Failed to delete newsletter',
      message: error.message,
     });
  }
});
