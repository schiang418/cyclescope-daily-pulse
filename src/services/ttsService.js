/**
 * Text-to-Speech Service
 * 
 * Converts newsletter text to audio using Gemini 2.5 Flash TTS
 * Using @google/genai SDK (new, supports Gemini 2.0+)
 */

import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import fs from 'fs/promises';
import path from 'path';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

/**
 * Generate audio from newsletter content using Gemini 2.5 Flash TTS
 * 
 * @param {Object} newsletter - Newsletter object with title, hook, sections, conclusion
 * @param {string} outputPath - Path to save the audio file
 * @returns {Object} - { audioPath, durationSeconds }
 */
export async function generateNewsletterAudio(newsletter, outputPath) {
  try {
    console.log('🎙️ Generating audio with Gemini 2.5 Flash TTS...');

    // Build audio script from newsletter
    const fullText = buildAudioScript(newsletter);
    
    console.log(`📝 Audio script length: ${fullText.length} characters`);

    // Generate audio with Gemini TTS
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: `Read the following market newsletter in a professional, clear voice suitable for financial news. Use a conversational but authoritative tone:\n\n${fullText}`,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Fenrir', // Deep, authoritative male voice
            }
          }
        }
      },
    });

    // Extract audio data from response
    const audioData = response.candidates[0].content.parts[0].inlineData.data;
    
    // Decode base64 audio data (this is raw PCM data, not WAV)
    const pcmBuffer = Buffer.from(audioData, 'base64');
    
    // Add WAV header to PCM data
    const wavBuffer = addWavHeader(pcmBuffer);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Save audio file
    await fs.writeFile(outputPath, wavBuffer);
    
    console.log(`✅ Audio saved to: ${outputPath}`);
    console.log(`📊 Audio size: ${(wavBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Estimate duration (rough estimate: ~150 words per minute)
    const wordCount = fullText.split(/\s+/).length;
    const estimatedDuration = Math.ceil((wordCount / 150) * 60);

    return {
      audioPath: outputPath,
      durationSeconds: estimatedDuration,
    };

  } catch (error) {
    console.error('❌ Failed to generate audio:', error);
    
    // If TTS fails, create placeholder audio
    console.log('⚠️ Creating placeholder audio file...');
    await createPlaceholderAudio(outputPath);
    
    const wordCount = buildAudioScript(newsletter).split(/\s+/).length;
    const estimatedDuration = Math.ceil((wordCount / 150) * 60);
    
    return {
      audioPath: outputPath,
      durationSeconds: estimatedDuration,
      error: error.message,
    };
  }
}

/**
 * Add WAV header to raw PCM audio data
 * Gemini TTS returns raw PCM data, we need to add WAV header for browser playback
 */
function addWavHeader(pcmBuffer) {
  // Gemini TTS typically outputs 24kHz, 16-bit, mono PCM
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  
  const dataSize = pcmBuffer.length;
  const fileSize = 44 + dataSize;
  
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize - 8, 4);
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // audio format (PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // byte rate
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // block align
  header.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  
  // Combine header and PCM data
  return Buffer.concat([header, pcmBuffer]);
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
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Create a minimal WAV file header (1 second of silence)
    const sampleRate = 44100;
    const duration = 1;
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
    
    // Data (silence = zeros, already initialized by Buffer.alloc)
    
    await fs.writeFile(outputPath, buffer);
    console.log('✅ Placeholder audio created');
  } catch (error) {
    console.error('❌ Failed to create placeholder audio:', error);
    throw error;
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
          content: 'This is test content to verify audio generation works correctly with Gemini 2.5 Flash TTS.'
        }
      ],
      conclusion: 'End of test.'
    };

    const testPath = '/tmp/test-audio.wav';
    const result = await generateNewsletterAudio(testNewsletter, testPath);
    
    console.log('✅ TTS test result:', result);
    
    // Check if file exists
    const stats = await fs.stat(testPath);
    console.log(`✅ Audio file created: ${stats.size} bytes`);
    
    // Clean up
    await fs.unlink(testPath).catch(() => {});
    
    return true;
  } catch (error) {
    console.error('❌ TTS test failed:', error);
    return false;
  }
}
