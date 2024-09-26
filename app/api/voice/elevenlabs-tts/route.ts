import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = 'sk_7186a5f3ad8ab61b713992ed5f9bb3c8a9970f98fb6e3812';
const ELEVENLABS_VOICE_ID = 'WLIAiq6GQcUImAzxzLJT';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ElevenLabs API Error:', errorData);
      return NextResponse.json({ error: 'Failed to generate speech' }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error in text-to-speech conversion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}