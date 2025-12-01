/**
 * Gemini AI Service
 * 
 * Handles newsletter content generation using Google Gemini 2.0 Flash
 * with Google Search grounding for real-time market data
 * 
 * Two-step approach:
 * 1. Search + Generate (with Google Search tool)
 * 2. Format as JSON (without tools, using JSON mode)
 */

import { GoogleGenerativeAI } from '@google/genai';
import { config } from '../config.js';

const genai = new GoogleGenerativeAI({ apiKey: config.geminiApiKey });

/**
 * Generate newsletter content with Google Search grounding
 */
export async function generateNewsletterContent(date) {
  try {
    console.log('📝 Step 1: Generating content with Google Search...');
    
    // Step 1: Generate content with Google Search grounding
    const searchModel = genai.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      tools: [{
        googleSearch: {}
      }]
    });

    const searchPrompt = `You are a financial market analyst writing a daily market newsletter called "Daily Market Pulse" for ${date}.

Search for and analyze today's cryptocurrency and blockchain market developments, then write a comprehensive newsletter with the following structure:

1. **Hook** (1-2 sentences): Attention-grabbing opening that highlights the most significant market movement or news

2. **Market Overview** (150-200 words): 
   - Major cryptocurrency price movements (BTC, ETH, etc.)
   - Overall market sentiment and trends
   - Trading volume and market cap changes

3. **Key Developments** (150-200 words):
   - Significant news events (regulations, partnerships, launches)
   - Notable on-chain metrics or data
   - Institutional activity or major transactions

4. **Technical Analysis** (100-150 words):
   - Key support and resistance levels
   - Important technical indicators
   - Short-term price outlook

5. **Conclusion** (50-100 words): 
   - Summary of key takeaways
   - What to watch for tomorrow
   - Brief outlook

**Requirements**:
- Use real-time data from Google Search
- Total length: 500-700 words
- Professional, informative tone
- Include specific numbers and data points
- Cite sources when mentioning specific data

Write the complete newsletter now:`;

    const searchResult = await searchModel.generateContent(searchPrompt);
    const rawContent = searchResult.response.text();
    
    console.log('✅ Step 1 complete. Content length:', rawContent.length);
    console.log('📝 Step 2: Formatting as structured JSON...');

    // Step 2: Format the content as JSON
    const formatModel = genai.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Newsletter title, e.g., "Daily Market Pulse - December 1, 2025"'
            },
            hook: {
              type: 'string',
              description: 'Opening hook (1-2 sentences)'
            },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  heading: { type: 'string' },
                  content: { type: 'string' }
                },
                required: ['heading', 'content']
              }
            },
            conclusion: {
              type: 'string',
              description: 'Closing summary and outlook'
            },
            sources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  url: { type: 'string' }
                }
              },
              description: 'List of sources cited (if any)'
            }
          },
          required: ['title', 'hook', 'sections', 'conclusion']
        }
      }
    });

    const formatPrompt = `Convert the following newsletter content into structured JSON format.

Extract:
- Title (create one based on the date: ${date})
- Hook (the opening 1-2 sentences)
- Sections (break down into: Market Overview, Key Developments, Technical Analysis, etc.)
- Conclusion (the closing summary)
- Sources (extract any URLs or sources mentioned)

Newsletter content:
${rawContent}

Return the structured JSON now:`;

    const formatResult = await formatModel.generateContent(formatPrompt);
    const jsonText = formatResult.response.text();
    const structured = JSON.parse(jsonText);

    console.log('✅ Step 2 complete. Structured newsletter generated.');

    return {
      title: structured.title || `Daily Market Pulse - ${date}`,
      hook: structured.hook || '',
      sections: structured.sections || [],
      conclusion: structured.conclusion || '',
      sources: structured.sources || []
    };

  } catch (error) {
    console.error('❌ Gemini API error:', error);
    throw new Error(`Newsletter generation failed: ${error.message}`);
  }
}

/**
 * Test Gemini connection
 */
export async function testGeminiConnection() {
  try {
    const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent('Say "Hello from Gemini!"');
    console.log('✅ Gemini connection test:', result.response.text());
    return true;
  } catch (error) {
    console.error('❌ Gemini connection test failed:', error);
    return false;
  }
}
