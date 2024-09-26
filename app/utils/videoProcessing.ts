import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

export const extractFrames = async (videoPath: string): Promise<Buffer[]> => {
  const frames: Buffer[] = [];
  const tempDir = path.join(process.cwd(), 'temp', 'frames');
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on('end', () => {
        // Read all frame files
        const frameFiles = fs.readdirSync(tempDir).slice(-60); // Get the most recent 60 frames
        const buffers = frameFiles.map(file => fs.readFileSync(path.join(tempDir, file)));
        resolve(buffers);
      })
      .on('error', (err) => reject(err))
      .screenshots({
        count: 60, // Adjust this count as needed
        folder: tempDir,
        size: '320x240',
        filename: '%b-frame-%i.png',
      });
  });
};
