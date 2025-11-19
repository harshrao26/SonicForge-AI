
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName, SpeechStyle } from "../types";
import { decodeBase64, decodePCMData } from "./audioUtils";

const API_KEY = process.env.API_KEY || '';

// Initialize Gemini Client
// Note: API key is handled via process.env as per instructions.
// We create the client inside the function to ensure we pick up the key if it changes/exists.

export const generateSpeech = async (
  text: string,
  voice: VoiceName,
  style: SpeechStyle,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  if (!API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Prompt Engineering to simulate "styles" since the API doesn't have a direct style param yet,
  // but the model instruction follows instructions well.
  let promptText = text;
  
  if (style === SpeechStyle.IndianAccent) {
    promptText = `Speak the following text in English with a clear Indian accent: "${text}"`;
  } else if (style !== SpeechStyle.Natural) {
    promptText = `Say the following text in a ${style.toLowerCase()} tone: "${text}"`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from Gemini.");
    }

    const rawBytes = decodeBase64(base64Audio);
    
    // Gemini TTS currently outputs 24kHz PCM
    const audioBuffer = await decodePCMData(rawBytes, audioContext, 24000, 1);

    return audioBuffer;

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};
