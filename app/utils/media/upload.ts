import fs from 'fs';
import path from 'path';

export const uploadImage = async (image: Buffer): Promise<string> => {
  const imagePath = path.join(process.cwd(), 'public', 'uploads', `${Date.now()}.jpg`);
  fs.writeFileSync(imagePath, image);
  return `/uploads/${path.basename(imagePath)}`;
};
