
// Base64 decoding to bytes
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw PCM Int16 data into an AudioBuffer
export async function decodePCMData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  
  // Create a buffer at the source sample rate
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Fetches and decodes audio from a URL
export async function fetchAudioBuffer(url: string, ctx: AudioContext | OfflineAudioContext): Promise<AudioBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
}

// --- Export & Mixing Utilities ---

// Convert AudioBuffer to WAV Blob
export function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // Write WAV Header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this encoder)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // Interleave channels
  for (i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  while (pos < buffer.length) {
    for (i = 0; i < numOfChan; i++) {
      // clamp
      sample = Math.max(-1, Math.min(1, channels[i][pos])); 
      // scale to 16-bit signed int
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; 
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([bufferArr], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

// Mixes speech and background offline for download
export async function exportAudioMix(
  speechBuffer: AudioBuffer,
  bgBuffer: AudioBuffer | null,
  speechVolume: number,
  bgVolume: number
): Promise<Blob> {
  // Setup OfflineAudioContext
  // Duration is controlled by speech, or slightly longer for decay if needed
  const duration = speechBuffer.duration;
  const sampleRate = 44100; // Standard for export
  const length = Math.ceil(duration * sampleRate);
  
  const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

  // 1. Prepare Speech
  const speechSource = offlineCtx.createBufferSource();
  speechSource.buffer = speechBuffer;
  const speechGain = offlineCtx.createGain();
  speechGain.gain.value = speechVolume;
  speechSource.connect(speechGain);
  speechGain.connect(offlineCtx.destination);
  speechSource.start(0);

  // 2. Prepare Background (if exists and volume > 0)
  if (bgBuffer && bgVolume > 0) {
    const bgSource = offlineCtx.createBufferSource();
    bgSource.buffer = bgBuffer;
    bgSource.loop = true;
    
    const bgGain = offlineCtx.createGain();
    bgGain.gain.value = bgVolume;
    
    bgSource.connect(bgGain);
    bgGain.connect(offlineCtx.destination);
    bgSource.start(0);
  }

  // 3. Render
  const renderedBuffer = await offlineCtx.startRendering();
  
  // 4. Convert to Blob
  return bufferToWav(renderedBuffer);
}
