import { Page } from 'puppeteer';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function captureScreenshot(page: Page): Promise<string> {
  const screenshot = await page.screenshot({ encoding: 'base64' });
  return `data:image/png;base64,${screenshot}`;
}

export async function analyzeImage(imageBase64: string): Promise<{ analysis: string; logs: string[] }> {
  try {
    const logs: string[] = [];
    logs.push('Analyzing image...');

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What's in this image?" },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const analysis = response.choices[0].message.content || "No analysis available.";
    logs.push('Analysis complete.');

    return { analysis, logs };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error('Failed to analyze image');
  }
}

// Add any other vision-related utility functions here