import { BaseTool } from '../../base';
import { ValidationError } from '@/app/common/errors';
import { OpenAI } from 'openai';
import fs from 'fs/promises';
import { ToolMetadata } from '../../types';

export class TranscribeAudioTool extends BaseTool {
  public readonly name = 'transcribe_audio';
  public readonly description = 'Transcribe audio content to text using Whisper';
  public readonly version = '1.0.0';
  public readonly category = 'voice';
  public readonly parameters = [
    {
      name: 'audio_path',
      type: 'string' as const,
      description: 'Path to the audio file to transcribe',
      required: true,
      validation: [
        {
          type: 'pattern' as const,
          regex: /\.(mp3|wav|m4a|webm)$/
        }
      ]
    },
    {
      name: 'language',
      type: 'string' as const,
      description: 'Language code for transcription (e.g., "en", "es"). If not provided, auto-detects language.',
      required: false,
      validation: [
        {
          type: 'pattern' as const,
          regex: /^[a-z]{2}$/
        }
      ]
    }
  ];

  public override get metadata(): ToolMetadata {
    return {
      name: this.name,
      description: this.description,
      category: this.category,
      version: this.version,
      parameters: {
        audio_path: {
          type: 'string',
          description: 'Path to the audio file to transcribe',
          required: true
        },
        language: {
          type: 'string',
          description: 'Language code (e.g. "en", "es", "fr")',
          required: false,
          enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ja', 'ko', 'zh']
        }
      },
      required: ['audio_path']
    };
  }

  public readonly examples = [
    {
      name: 'Transcribe English audio',
      description: 'Transcribe an English audio file with explicit language setting',
      parameters: {
        audio_path: 'recordings/meeting.mp3',
        language: 'en'
      },
      expected_result: 'Transcribed text content from the audio file'
    },
    {
      name: 'Auto-detect language',
      description: 'Transcribe an audio file with automatic language detection',
      parameters: {
        audio_path: 'recordings/message.wav'
      },
      expected_result: 'Transcribed text content with auto-detected language'
    }
  ];

  public async handler(params: Record<string, unknown>): Promise<unknown> {
    const audio_path = params.audio_path;
    if (typeof audio_path !== 'string') {
      throw new ValidationError({
        message: 'audio_path must be a string',
        param: 'audio_path'
      });
    }

    const language = params.language;
    if (language !== undefined && typeof language !== 'string') {
      throw new ValidationError({
        message: 'language must be a string if provided',
        param: 'language'
      });
    }

    try {
      // Read audio file
      const audioBuffer = await fs.readFile(audio_path);
      const audioBlob = new Blob([audioBuffer]);
      const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      // Transcribe audio
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language
      });

      return transcription.text;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError({
        message: `Failed to transcribe audio: ${(error as Error).message}`,
        param: 'audio_path'
      });
    }
  }
} 