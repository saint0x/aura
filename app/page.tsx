'use client';

import { useState, useRef } from 'react';
import AssistantButton from './components/AssistantButton';
import AudioWaveform from './components/AudioWaveform';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  transcription?: string;
}

export default function Home() {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleSendMessage = async (message: string, audioUrl?: string, transcription?: string) => {
    if ((!message.trim() && !audioUrl) || isLoading) return;

    setIsLoading(true);
    setError(null);

    const newMessage: Message = { 
      role: 'user', 
      content: audioUrl ? 'Audio message' : message,
      audioUrl,
      transcription
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInputMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: transcription || message }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      
      // Generate TTS for AI response
      const ttsResponse = await fetch('/api/voice/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: data.message }),
      });

      if (!ttsResponse.ok) {
        throw new Error('Failed to generate speech for AI response');
      }

      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const aiMessage: Message = { 
        role: 'assistant', 
        content: data.message,
        audioUrl,
        transcription: data.message
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
        console.error('Error accessing microphone:', error);
        setError('Failed to access microphone. Please check your permissions.');
        setRecordingStatus('');
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-100">
      <div className="z-10 w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 bg-blue-600 text-white">
          <h1 className="text-2xl font-bold">Aura AI Assistant</h1>
        </div>
        <div className="h-[60vh] overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-lg ${
                msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
              }`}>
                {msg.audioUrl ? (
                  <AudioWaveform 
                    audioUrl={msg.audioUrl} 
                    transcription={msg.transcription || ''} 
                    isAIResponse={msg.role === 'assistant'}
                    autoPlay={msg.role === 'assistant'}
                  />
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputMessage); }} className="p-4 border-t flex items-center">
          <button
            type="button"
            onClick={handleVoiceRecording}
            className={`p-2 ${isRecording ? 'text-red-500' : 'text-blue-500'} hover:text-blue-700 mr-2`}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isLoading || isRecording}
          />
          <AssistantButton
            onClick={() => handleSendMessage(inputMessage)}
            disabled={isLoading || isRecording || !inputMessage.trim()}
          />
        </form>
        {(recordingStatus || error) && (
          <div className="p-4 border-t">
            {recordingStatus && <p className="text-blue-500">{recordingStatus}</p>}
            {error && <p className="text-red-500">{error}</p>}
          </div>
        )}
      </div>
    </main>
  );
}
