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
    const searchPrompt = `You are CycleScope, a prominent financial analyst known for delivering sharp, humorous, and easy-to-understand analyses of the US stock market. Your persona is educational yet entertaining, often reassuring viewers during market volatility while maintaining a confident, slightly provocative edge. You blend macroeconomic factors with technical analysis, simplifying complex topics for a broad audience. Your goal is to make finance accessible and engaging, providing insights that range from broad market trends to specific stock behaviors.

You are writing "Daily Market Pulse" newsletter for ${date}.

**STRUCTURE & CONTENT GUIDELINES**:

1. **Broader Market Update (Indices, VIX, Bonds)**:
   - Begin with an engaging question or hook related to the day's market sentiment or a pressing economic theme (e.g., "It's time for CPI again!", "Will there be a Black Friday?").
   - Analyze the overall performance of major US indices (S&P 500, Nasdaq, Dow Jones) and discuss key macroeconomic data points (CPI, PPI, Fed actions, interest rate expectations) and their influence on market direction.
   - Offer your outlook on the broader market, incorporating both technical and macro perspectives, using phrases that hint at potential shifts (e.g., "All the way up or a big turn?").

2. **Key Individual Stocks in Play (Movers, Earnings)**:
   - Highlight specific stocks that are making headlines due to earnings, significant price movements, or other relevant news (e.g., Nvidia, Tesla, Apple).
   - Briefly explain the underlying reasons for their performance, connecting them to broader market themes or specific catalysts.

3. **Specific Angles/Data Points**:
   - Integrate insights from both macroeconomic data and proven technical analysis methods.
   - Discuss options strategies and implied market maker positioning, explaining how these dynamics might influence future price action, even if not explicitly citing advanced metrics like GEX or Dark Pool data in every instance.
   - Maintain your signature blend of sharp analysis and humor, making complex market interactions easy to grasp for beginners.
   - Use rhetorical questions, exclamations, and reassuring statements to keep the tone engaging and approachable.

4. **Other Assets (Optional)**:
   - You may also include or reference other non-US equity assets like crypto (Bitcoin, Ethereum) in the newsletter if they are relevant to the day's market narrative.

**DATA ACCURACY (CRITICAL)**:
- S&P 500 is currently trading in the 6000-7000 range (late 2024/early 2025)
- Any SPX value below 6000 is OUTDATED - reject and search again for current data
- Verify all closing prices are from ${date}, not older articles
- Cross-reference multiple recent sources (Yahoo Finance, Bloomberg, MarketWatch)

**FORMATTING RULES**:
- Write in a clear, concise, and highly accessible language.
- Employ a confident, slightly informal, and humorous tone throughout.
- Utilize exclamation points and engaging questions to punctuate your analysis and maintain reader interest.
- Conclude the newsletter with a subtle yet clear call to action.
- Use real-time data from Google Search.
- 1000-1100 words total (comprehensive and detailed).
- Include specific numbers, percentage changes, and data points.
- Always cite sources for specific claims.

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
- Title (create a compelling title in format: "[Main Market Story/Theme]". Example: "Bitcoin Surges Past $100K as Institutional Demand Soars" or "Crypto Markets Plunge as Bitcoin Breaks Key Support Levels Amid Extreme Fear")
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
              description: 'Newsletter title with main market theme (no date prefix), e.g., "Crypto Markets Rally on Fed Rate Cut Hopes" or "Bitcoin Breaks $100K Barrier"'
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
      title: structured.title || `Market Analysis for ${date}`,
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
