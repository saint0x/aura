import React, { memo } from 'react';
import { Message as MessageType } from '@/app/types';
import MarkdownViewer from './MarkdownViewer';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { ComputerDesktopIcon } from '@heroicons/react/24/outline';

interface MessageProps {
  message: MessageType;
  isLast: boolean;
  isLoading?: boolean;
  className?: string;
}

const Message: React.FC<MessageProps> = memo(({ 
  message, 
  isLast, 
  isLoading = false,
  className = '' 
}) => {
  const isUser = message.role === 'user';
  const timestamp = message.timestamp ? new Date(message.timestamp) : null;

  return (
    <div 
      className={`py-6 ${isLast ? '' : 'border-b border-gray-100'} ${className} ${
        isLoading ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start space-x-4 max-w-4xl mx-auto px-4">
        <div className="flex-shrink-0">
          {isUser ? (
            <UserCircleIcon className="h-8 w-8 text-indigo-500" />
          ) : (
            <ComputerDesktopIcon className="h-8 w-8 text-emerald-500" />
          )}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium text-gray-700">
              {isUser ? 'You' : 'Assistant'}
            </div>
            {timestamp && (
              <div className="text-xs text-gray-400">
                {timestamp.toLocaleString()}
              </div>
            )}
          </div>
          <div 
            className={`rounded-lg ${
              isUser ? 'bg-indigo-50' : 'bg-emerald-50'
            } p-4 transition-colors duration-200 hover:bg-opacity-90 shadow-sm`}
          >
            <MarkdownViewer 
              content={message.content} 
              className={isUser ? 'text-gray-800' : 'text-gray-900'}
            />
          </div>
          {message.metadata && (
            <div className="mt-2 text-xs text-gray-500 hover:text-gray-600 transition-colors duration-200">
              <MarkdownViewer
                content={`\`\`\`json\n${JSON.stringify(message.metadata, null, 2)}\n\`\`\``}
                className="text-xs"
              />
            </div>
          )}
          {message.error && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg p-2 border border-red-100">
              {message.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Message.displayName = 'Message';

export default Message; 