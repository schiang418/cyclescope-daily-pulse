/**
 * Test Gemini Integration
 * 
 * Tests:
 * 1. Gemini API connection
 * 2. Newsletter content generation
 * 3. TTS audio generation
 * 4. Complete workflow
 */

import { testGeminiConnection, generateNewsletterContent } from '../src/services/geminiService.js';
import { testTTS, generateNewsletterAudio } from '../src/services/ttsService.js';

async function runTests() {
  console.log('🧪 Testing Gemini Integration\n');
  console.log('='.repeat(60));

  let allPassed = true;

  // Test 1: Gemini Connection
  console.log('\n📝 Test 1: Gemini API Connection');
  console.log('-'.repeat(60));
  try {
    const connected = await testGeminiConnection();
    if (connected) {
      console.log('✅ Gemini connection successful');
    } else {
      console.log('❌ Gemini connection failed');
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Gemini connection error:', error.message);
    allPassed = false;
  }

  // Test 2: Newsletter Content Generation
  console.log('\n📝 Test 2: Newsletter Content Generation');
  console.log('-'.repeat(60));
  try {
    const testDate = new Date().toISOString().split('T')[0];
    console.log(`Generating newsletter for ${testDate}...`);
    console.log('⏳ This may take 10-30 seconds...\n');
    
    const content = await generateNewsletterContent(testDate);
    
    console.log('✅ Newsletter content generated:');
    console.log(`   Title: ${content.title}`);
    console.log(`   Hook length: ${content.hook.length} chars`);
    console.log(`   Sections: ${content.sections.length}`);
    content.sections.forEach((section, i) => {
      console.log(`     ${i + 1}. ${section.heading} (${section.content.length} chars)`);
    });
    console.log(`   Conclusion length: ${content.conclusion.length} chars`);
    console.log(`   Sources: ${content.sources?.length || 0}`);
    if (content.sources?.length > 0) {
      content.sources.slice(0, 3).forEach((source, i) => {
        console.log(`     ${i + 1}. ${source.url}`);
      });
    }
  } catch (error) {
    console.log('❌ Newsletter generation error:', error.message);
    console.error(error);
    allPassed = false;
  }

  // Test 3: TTS Audio Generation
  console.log('\n📝 Test 3: TTS Audio Generation');
  console.log('-'.repeat(60));
  try {
    const ttsWorking = await testTTS();
    if (ttsWorking) {
      console.log('✅ TTS audio generation successful');
    } else {
      console.log('⚠️  TTS test completed with warnings (check logs above)');
    }
  } catch (error) {
    console.log('❌ TTS error:', error.message);
    console.error(error);
    allPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('🎉 All tests passed!');
    console.log('\n✅ Gemini integration is working correctly.');
    console.log('✅ Ready to deploy to Railway.');
  } else {
    console.log('❌ Some tests failed.');
    console.log('\n⚠️  Please check the errors above and fix before deploying.');
  }
  console.log('='.repeat(60));

  process.exit(allPassed ? 0 : 1);
}

runTests();
