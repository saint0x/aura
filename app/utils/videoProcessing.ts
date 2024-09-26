import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const mkdir = promisify(fs.mkdir);

export async function extractFramesFromVideo(videoPath: string, outputDir: string, frameRate: number = 1): Promise<string[]> {
  const videoName = path.basename(videoPath, path.extname(videoPath));
  const framesDir = path.join(outputDir, 'frames');

  try {
    await mkdir(framesDir, { recursive: true });
  } catch (error) {
    console.error('Error creating frames directory:', error);
    throw error;
  }

  return new Promise<string[]>((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions('-vf', `fps=${frameRate}`)
      .output(path.join(framesDir, `${videoName}-frame-%d.png`))
      .on('error', (err: Error) => reject(err))
      .on('end', () => {
        fs.readdir(framesDir, (err, files) => {
          if (err) reject(err);
          else resolve(files.map(file => path.join(framesDir, file)));
        });
      })
      .run();
  });
}
