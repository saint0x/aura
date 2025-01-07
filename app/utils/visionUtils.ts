import { OpenAI } from 'openai';
import { ValidationError } from '@/app/common/errors';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

if (!process.env.OPENAI_MODEL || process.env.OPENAI_MODEL !== 'gpt-4o-mini') {
  throw new Error('OPENAI_MODEL must be set to gpt-4o-mini');
}

export async function analyzeImage(imageUrl: string, prompt: string): Promise<string> {
  try {
    const content: ChatCompletionContentPart[] = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: imageUrl } }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: "user",
          content
        },
      ],
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

export async function describeImage(imageUrl: string): Promise<string> {
  return analyzeImage(imageUrl, "Describe what you see in this image in detail.");
}

export async function extractTextFromImage(imageUrl: string): Promise<string> {
  return analyzeImage(imageUrl, "Extract and return any text you can see in this image.");
} 