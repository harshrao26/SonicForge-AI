
export enum VoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export enum SpeechStyle {
  Natural = 'Natural',
  Cheerful = 'Cheerful',
  Empathetic = 'Empathetic',
  Professional = 'Professional',
  Whisper = 'Whisper',
  Newscaster = 'Newscaster',
  IndianAccent = 'Indian Accent',
}

export interface BackgroundTrack {
  id: string;
  name: string;
  url: string;
  category: 'Nature' | 'Ambience' | 'Sci-Fi';
}

export interface GeneratedAudio {
  id: string;
  text: string;
  voice: VoiceName;
  style: SpeechStyle;
  timestamp: number;
  audioBuffer: AudioBuffer;
  duration: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  password?: string; // In a real app, this is hashed. Storing locally for demo.
  createdAt: number;
  isAdmin?: boolean;
}

export interface GenerationLog {
  id: string;
  userId: string;
  userEmail: string; // Denormalized for easier display
  timestamp: number;
  voice: VoiceName;
  style: SpeechStyle;
  characterCount: number;
}
