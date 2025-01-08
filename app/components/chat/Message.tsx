import { Message as MessageType, MessageMetadata } from '@/app/types/chat';
import MarkdownViewer from './MarkdownViewer';
import AudioWaveform from '../AudioWaveform';

interface MessageProps {
  message: MessageType;
  isLast: boolean;
  isLoading: boolean;
}

export default function Message({ message, isLast, isLoading }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl rounded-lg p-4 ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'}`}>
        {message.metadata?.audioUrl ? (
          <div className="space-y-2">
            <AudioWaveform 
              audioUrl={message.metadata.audioUrl}
              transcription={message.metadata.transcription || ''}
              isAIResponse={!isUser}
            />
            {message.metadata.transcription && (
              <div className="text-sm text-gray-300">
                <MarkdownViewer content={message.metadata.transcription} />
              </div>
            )}
          </div>
        ) : (
          <MarkdownViewer content={message.content} />
        )}
        {isLast && isLoading && (
          <div className="mt-2 flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
    </div>
  );
} 