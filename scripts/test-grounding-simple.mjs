/**
 * Simple test for Gemini grounding
 */

import { GoogleGenerativeAI, DynamicRetrievalMode } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not found');
  process.exit(1);
}

console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');

async function testGrounding() {
  try {
    console.log('\n📝 Test 1: Basic model (no grounding)');
    const genAI = new GoogleGenerativeAI(apiKey);
    const basicModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-002' });
    const basicResult = await basicModel.generateContent('Say hello');
    console.log('✅ Basic test:', basicResult.response.text());

    console.log('\n📝 Test 2: Model with grounding');
    const modelWithGrounding = genAI.getGenerativeModel(
      {
        model: 'gemini-1.5-pro-002',
        tools: [
          {
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: DynamicRetrievalMode.MODE_DYNAMIC,
                dynamicThreshold: 0.7,
              },
            },
          },
        ],
      },
      { apiVersion: 'v1beta' }
    );

    console.log('🔍 Calling generateContent with grounding...');
    const groundingResult = await modelWithGrounding.generateContent(
      'Who won the 2024 US presidential election?'
    );
    
    console.log('✅ Grounding test:', groundingResult.response.text());
    console.log('\n📚 Grounding metadata:', JSON.stringify(groundingResult.response.candidates[0].groundingMetadata, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  }
}

testGrounding();
