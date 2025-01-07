declare module 'screenshot-desktop' {
  export interface ScreenshotOptions {
    screen?: number;
    format?: string;
    filename?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }

  export default function screenshot(options?: ScreenshotOptions): Promise<Buffer>;
} 