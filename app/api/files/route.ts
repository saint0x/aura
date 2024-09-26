import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dirPath = searchParams.get('dir');
    const filePath = searchParams.get('filePath');

    if (dirPath) {
      const files = await fs.readdir(dirPath);
      return NextResponse.json({ files });
    } else if (filePath) {
      const content = await fs.readFile(filePath, 'utf8');
      return NextResponse.json({ content });
    } else {
      return NextResponse.json({ error: 'Either dir or filePath is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing GET request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, content } = await request.json();
    const fullPath = path.join(process.cwd(), filePath);

    await fs.writeFile(fullPath, content);
    return NextResponse.json({ message: 'File written successfully' });
  } catch (error) {
    console.error('Error processing POST request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    const fullPath = path.join(process.cwd(), filePath);
    await fs.unlink(fullPath);
    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}