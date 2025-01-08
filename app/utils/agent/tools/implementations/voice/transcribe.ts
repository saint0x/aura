import { BaseTool } from '../../base';
import { ToolParameterDefinition, ToolMetadata, ToolParameter, ToolExample } from '@/app/utils/agent/types';
import { transcribeAudio } from '../../../../../utils/voiceUtils';

export class TranscribeAudioTool extends BaseTool {
  public readonly name = 'transcribe_audio';
  public readonly description = 'Transcribe audio to text';
  public readonly version = '1.0.0';
  public readonly category = 'voice';
  public readonly parameters: ToolParameter[] = [
    {
      name: 'audio_path',
      type: 'string',
      description: 'Path to the audio file',
      required: true
    },
    {
      name: 'language',
      type: 'string',
      description: 'Language code (e.g., en-US)',
      required: false
    },
    {
      name: 'explanation',
      type: 'string',
      description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.',
      required: true
    }
  ];

  public readonly metadata: ToolMetadata = {
    name: this.name,
    description: this.description,
    category: this.category,
    version: this.version,
    parameters: {
      audio_path: {
        type: 'string',
        description: 'Path to the audio file'
      },
      language: {
        type: 'string',
        description: 'Language code (e.g., en-US)'
      },
      explanation: {
        type: 'string',
        description: 'One sentence explanation as to why this tool is being used, and how it contributes to the goal.'
      }
    },
    required: ['audio_path', 'explanation'],
    examples: this.examples
  };

  public readonly examples: ToolExample[] = [
    {
      name: 'Transcribe English audio',
      description: 'Transcribe an English audio file',
      parameters: {
        audio_path: 'recordings/meeting.mp3',
        language: 'en-US',
        explanation: 'Converting meeting recording to text for analysis'
      },
      expected_result: 'Transcribed text from the audio file'
    },
    {
      name: 'Transcribe auto-detect',
      description: 'Transcribe audio with automatic language detection',
      parameters: {
        audio_path: 'recordings/message.wav',
        explanation: 'Converting voice message to text'
      },
      expected_result: 'Transcribed text with auto-detected language'
    }
  ];

  async handler(args: Record<string, unknown>): Promise<unknown> {
    const { audio_path, language = 'en-US' } = args;

    if (typeof audio_path !== 'string') {
      throw new Error('audio_path must be a string');
    }

    if (language !== undefined && typeof language !== 'string') {
      throw new Error('language must be a string');
    }

    try {
      const result = await transcribeAudio({
        audioPath: audio_path,
        language
      });

      return {
        success: true,
        result: {
          text: result.text,
          language: result.detectedLanguage,
          confidence: result.confidence,
          duration: result.duration
        }
      };
    } catch (error) {
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 