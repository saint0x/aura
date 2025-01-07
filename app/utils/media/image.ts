import { Page } from 'puppeteer';
import { OpenAI } from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

if (!process.env.OPENAI_MODEL || process.env.OPENAI_MODEL !== 'gpt-4o-mini') {
  throw new Error('OPENAI_MODEL must be set to gpt-4o-mini');
}

export async function captureScreenshot(page: Page): Promise<string> {
  const screenshot = await page.screenshot({ encoding: 'base64' });
  return `data:image/png;base64,${screenshot}`;
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

// Add any other vision-related utility functions here