import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { CircuitBreakerThresholds } from '../types';

interface VoiceStreamProcessorConfig {
  apiKey: string;
  voiceName: string; // Configurable Voice
  isAcousticCaptureActive: boolean; // Mic Toggle
  onTranscriptUpdate: (text: string, isFinal: boolean) => void;
  onAudioData: (audioBuffer: AudioBuffer) => void; // Model Output
  onSpectralFluxAnalysis: (amplitude: number) => void; // Microphone Input Level
}

export const useVoiceStreamProcessor = ({ 
  apiKey, 
  voiceName,
  isAcousticCaptureActive,
  onTranscriptUpdate, 
  onAudioData,
  onSpectralFluxAnalysis
}: VoiceStreamProcessorConfig) => {
  const [isConnectionActive, setIsConnectionActive] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  const sessionRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Audio Processing Helpers
  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    const binaryString = Array.from(new Uint8Array(int16.buffer))
      .map((byte) => String.fromCharCode(byte))
      .join("");
    return {
      data: btoa(binaryString),
      mimeType: "audio/pcm;rate=16000",
    };
  };

  const decodeAudioData = async (base64: string, ctx: AudioContext): Promise<AudioBuffer> => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length; 
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const calculateRMS = (data: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  };

  const initiateNeuralLink = useCallback(async () => {
    if (!apiKey) {
      setConnectionError("CRITICAL: API_KEY_MISSING");
      return;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      if (!inputAudioContextRef.current) {
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
          } 
        });
      }

      console.log(`[NEURAL_LINK] Attempting connection (Attempt ${retryAttempt + 1}) | Voice: ${voiceName}`);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          systemInstruction: "You are a ruthless corporate negotiator simulating a hostile takeover scenario. Be brief, demanding, and analyze the user's confidence.",
          inputAudioTranscription: {}, 
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            console.log("[NEURAL_LINK] Established.");
            setIsConnectionActive(true);
            setConnectionError(null);
            setRetryAttempt(0);

            if (!inputAudioContextRef.current || !streamRef.current) return;
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate Input Amplitude (Spectral Flux)
              const rms = calculateRMS(inputData);
              onSpectralFluxAnalysis(rms);

              // Gating Logic: Only send if Mic is Active
              if (isAcousticCaptureActive) {
                const pcmBlob = createBlob(inputData);
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription?.text) {
              onTranscriptUpdate(msg.serverContent.inputTranscription.text, false);
            }
            
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const buffer = await decodeAudioData(audioData, outputAudioContextRef.current);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioContextRef.current.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              
              onAudioData(buffer);
            }
          },
          onclose: (e) => {
            console.log("[NEURAL_LINK] Connection Closed.");
            setIsConnectionActive(false);
          },
          onerror: (e: any) => {
            console.error("[NEURAL_LINK] Error:", e);
            setIsConnectionActive(false);
            
            // Enhanced Error Reporting
            const errorMsg = e.message || e.toString();
            const errorCode = errorMsg.includes("40") ? "AUTH_FAILURE" : errorMsg.includes("50") ? "SERVER_OVERLOAD" : "PROTOCOL_ERROR";
            const detailedError = `[${errorCode}] ${errorMsg}`;
            
            if (retryAttempt < CircuitBreakerThresholds.MAX_RETRY_ATTEMPTS) {
              const backoffDelay = Math.pow(2, retryAttempt) * 1000;
              console.warn(`[CIRCUIT_BREAKER] Connection destabilized. Retrying in ${backoffDelay}ms...`);
              setConnectionError(`${detailedError} :: RETRYING_IN_${backoffDelay}ms`);
              
              retryTimeoutRef.current = setTimeout(() => {
                setRetryAttempt(prev => prev + 1);
                initiateNeuralLink(); 
              }, backoffDelay);
            } else {
              setConnectionError(`CIRCUIT_BREAKER_OPEN :: ${detailedError}`);
            }
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err: any) {
      setConnectionError(`INITIALIZATION_FAILURE :: ${err.message}`);
      setIsConnectionActive(false);
    }
  }, [apiKey, voiceName, isAcousticCaptureActive, onTranscriptUpdate, onAudioData, onSpectralFluxAnalysis, retryAttempt]);

  const severNeuralLink = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setRetryAttempt(0);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setIsConnectionActive(false);
    setConnectionError(null);
  }, []);

  return {
    isConnectionActive,
    connectionError,
    initiateNeuralLink,
    severNeuralLink
  };
};
