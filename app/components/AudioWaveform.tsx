import React, { useState, useEffect, useRef } from 'react';

interface AudioWaveformProps {
  audioUrl: string;
  transcription: string;
  isAIResponse: boolean;
  autoPlay?: boolean;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ audioUrl, transcription, isAIResponse, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (audioRef.current && canvasRef.current) {
      const audio = audioRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (!sourceNodeRef.current) {
          sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audio);
        }

        if (!analyserRef.current) {
          analyserRef.current = audioContextRef.current.createAnalyser();
          sourceNodeRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }

        const analyser = analyserRef.current;
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          ctx.fillStyle = isAIResponse ? 'rgb(229, 231, 235)' : 'rgb(59, 130, 246)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 2.5;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 2;
            ctx.fillStyle = isAIResponse ? `rgb(107, 114, 128)` : `rgb(255, 255, 255)`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
          }
        };

        draw();

        if (autoPlay) {
          audio.play();
          setIsPlaying(true);
        }
      }
    }
  }, [audioUrl, isAIResponse, autoPlay]);

  const togglePlayPause = () => {
    if (audioRef.current && !isAIResponse) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <canvas ref={canvasRef} className="w-full h-20 cursor-pointer" onClick={togglePlayPause} />
        {!isAIResponse && (
          <button
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center`}
            onClick={togglePlayPause}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        )}
      </div>
      <p className="text-xs italic mt-1">{transcription}</p>
      <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
    </div>
  );
};

export default AudioWaveform;