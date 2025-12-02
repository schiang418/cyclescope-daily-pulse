/**
 * Gemini AI Service
 * 
 * Handles newsletter content generation using Google Gemini 2.5 Flash
 * with Google Search grounding for real-time market data
 * 
 * Two-step approach:
 * 1. Search + Generate (with Google Search tool)
 * 2. Format as JSON (without tools, using JSON mode)
 */

import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

const genai = new GoogleGenAI({ apiKey: config.geminiApiKey });

/**
 * Generate newsletter content with Google Search grounding
 */
export async function generateNewsletterContent(date) {
  try {
    console.log('📝 Step 1: Generating content with Google Search...');
    
    // Step 1: Generate content with Google Search grounding
    const searchPrompt = `You are writing "Daily Market Pulse" - a daily cryptocurrency market newsletter for ${date}.

**PERSONA & TONE**:
- Educational: Help readers understand what's happening and why it matters
- Engaging: Keep it interesting and worth reading every day
- Humorous: Add wit and personality (but don't force jokes)
- Sharp: Cut through the noise with clear, insightful analysis
- Reassuring: Especially during turbulent times, provide perspective and calm
- Accessible: Explain complex concepts in plain language

**STRUCTURE**:

1. **Hook** (1-2 sentences): 
   - Grab attention with the day's most significant move
   - Use a conversational, slightly witty tone
   - Example: "Bitcoin decided to test our collective blood pressure today..."

2. **Market Overview** (250-350 words):
   - Major crypto price movements (BTC, ETH, top 10 alts by market cap)
   - Detailed price action: opening, high, low, closing prices
   - Market sentiment and what's driving it (fear/greed index, social sentiment)
   - Trading volumes and notable metrics (24h volume, market cap changes)
   - Cross-market correlations (stocks, gold, DXY)
   - **Explain WHY things moved, not just WHAT moved**
   - Include specific percentage changes and dollar values

3. **Key Developments** (250-350 words):
   - Important news (regulations, partnerships, hacks, launches, protocol upgrades)
   - On-chain data worth noting (whale movements, exchange flows, staking metrics)
   - Institutional moves (ETF flows, corporate treasury updates, venture funding)
   - DeFi trends (TVL changes, new protocols, yields)
   - NFT and gaming highlights if significant
   - **Connect the dots - how do these affect the market?**
   - Provide context and historical comparisons

4. **Technical Analysis** (200-250 words):
   - Multiple timeframe analysis (4H, daily, weekly)
   - Key support and resistance levels with specific prices
   - Technical indicators (RSI, MACD, moving averages) explained simply
   - Chart patterns and what they suggest
   - Volume analysis and market structure
   - Short-term and medium-term outlook
   - **Make it actionable, not just chart jargon**
   - Include risk levels and invalidation points

5. **Conclusion** (100-150 words):
   - Big picture takeaway
   - What to watch tomorrow
   - Reassuring perspective (especially if markets are rough)
   - End on a note that's helpful, not fearful

**STYLE GUIDELINES**:
- Use real-time data from Google Search
- 900-1200 words total (aim for comprehensive analysis)
- Write like you're explaining to a smart friend over coffee
- Use analogies and metaphors when helpful
- Include specific numbers and data points
- Avoid crypto jargon unless you explain it
- During crashes: be calm, provide context, remind readers of past cycles
- During pumps: be measured, warn against FOMO
- Always cite sources for specific claims

Write the complete newsletter now:`;

    const searchResult = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: searchPrompt,
      config: {
        tools: [{
          googleSearch: {}
        }]
      }
    });

    const rawContent = searchResult.text;
    
    // Extract grounding metadata sources
    const groundingSources = searchResult.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => ({
        url: chunk.web?.uri,
        title: chunk.web?.title
      }))
      .filter(source => source.url) || [];
    
    console.log('✅ Step 1 complete. Content length:', rawContent.length);
    console.log('📚 Found', groundingSources.length, 'grounding sources');
    console.log('📝 Step 2: Formatting as structured JSON...');

    // Step 2: Format the content as JSON
    const formatPrompt = `Convert the following newsletter content into structured JSON format.

Extract:
- Title (create one based on the date: ${date})
- Hook (the opening 1-2 sentences)
- Sections (break down into: Market Overview, Key Developments, Technical Analysis, etc.)
- Conclusion (the closing summary)

Newsletter content:
${rawContent}

Note: We already have grounding sources from Google Search, so don't extract sources from the text.

Return the structured JSON now:`;

    const formatResult = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formatPrompt,
      config: {
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

    const jsonText = formatResult.text;
    const structured = JSON.parse(jsonText);

    console.log('✅ Step 2 complete. Structured newsletter generated.');

    return {
      title: structured.title || `Daily Market Pulse - ${date}`,
      hook: structured.hook || '',
      sections: structured.sections || [],
      conclusion: structured.conclusion || '',
      sources: groundingSources // Use grounding metadata sources instead of extracted sources
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
    const result = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say "Hello from Gemini!"'
    });
    console.log('✅ Gemini connection test:', result.text);
    return true;
  } catch (error) {
    console.error('❌ Gemini connection test failed:', error);
    return false;
  }
}
