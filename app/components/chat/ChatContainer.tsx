import React, { useRef, useEffect, useCallback } from 'react';
import Message from './Message';
import { Message as MessageType } from '@/app/types';

interface ChatContainerProps {
  messages: MessageType[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  messages,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(isLoading);

  // Update loading ref when prop changes
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Check if we're near the bottom of the container
  const isNearBottom = useCallback(() => {
    if (!containerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - (scrollTop + clientHeight) < 100;
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only auto-scroll if the last message is from the assistant or if we're near the bottom
      if (lastMessage.role === 'assistant' || isNearBottom()) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, [messages, isNearBottom]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && !isLoadingRef.current && hasMore) {
          onLoadMore();
        }
      },
      {
        root: containerRef.current,
        threshold: 0.1,
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  return (
    <div 
      ref={containerRef}
      className={`flex-1 overflow-y-auto bg-white scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-gray-50 ${className}`}
    >
      <div className="min-h-full">
        {/* Intersection Observer Target */}
        {hasMore && (
          <div
            ref={observerRef}
            className="h-8 flex items-center justify-center"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-indigo-500" />
            )}
          </div>
        )}

        {/* Welcome Message */}
        {messages.length === 0 && (
          <div className="p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-700 mb-4">Welcome to Aura</h1>
            <p className="text-gray-600 mb-2">I&apos;m your AI assistant. How can I help you today?</p>
            <p className="text-gray-500 text-sm">Try asking me anything!</p>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <Message
            key={index}
            message={message}
            isLast={index === messages.length - 1}
            isLoading={isLoading && index === messages.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatContainer; 