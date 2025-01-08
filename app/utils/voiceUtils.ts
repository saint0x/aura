import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { readFile } from 'fs/promises';

const execAsync = promisify(exec);

interface TranscribeOptions {
  audioPath: string;
  language?: string;
}

interface TranscribeResult {
  text: string;
  detectedLanguage: string;
  confidence: number;
  duration: number;
}

export async function transcribeAudio(options: TranscribeOptions): Promise<TranscribeResult> {
  const { audioPath, language = 'en-US' } = options;
  const whisperPath = join(process.cwd(), 'bin/whisper');
  const modelPath = join(process.cwd(), 'models/whisper-1');

  try {
    // Use OpenAI's Whisper model for transcription
    const command = `${whisperPath} "${audioPath}" --model ${modelPath} --language ${language}`;
    const { stdout } = await execAsync(command);

    // Parse the output
    const result = JSON.parse(stdout);

    return {
      text: result.text,
      detectedLanguage: result.language,
      confidence: result.confidence,
      duration: result.duration
    };
  } catch (error) {
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`);
  }
} 