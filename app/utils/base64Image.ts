// utils.ts

export function generateBase64ImageUrl(imagePath: string): string {
    const base64ArrayBuffer = require('base64-arraybuffer');
    const fs = require('fs');
  
    // Read the image file as a buffer
    const imageBuffer = fs.readFileSync(imagePath);
    // Encode the buffer as a Base64 string
    const base64 = base64ArrayBuffer.encode(imageBuffer);
  
    return `data:image/jpeg;base64,${base64}`;
  }
  