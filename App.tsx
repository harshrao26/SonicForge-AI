
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic2, Volume2, History, AlertCircle, PlayCircle, Download, Trash2, LogOut, User as UserIcon } from 'lucide-react';
import Controls from './components/Controls';
import AudioVisualizer from './components/AudioVisualizer';
import Transcript from './components/Transcript';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel'; // Import Admin Panel
import { VoiceName, SpeechStyle, GeneratedAudio, BackgroundTrack, User } from './types';
import { generateSpeech } from './services/geminiService';
import { fetchAudioBuffer, exportAudioMix } from './services/audioUtils';
import { authService } from './services/authService';
import { statsService } from './services/statsService'; // Import Stats Service

// Library of free-to-use sounds from Google's Sound Library
const BACKGROUND_TRACKS: BackgroundTrack[] = [
  { id: 'rain', name: 'Heavy Rain', category: 'Nature', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
  { id: 'coffee', name: 'Coffee Shop', category: 'Ambience', url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg' },
  { id: 'forest', name: 'Morning Forest', category: 'Nature', url: 'https://actions.google.com/sounds/v1/nature/birds_forest_morning.ogg' },
  { id: 'scifi', name: 'Space Drone', category: 'Sci-Fi', url: 'https://actions.google.com/sounds/v1/science_fiction/scifi_drone_ambience.ogg' },
  { id: 'fire', name: 'Fireplace', category: 'Ambience', url: 'https://actions.google.com/sounds/v1/ambiences/fireplace.ogg' },
];

const App: React.FC = () => {
  // -- State: Auth --
  const [user, setUser] = useState<User | null>(null);
  
  // -- State: Generation --
  const [text, setText] = useState<string>('Welcome to SonicForge. Create unlimited high-fidelity speech with custom background ambiance.');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.Kore);
  const [selectedStyle, setSelectedStyle] = useState<SpeechStyle>(SpeechStyle.Natural);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [history, setHistory] = useState<GeneratedAudio[]>([]);
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudio | null>(null);
  
  // -- State: Audio & Mixer --
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedBgTrackId, setSelectedBgTrackId] = useState<string | null>(null);
  const [bgVolume, setBgVolume] = useState<number>(0.3);
  const [speechVolume, setSpeechVolume] = useState<number>(1.0);
  const [isBgLoading, setIsBgLoading] = useState<boolean>(false);

  // -- Refs: Audio Engine --
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Sources & Nodes
  const speechSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const speechGainRef = useRef<GainNode | null>(null);
  
  const bgSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgGainRef = useRef<GainNode | null>(null);
  
  // Playback Tracking
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  
  // Cache for loaded background buffers
  const bgBuffersCache = useRef<Map<string, AudioBuffer>>(new Map());

  // Check for logged in user
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  // Initialize AudioContext safely
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      
      // Master Analyser (for visualization)
      const analyser = audioContextRef.current.createAnalyser();
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;
      analyser.connect(audioContextRef.current.destination);
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    return audioContextRef.current;
  }, []);

  // Handle Background Track Loading
  useEffect(() => {
    const loadTrack = async () => {
      if (!selectedBgTrackId) return;
      
      // Check cache first
      if (bgBuffersCache.current.has(selectedBgTrackId)) return;

      const track = BACKGROUND_TRACKS.find(t => t.id === selectedBgTrackId);
      if (!track) return;

      setIsBgLoading(true);
      try {
        const ctx = getAudioContext();
        const buffer = await fetchAudioBuffer(track.url, ctx);
        bgBuffersCache.current.set(selectedBgTrackId, buffer);
      } catch (err) {
        console.error("Failed to load background track", err);
        setError("Failed to load background audio.");
        setSelectedBgTrackId(null); // Reset if failed
      } finally {
        setIsBgLoading(false);
      }
    };

    loadTrack();
  }, [selectedBgTrackId, getAudioContext]);

  // Real-time Volume Updates
  useEffect(() => {
    if (speechGainRef.current) {
      speechGainRef.current.gain.setTargetAtTime(speechVolume, audioContextRef.current?.currentTime || 0, 0.1);
    }
    if (bgGainRef.current) {
      bgGainRef.current.gain.setTargetAtTime(bgVolume, audioContextRef.current?.currentTime || 0, 0.1);
    }
  }, [speechVolume, bgVolume]);

  // Progress Loop
  const startProgressLoop = useCallback((duration: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const update = () => {
      const elapsed = ctx.currentTime - startTimeRef.current;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);
      
      setPlaybackProgress(progress);

      if (progress < 1 && speechSourceRef.current) {
        animationFrameRef.current = requestAnimationFrame(update);
      } else if (progress >= 1) {
        // Ensure we hit 100% visually
        setPlaybackProgress(1); 
      }
    };
    
    // Cancel any existing loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(update);
  }, []);

  // Stop all audio
  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop Speech
    if (speechSourceRef.current) {
      try {
        speechSourceRef.current.stop();
      } catch (e) { /* ignore */ }
      speechSourceRef.current.disconnect();
      speechSourceRef.current = null;
    }
    // Stop Background
    if (bgSourceRef.current) {
      try {
        bgSourceRef.current.stop();
      } catch (e) { /* ignore */ }
      bgSourceRef.current.disconnect();
      bgSourceRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
  }, []);

  // Play Audio (Mixing Logic)
  const playAudio = useCallback(async (item: GeneratedAudio) => {
    stopAudio(); // Ensure clean slate
    const ctx = getAudioContext();
    
    if (!analyserRef.current) return;

    // 1. Setup Speech Chain
    const speechSource = ctx.createBufferSource();
    speechSource.buffer = item.audioBuffer;
    const speechGain = ctx.createGain();
    speechGain.gain.value = speechVolume;
    
    speechSource.connect(speechGain);
    speechGain.connect(analyserRef.current); // Connect to Master/Analyser

    speechSourceRef.current = speechSource;
    speechGainRef.current = speechGain;

    // 2. Setup Background Chain (if selected)
    if (selectedBgTrackId) {
      const bgBuffer = bgBuffersCache.current.get(selectedBgTrackId);
      
      if (bgBuffer) {
        const bgSource = ctx.createBufferSource();
        bgSource.buffer = bgBuffer;
        bgSource.loop = true; // Loop background
        
        const bgGain = ctx.createGain();
        bgGain.gain.value = bgVolume;
        
        bgSource.connect(bgGain);
        bgGain.connect(analyserRef.current); // Mix into Master
        
        bgSourceRef.current = bgSource;
        bgGainRef.current = bgGain;
        
        bgSource.start();
      }
    }

    // 3. Lifecycle Management
    speechSource.onended = () => {
      setIsPlaying(false);
      // Stop background when speech ends
      if (bgSourceRef.current) {
         try {
           bgSourceRef.current.stop();
         } catch(e) { /* ignore */ }
      }
    };

    // Start Playback & Progress Tracking
    startTimeRef.current = ctx.currentTime;
    speechSource.start();
    setIsPlaying(true);
    setCurrentAudio(item);
    startProgressLoop(item.duration);

  }, [stopAudio, getAudioContext, selectedBgTrackId, speechVolume, bgVolume, startProgressLoop]);

  // Handle Generate
  const handleGenerate = async () => {
    if (!user) return;
    setError(null);
    setIsGenerating(true);
    stopAudio();

    try {
      const ctx = getAudioContext();
      const audioBuffer = await generateSpeech(text, selectedVoice, selectedStyle, ctx);

      // Log the stats globally
      statsService.logGeneration({
        userId: user.id,
        userEmail: user.email,
        voice: selectedVoice,
        style: selectedStyle,
        characterCount: text.length
      });

      const newItem: GeneratedAudio = {
        id: Date.now().toString(),
        text,
        voice: selectedVoice,
        style: selectedStyle,
        timestamp: Date.now(),
        audioBuffer,
        duration: audioBuffer.duration
      };

      // Limit in-memory history to last 50 items to prevent memory leaks during "lakhs" of generations
      setHistory(prev => [newItem, ...prev].slice(0, 50));
      playAudio(newItem);
    } catch (err: any) {
      setError(err.message || "Failed to generate speech. Please check your API key or connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Download (Mixed)
  const handleDownload = async (item: GeneratedAudio, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let bgBuffer: AudioBuffer | null = null;
      if (selectedBgTrackId) {
        bgBuffer = bgBuffersCache.current.get(selectedBgTrackId) || null;
        if (!bgBuffer) {
          // Try to fetch if missing
          const track = BACKGROUND_TRACKS.find(t => t.id === selectedBgTrackId);
          if (track) {
             const ctx = getAudioContext();
             bgBuffer = await fetchAudioBuffer(track.url, ctx);
             bgBuffersCache.current.set(selectedBgTrackId, bgBuffer);
          }
        }
      }

      // Export mix
      const wavBlob = await exportAudioMix(
        item.audioBuffer,
        bgBuffer,
        speechVolume,
        bgVolume
      );

      // Trigger Download
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sonicforge_${item.voice}_${item.timestamp}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Export failed", err);
      setError("Failed to export audio file.");
    }
  };

  const handleReplay = (item: GeneratedAudio) => {
    playAudio(item);
  };

  const handleDelete = (id: string) => {
    if (currentAudio?.id === id) stopAudio();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleClearHistory = () => {
    stopAudio();
    setHistory([]);
    setCurrentAudio(null);
  };
  
  const handleLogout = () => {
    stopAudio();
    authService.logout();
    setUser(null);
  };

  // Render Auth Screen if not logged in
  if (!user) {
    return <AuthScreen onLoginSuccess={setUser} />;
  }

  // Render Admin Panel if Admin
  if (user.isAdmin) {
    return <AdminPanel user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div className="text-center md:text-left flex items-center gap-4">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl">
              <Mic2 className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">
                SonicForge AI
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Unlimited High-Fidelity TTS Studio
              </p>
            </div>
          </div>
          
          {/* User Profile / Logout */}
          <div className="flex items-center gap-4 bg-slate-900/50 p-2 pl-4 pr-2 rounded-xl border border-slate-800">
            <div className="flex flex-col items-end">
               <span className="text-xs text-slate-500 uppercase tracking-wider">Logged in as</span>
               <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <UserIcon className="w-3 h-3 text-indigo-400" />
                  {user.username}
               </span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-900/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Controls */}
          <div className="lg:col-span-2 space-y-6">
            <Controls 
              text={text}
              setText={setText}
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              selectedStyle={selectedStyle}
              setSelectedStyle={setSelectedStyle}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              // Mixer Props
              backgroundTracks={BACKGROUND_TRACKS}
              selectedBgTrack={selectedBgTrackId}
              onSelectBgTrack={setSelectedBgTrackId}
              speechVolume={speechVolume}
              setSpeechVolume={setSpeechVolume}
              bgVolume={bgVolume}
              setBgVolume={setBgVolume}
              isBgLoading={isBgLoading}
            />

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg flex items-center gap-3 text-red-400 animate-fadeIn">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Visualizer Area */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-lg space-y-6">
              {/* Top Bar */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> Audio Output
                </h2>
                {currentAudio && isPlaying && (
                  <span className="text-xs text-indigo-400 animate-pulse font-bold">Live Playback</span>
                )}
              </div>

              {/* Visualizer Canvas */}
              <AudioVisualizer analyser={analyserRef.current} isPlaying={isPlaying} />
              
              {/* Transcript */}
              <Transcript 
                text={currentAudio ? currentAudio.text : text} 
                progress={playbackProgress} 
                duration={currentAudio ? currentAudio.duration : 0}
                isPlaying={isPlaying}
              />

              {/* Meta Info */}
              {currentAudio && (
                <div className="text-center">
                   <p className="text-slate-500 text-xs flex justify-center items-center gap-2">
                     <span className="bg-slate-800 px-2 py-1 rounded-md border border-slate-700">{currentAudio.voice}</span>
                     <span className="text-slate-600">•</span>
                     <span className="bg-slate-800 px-2 py-1 rounded-md border border-slate-700">{currentAudio.style}</span>
                     {selectedBgTrackId && (
                       <>
                        <span className="text-slate-600">+</span>
                        <span className="text-indigo-400 bg-indigo-950/30 px-2 py-1 rounded-md border border-indigo-900/50">
                           {BACKGROUND_TRACKS.find(t => t.id === selectedBgTrackId)?.name}
                        </span>
                       </>
                     )}
                   </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/30 rounded-2xl border border-slate-800/50 h-[900px] flex flex-col shadow-2xl">
              <div className="p-5 border-b border-slate-800/50 bg-slate-900/80 rounded-t-2xl flex justify-between items-center backdrop-blur-sm">
                <h3 className="font-semibold text-slate-300 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  History ({history.length})
                </h3>
                {history.length > 0 && (
                  <button 
                    onClick={handleClearHistory}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-950/50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-4">
                    <div className="mb-3 p-4 rounded-full bg-slate-800/50">
                      <Volume2 className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">Your generated clips appear here.</p>
                    <p className="text-xs mt-1 text-slate-500">Create, mix, and download unlimited audio.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handleReplay(item)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer group relative ${
                        currentAudio?.id === item.id && isPlaying
                          ? 'bg-indigo-900/20 border-indigo-500/50 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-900/10' 
                          : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                           currentAudio?.id === item.id && isPlaying ? 'text-indigo-300 bg-indigo-900/50' : 'text-slate-400 bg-slate-700/50'
                        }`}>
                          {item.voice}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2 mb-3 pr-8">
                        {item.text}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                         <span className="text-xs text-slate-500 font-mono">
                           {item.duration.toFixed(1)}s
                         </span>
                         <div className="flex items-center gap-1">
                           <button 
                             onClick={(e) => handleDownload(item, e)}
                             className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-green-950/30 rounded transition-colors"
                             title="Download Mix (WAV)"
                           >
                             <Download className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                             className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                             title="Delete"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                      </div>
                      
                      {/* Play Overlay on Hover if not playing */}
                      {!(currentAudio?.id === item.id && isPlaying) && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <PlayCircle className="w-8 h-8 text-white drop-shadow-lg" />
                         </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
