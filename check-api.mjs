import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({ apiKey: 'test' });

console.log('GoogleGenAI instance:', genai);
console.log('\nProperties:', Object.keys(genai));
console.log('\nMethods:', Object.getOwnPropertyNames(Object.getPrototypeOf(genai)));

// Check if models property exists
if (genai.models) {
  console.log('\n✅ genai.models exists');
  console.log('models methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(genai.models)));
}
