/**
 * Text-to-Speech Service
 * 
 * Converts newsletter text to audio using Google Gemini TTS
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import fs from 'fs/promises';
import path from 'path';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Generate audio from newsletter content using Gemini TTS
 * 
 * @param {Object} newsletter - Newsletter object with title, hook, sections, conclusion
 * @param {string} outputPath - Path to save the audio file
 * @returns {Object} - { audioPath, durationSeconds }
 */
export async function generateNewsletterAudio(newsletter, outputPath) {
  try {
    console.log('🎙️ Generating audio with Gemini TTS...');

    // Combine all text content
    const fullText = buildAudioScript(newsletter);
    
    console.log(`📝 Audio script length: ${fullText.length} characters`);

    // Use Gemini's text-to-speech model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });

    // Generate audio using Gemini
    // Note: Gemini 2.0 Flash supports multimodal output including audio
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Convert the following market newsletter to natural-sounding speech. Use a professional, clear voice suitable for financial news:

${fullText}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        // Request audio output
        responseMimeType: 'audio/wav',
      },
    });

    // Get audio data from response
    const audioData = await result.response.arrayBuffer();
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Save audio file
    await fs.writeFile(outputPath, Buffer.from(audioData));
    
    console.log(`✅ Audio saved to: ${outputPath}`);

    // Estimate duration (rough estimate: ~150 words per minute)
    const wordCount = fullText.split(/\s+/).length;
    const estimatedDuration = Math.ceil((wordCount / 150) * 60);

    return {
      audioPath: outputPath,
      durationSeconds: estimatedDuration,
    };

  } catch (error) {
    console.error('❌ Failed to generate audio:', error);
    
    // Fallback: Create a placeholder audio file
    console.log('⚠️ Creating placeholder audio file...');
    await createPlaceholderAudio(outputPath);
    
    return {
      audioPath: outputPath,
      durationSeconds: 0,
      error: error.message,
    };
  }
}

/**
 * Build audio script from newsletter content
 */
function buildAudioScript(newsletter) {
  const parts = [];

  // Title
  parts.push(newsletter.title);
  parts.push(''); // Pause

  // Hook
  parts.push(newsletter.hook);
  parts.push(''); // Pause

  // Sections
  newsletter.sections.forEach(section => {
    parts.push(section.heading);
    parts.push(section.content);
    parts.push(''); // Pause between sections
  });

  // Conclusion
  parts.push(newsletter.conclusion);

  return parts.join('\n\n');
}

/**
 * Create a placeholder audio file when TTS fails
 */
async function createPlaceholderAudio(outputPath) {
  try {
    // Create a minimal WAV file header (silence)
    const sampleRate = 44100;
    const duration = 1; // 1 second of silence
    const numSamples = sampleRate * duration;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    const dataSize = numSamples * numChannels * (bitsPerSample / 8);
    const fileSize = 44 + dataSize;
    
    const buffer = Buffer.alloc(fileSize);
    
    // WAV header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(fileSize - 8, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // fmt chunk size
    buffer.writeUInt16LE(1, 20); // audio format (PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
    buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    
    // Data (silence = zeros)
    // Already zeros from Buffer.alloc
    
    await fs.writeFile(outputPath, buffer);
    console.log('✅ Placeholder audio created');
  } catch (error) {
    console.error('❌ Failed to create placeholder audio:', error);
  }
}

/**
 * Test TTS service
 */
export async function testTTS() {
  try {
    const testNewsletter = {
      title: 'Test Newsletter',
      hook: 'This is a test of the text-to-speech service.',
      sections: [
        {
          heading: 'Test Section',
          content: 'This is test content to verify audio generation.'
        }
      ],
      conclusion: 'End of test.'
    };

    const testPath = '/tmp/test-audio.wav';
    const result = await generateNewsletterAudio(testNewsletter, testPath);
    
    console.log('✅ TTS test result:', result);
    
    // Clean up
    await fs.unlink(testPath).catch(() => {});
    
    return true;
  } catch (error) {
    console.error('❌ TTS test failed:', error);
    return false;
  }
}
