import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const screenshotPath = path.join(process.cwd(), 'public', 'screenshot.png');
    
    // Use screencapture on macOS, or adjust for other operating systems
    await execAsync(`screencapture ${screenshotPath}`);

    // Read the screenshot file
    const imageBuffer = await fs.readFile(screenshotPath);

    // Convert the image to base64
    const base64Image = imageBuffer.toString('base64');

    // Delete the temporary screenshot file
    await fs.unlink(screenshotPath);

    return NextResponse.json({ 
      success: true, 
      result: `Screenshot captured successfully. Base64 image: ${base64Image}`
    });
  } catch (error) {
    console.error('Error in screen capture:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Failed to capture screenshot: ${error}` 
    }, { status: 500 });
  }
}