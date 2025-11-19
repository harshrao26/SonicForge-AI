import React, { useEffect, useRef } from 'react';
import { FileText, AlignLeft } from 'lucide-react';

interface TranscriptProps {
  text: string;
  progress: number; // 0 to 1
  duration: number; // in seconds
  isPlaying: boolean;
}

const Transcript: React.FC<TranscriptProps> = ({ text, progress, duration, isPlaying }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const words = text.split(/\s+/);
  
  // Estimated current word index based on linear progression
  // In a production production (non-linear) alignment, we would use timestamp metadata.
  // For TTS, linear distribution is often a very close approximation.
  const currentWordIndex = Math.floor(progress * words.length);

  useEffect(() => {
    // Auto-scroll to the active word
    if (isPlaying && containerRef.current) {
      const activeElement = containerRef.current.querySelector(`[data-index="${currentWordIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    }
  }, [currentWordIndex, isPlaying]);

  return (
    <div className="flex flex-col h-64 bg-slate-900/50 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-indigo-300 font-medium">
          <FileText className="w-4 h-4" />
          <span>Live Transcript</span>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {isPlaying && duration > 0 
            ? `${(progress * duration).toFixed(1)}s / ${duration.toFixed(1)}s`
            : 'Ready'}
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 text-lg leading-relaxed custom-scrollbar relative"
      >
        <div className="flex flex-wrap gap-x-1.5 gap-y-1">
          {words.map((word, index) => {
            const isActive = index === currentWordIndex;
            const isPast = index < currentWordIndex;
            
            return (
              <span
                key={index}
                data-index={index}
                className={`transition-all duration-200 rounded px-0.5 ${
                  isActive 
                    ? 'text-white bg-indigo-500/30 font-semibold scale-105 shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                    : isPast 
                      ? 'text-slate-300' 
                      : 'text-slate-600'
                }`}
              >
                {word}
              </span>
            );
          })}
        </div>
        
        {!text && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-50">
            <AlignLeft className="w-8 h-8 mb-2" />
            <span className="text-sm">Transcript will appear here</span>
          </div>
        )}
      </div>
      
      {/* Progress Bar Indicator */}
      <div className="h-1 bg-slate-800 w-full">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-100 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Transcript;
