/**
 * Gemini AI Service
 * 
 * Handles newsletter content generation using Google Gemini API
 * with Search Grounding for real-time market data
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Generate daily market newsletter using Gemini 2.0 Flash
 * with Search Grounding for real-time market data
 */
export async function generateNewsletterContent(date) {
  try {
    console.log(`📝 Generating newsletter for ${date}...`);

    // Use gemini-2.0-flash-exp model with search grounding
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });

    // Prompt for daily market pulse newsletter
    const prompt = `You are a professional financial analyst writing the "Daily Market Pulse" newsletter for ${date}.

TASK: Create a concise, actionable daily market summary for professional investors.

STRUCTURE:
1. **Hook** (1-2 sentences): Eye-catching opening that captures the day's most important market move
2. **Section 1: Market Overview** (2-3 paragraphs):
   - Major index performance (S&P 500, Nasdaq, Dow)
   - Key sector movers
   - Market breadth and sentiment
3. **Section 2: Key Drivers** (2-3 paragraphs):
   - Economic data releases
   - Fed/central bank news
   - Geopolitical events
   - Corporate earnings highlights
4. **Section 3: What to Watch** (1-2 paragraphs):
   - Upcoming catalysts
   - Technical levels to monitor
   - Risk factors
5. **Conclusion** (1-2 sentences): Bottom-line takeaway for investors

STYLE:
- Professional but conversational
- Data-driven with specific numbers
- Actionable insights
- No hype or sensationalism
- 500-700 words total

IMPORTANT: Use real-time search to get TODAY's actual market data. Include specific numbers, percentages, and facts.

Return ONLY a JSON object with this structure:
{
  "title": "Daily Market Pulse - [Date]",
  "hook": "Opening paragraph text",
  "sections": [
    {
      "heading": "Market Overview",
      "content": "Section content with real data..."
    },
    {
      "heading": "Key Drivers",
      "content": "Section content..."
    },
    {
      "heading": "What to Watch",
      "content": "Section content..."
    }
  ],
  "conclusion": "Closing paragraph text"
}`;

    // Generate content with search grounding
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const response = result.response;
    const text = response.text();
    
    console.log('✅ Newsletter content generated');

    // Parse JSON response
    const newsletter = JSON.parse(text);

    // Extract grounding sources (if available)
    const sources = extractGroundingSources(result);

    return {
      ...newsletter,
      sources,
    };

  } catch (error) {
    console.error('❌ Failed to generate newsletter:', error);
    throw new Error(`Newsletter generation failed: ${error.message}`);
  }
}

/**
 * Extract grounding sources from Gemini response
 */
function extractGroundingSources(result) {
  const sources = [];
  
  try {
    // Check if grounding metadata exists
    const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata;
    
    if (groundingMetadata?.groundingChunks) {
      groundingMetadata.groundingChunks.forEach(chunk => {
        if (chunk.web?.uri) {
          sources.push({
            url: chunk.web.uri,
            title: chunk.web.title || 'Source',
          });
        }
      });
    }

    // Deduplicate sources
    const uniqueSources = Array.from(
      new Map(sources.map(s => [s.url, s])).values()
    );

    console.log(`📚 Found ${uniqueSources.length} grounding sources`);
    return uniqueSources;

  } catch (error) {
    console.warn('⚠️ Could not extract grounding sources:', error.message);
    return [];
  }
}

/**
 * Test Gemini connection
 */
export async function testGeminiConnection() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent('Say "Hello from Gemini!"');
    const response = result.response.text();
    console.log('✅ Gemini connection test:', response);
    return true;
  } catch (error) {
    console.error('❌ Gemini connection test failed:', error);
    return false;
  }
}
