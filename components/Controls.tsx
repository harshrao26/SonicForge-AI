
import React from 'react';
import { VoiceName, SpeechStyle, BackgroundTrack } from '../types';
import { Sparkles, PlayCircle, Loader2, Music, Volume2 } from 'lucide-react';

interface ControlsProps {
  text: string;
  setText: (text: string) => void;
  selectedVoice: VoiceName;
  setSelectedVoice: (voice: VoiceName) => void;
  selectedStyle: SpeechStyle;
  setSelectedStyle: (style: SpeechStyle) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  
  // Mixer Props
  backgroundTracks: BackgroundTrack[];
  selectedBgTrack: string | null;
  onSelectBgTrack: (id: string | null) => void;
  speechVolume: number;
  setSpeechVolume: (vol: number) => void;
  bgVolume: number;
  setBgVolume: (vol: number) => void;
  isBgLoading: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  text,
  setText,
  selectedVoice,
  setSelectedVoice,
  selectedStyle,
  setSelectedStyle,
  onGenerate,
  isGenerating,
  backgroundTracks,
  selectedBgTrack,
  onSelectBgTrack,
  speechVolume,
  setSpeechVolume,
  bgVolume,
  setBgVolume,
  isBgLoading,
}) => {
  return (
    <div className="space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm">
      {/* Text Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Input Text</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to transform into lifelike speech (up to 10,000 characters)..."
          className="w-full h-48 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
          maxLength={10000}
        />
        <div className="flex justify-end text-xs text-slate-500">
          {text.length} / 10,000 characters
        </div>
      </div>

      {/* Voice & Style Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Voice Model</label>
          <div className="relative">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as VoiceName)}
              className="w-full appearance-none bg-slate-900 border border-slate-700 text-slate-100 py-3 px-4 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
            >
              {Object.values(VoiceName).map((voice) => (
                <option key={voice} value={voice}>{voice}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            AI Style <Sparkles className="w-3 h-3 text-yellow-500" />
          </label>
          <div className="relative">
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as SpeechStyle)}
              className="w-full appearance-none bg-slate-900 border border-slate-700 text-slate-100 py-3 px-4 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
            >
              {Object.values(SpeechStyle).map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Mixer Section */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 space-y-4">
        <div className="flex items-center gap-2 text-indigo-300 font-medium mb-2">
          <Music className="w-4 h-4" />
          <span>Background Ambiance Mixer</span>
          {isBgLoading && <Loader2 className="w-3 h-3 animate-spin ml-auto text-indigo-400" />}
        </div>
        
        {/* Track Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => onSelectBgTrack(null)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
              selectedBgTrack === null
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            No Audio
          </button>
          {backgroundTracks.map((track) => (
            <button
              key={track.id}
              onClick={() => onSelectBgTrack(track.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border text-left truncate ${
                selectedBgTrack === track.id
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
              title={track.name}
            >
              {track.name}
            </button>
          ))}
        </div>

        {/* Volume Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Speech Volume */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>Voice Level</span>
              <span>{Math.round(speechVolume * 100)}%</span>
            </div>
            <div className="relative flex items-center">
               <Volume2 className="w-4 h-4 text-slate-500 absolute left-0 -ml-6" />
               <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={speechVolume}
                onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          {/* Background Volume */}
          <div className={`space-y-2 transition-opacity duration-300 ${selectedBgTrack ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div className="flex justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
              <span>Ambience Level</span>
              <span>{Math.round(bgVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bgVolume}
              onChange={(e) => setBgVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating || !text.trim()}
        className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${
          isGenerating || !text.trim()
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25'
        }`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Generating Audio...
          </>
        ) : (
          <>
            <PlayCircle className="w-5 h-5" /> Generate Speech
          </>
        )}
      </button>
    </div>
  );
};

export default Controls;
