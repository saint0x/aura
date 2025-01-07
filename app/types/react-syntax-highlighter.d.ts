declare module 'react-syntax-highlighter' {
  import { ComponentType, ReactNode } from 'react';

  export interface SyntaxHighlighterProps {
    language?: string;
    style?: any;
    children?: ReactNode;
    customStyle?: any;
    codeTagProps?: any;
    [key: string]: any;
  }

  export const Prism: ComponentType<SyntaxHighlighterProps>;
  export const Light: ComponentType<SyntaxHighlighterProps>;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  const styles: {
    vscDarkPlus: any;
    [key: string]: any;
  };
  export const vscDarkPlus: any;
  export default styles;
} 