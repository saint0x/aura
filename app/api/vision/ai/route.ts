import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/app/utils/visionUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.image_url) {
      return NextResponse.json(
        { success: false, error: 'image_url is required' },
        { status: 400 }
      );
    }

    const prompt = body.prompt || 'Describe what you see in this image in detail.';
    const result = await analyzeImage(body.image_url, prompt);
    
    return NextResponse.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('Error in vision analysis:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze image' 
      },
      { status: 500 }
    );
  }
}