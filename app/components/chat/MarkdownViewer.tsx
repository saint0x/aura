import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Image from 'next/image';
import 'katex/dist/katex.min.css';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-viewer ${className} prose prose-indigo max-w-none`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline && language) {
              return (
                <div className="relative group">
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigator.clipboard.writeText(String(children))}
                      className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: '1em 0',
                      borderRadius: '0.5rem',
                      padding: '1em'
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return (
              <code className={`${className} bg-gray-100 text-gray-800 rounded px-1`} {...props}>
                {children}
              </code>
            );
          },
          img({ src, alt }) {
            if (!src) return null;
            
            // Handle relative URLs and external URLs differently
            const isExternal = src.startsWith('http') || src.startsWith('https');
            
            return (
              <div className="relative w-full h-64 my-4">
                <Image
                  src={src}
                  alt={alt || ''}
                  fill
                  className="rounded-lg object-contain"
                  loading="lazy"
                  unoptimized={isExternal}
                />
              </div>
            );
          },
          // Custom styling for other markdown elements
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold mb-3 mt-6 text-gray-800">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-bold mb-2 mt-4 text-gray-800">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-gray-700">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4 text-gray-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 text-gray-700">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="mb-1 text-gray-700">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-200 pl-4 italic my-4 text-gray-600">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-gray-200">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 bg-gray-50 text-left text-gray-700">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border-t border-gray-100 text-gray-700">{children}</td>
          ),
          a: ({ children, href }) => (
            <a 
              href={href}
              className="text-indigo-600 hover:text-indigo-500 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          pre: ({ children }) => (
            <pre className="bg-gray-50 rounded-lg overflow-x-auto">
              {children}
            </pre>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer; 