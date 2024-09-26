import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '../../../utils/visionUtils';

export const runtime = 'edge';
export const maxDuration = 60; // This sets a 60-second timeout, adjust as needed

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const { analysis, logs } = await analyzeImage(image);

    return NextResponse.json({ analysis, logs });
  } catch (error) {
    console.error('Error in image analysis:', error);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}