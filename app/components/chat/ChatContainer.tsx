import { useEffect, useRef } from 'react';
import { Message as MessageType, MessageMetadata } from '@/app/types/chat';
import Message from './Message';
import MarkdownViewer from './MarkdownViewer';

interface ChatContainerProps {
  messages: MessageType[];
  isLoading: boolean;
}

export default function ChatContainer({ messages, isLoading }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div key={index} className="flex flex-col space-y-2">
          <Message message={message} isLast={index === messages.length - 1} isLoading={isLoading && index === messages.length - 1} />
          {message.metadata?.reasoning_chain && (
            <div className="ml-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Reasoning Chain</h3>
              <div className="space-y-2">
                {message.metadata.reasoning_chain.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="text-sm text-gray-400">
                    <span className="font-medium text-gray-300">{step.type}: </span>
                    <MarkdownViewer content={step.content || ''} />
                    {step.explanation && (
                      <div className="ml-4 text-gray-500">
                        <span className="font-medium">Explanation: </span>
                        {step.explanation}
                      </div>
                    )}
                    {step.observation && (
                      <div className="ml-4 text-gray-500">
                        <span className="font-medium">Observation: </span>
                        {step.observation}
                      </div>
                    )}
                    {step.decision && (
                      <div className="ml-4 text-gray-500">
                        <span className="font-medium">Decision: </span>
                        {step.decision}
                      </div>
                    )}
                  </div>
                ))}
                {message.metadata.reasoning_chain.conclusion && (
                  <div className="mt-4 text-sm">
                    <span className="font-medium text-gray-300">Conclusion: </span>
                    <MarkdownViewer content={message.metadata.reasoning_chain.conclusion || ''} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-center space-x-2 text-gray-400">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
} 