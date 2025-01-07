'use client';

import { useState, useRef } from 'react';
import { Message as MessageType } from '@/app/types';
import AssistantButton from './components/AssistantButton';
import AudioWaveform from './components/AudioWaveform';
import ChatContainer from './components/chat/ChatContainer';

export default function Home() {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleSendMessage = async (message: string, audioUrl?: string, transcription?: string) => {
    if ((!message.trim() && !audioUrl) || isLoading) return;

    setIsLoading(true);
    setError(null);

    const newMessage: MessageType = {
      role: 'user',
      content: audioUrl ? 'Audio message' : message,
      metadata: audioUrl ? {
        audioUrl,
        transcription
      } : undefined
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.metadata?.transcription || msg.content
            })),
            {
              role: 'user',
              content: transcription || message
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      
      // Only generate TTS if voice is enabled and input was voice
      let audioUrl;
      if (voiceEnabled && (audioUrl || transcription)) {
        try {
          const ttsResponse = await fetch('/api/voice/elevenlabs-tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.content }),
          });

          if (ttsResponse.ok) {
            const audioBlob = await ttsResponse.blob();
            audioUrl = URL.createObjectURL(audioBlob);
          } else {
            console.error('TTS generation failed, continuing with text-only response');
          }
        } catch (error) {
          console.error('Error generating TTS:', error);
        }
      }

      const aiMessage: MessageType = {
        role: 'assistant',
        content: data.content,
        metadata: audioUrl ? {
          audioUrl,
          transcription: data.content
        } : data.metadata
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      setError('Failed to get response from AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordingStatus('Processing...');
      mediaRecorderRef.current?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const audioChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.wav');

          try {
            setRecordingStatus('Transcribing...');
            const response = await fetch('/api/voice/whisper-stt', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Failed to transcribe audio');
            }

            const data = await response.json();
            setRecordingStatus('');
            handleSendMessage('', audioUrl, data.text);
          } catch (error) {
            console.error('Error in speech-to-text conversion:', error);
            setError('Failed to transcribe audio. Please try again.');
            setRecordingStatus('');
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingStatus('Recording...');
      } catch (error) {
        console.error('Error starting recording:', error);
        setError('Failed to start recording. Please check your microphone permissions.');
        setRecordingStatus('');
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-12 lg:p-24 bg-gray-950">
      <div className="z-10 w-full max-w-5xl bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
        <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-800 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Aura AI Assistant</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">Voice</span>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                voiceEnabled ? 'bg-green-500' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex-1 h-[60vh]">
          <ChatContainer messages={messages} isLoading={isLoading} />
        </div>

        <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-800">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputMessage); }} className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleVoiceRecording}
              className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-300'} hover:bg-opacity-80 transition-colors`}
              disabled={!voiceEnabled}
            >
              {isRecording ? '⏹️' : '🎤'}
            </button>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow p-3 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || isRecording}
            />
            <AssistantButton
              onClick={() => handleSendMessage(inputMessage)}
              disabled={isLoading || isRecording || !inputMessage.trim()}
            />
          </form>
          {(recordingStatus || error) && (
            <div className="mt-2">
              {recordingStatus && <p className="text-blue-400">{recordingStatus}</p>}
              {error && <p className="text-red-400">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
