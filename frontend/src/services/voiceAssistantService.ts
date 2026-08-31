import { api } from './api';
import type { VoiceHistoryItem } from '../types/voiceAssistant';

export type ConversationalState =
  | 'IDLE'
  | 'ACTIVE_LISTENING'
  | 'USER_SPEAKING'
  | 'AI_PROCESSING'
  | 'AI_SPEAKING'
  | 'ERROR'
  | 'ENDED';

export interface VoiceChatResult {
  id: string;
  conversation_id: string;
  transcript: string;
  response: string;
  speech_text: string;
  action?: { label: string; route: string } | null;
  message_type?: string;
  consultation_state?: string;
  timestamp: string;
  latency_ms?: number;
  model?: string;
}

interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

function isHindiOrHinglish(text: string): boolean {
  if (/[\u0900-\u097F]/.test(text)) return true;

  const hinglishWords = [
    'namaste', 'aap', 'aapka', 'aapki', 'kya', 'hai', 'hoon', 'nahi', 'kuch',
    'baat', 'karni', 'thi', 'dard', 'bukhar', 'khansi', 'dawai', 'theek',
    'shukriya', 'bataiye', 'kaisa', 'kaise', 'chal', 'raha', 'seene', 'chhati',
    'ulti', 'chakkar', 'sar', 'sir', 'pet', 'gale', 'kamzori'
  ];
  const words = text.toLowerCase().split(/\W+/);
  return words.some((w) => hinglishWords.includes(w));
}

export class HandsFreeVoiceEngine {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recognition: any = null;

  private state: ConversationalState = 'IDLE';
  private activeConversationId: string | null = null;
  private isMuted: boolean = false;
  private isEngineRunning: boolean = false;
  private isRecognitionStarting: boolean = false;

  private currentTranscript: string = '';
  private silenceTimer: number | null = null;
  private readonly SILENCE_DURATION_MS = 900; // 900ms natural pause before auto-submit

  private smoothedAmplitude: number = 0;
  private animationFrameId: number | null = null;

  // Callbacks
  private onStateChange: ((state: ConversationalState) => void) | null = null;
  private onLiveTranscript: ((userText: string, isFinal: boolean) => void) | null = null;
  private onAIResponse: ((result: VoiceChatResult) => void) | null = null;
  private onAudioMetrics: ((amplitude: number, frequencies: number[]) => void) | null = null;
  private onError: ((message: string) => void) | null = null;

  public setCallbacks(handlers: {
    onStateChange: (state: ConversationalState) => void;
    onLiveTranscript: (userText: string, isFinal: boolean) => void;
    onAIResponse: (result: VoiceChatResult) => void;
    onAudioMetrics: (amplitude: number, frequencies: number[]) => void;
    onError: (message: string) => void;
  }) {
    this.onStateChange = handlers.onStateChange;
    this.onLiveTranscript = handlers.onLiveTranscript;
    this.onAIResponse = handlers.onAIResponse;
    this.onAudioMetrics = handlers.onAudioMetrics;
    this.onError = handlers.onError;
  }

  public setConversationId(id: string | null) {
    this.activeConversationId = id;
  }

  public getConversationId(): string | null {
    return this.activeConversationId;
  }

  public getState(): ConversationalState {
    return this.state;
  }

  private setState(newState: ConversationalState) {
    if (this.state === newState) return;
    this.state = newState;
    this.onStateChange?.(newState);
  }

  /**
   * 1. Start Hands-Free Continuous Voice Loop
   */
  public async startSession(initialConversationId?: string): Promise<boolean> {
    try {
      if (initialConversationId) {
        this.activeConversationId = initialConversationId;
      }

      this.isEngineRunning = true;
      this.setState('ACTIVE_LISTENING');

      // Request / initialize mic stream
      if (!this.mediaStream || this.mediaStream.getTracks().every((t) => t.readyState === 'ended')) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      this.initAudioAnalyzer();
      this.startListeningForUser();
      return true;
    } catch (err: any) {
      console.warn('Microphone permission error:', err);
      this.isEngineRunning = false;
      this.setState('ERROR');
      this.onError?.('Microphone access was denied. Please allow microphone permissions in your browser address bar.');
      return false;
    }
  }

  /**
   * 2. Real-time Audio Amplitude & Frequency Analyzer for Orb Visualizer
   */
  private initAudioAnalyzer() {
    if (!this.mediaStream) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      if (!this.analyser) {
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.7;
        source.connect(this.analyser);
      }

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const processAudioFrame = () => {
        if (!this.analyser || !this.isEngineRunning) return;

        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const rawAvg = sum / bufferLength / 255;

        const target = this.isMuted || this.state === 'AI_SPEAKING' || this.state === 'AI_PROCESSING' ? 0 : rawAvg;
        if (target > this.smoothedAmplitude) {
          this.smoothedAmplitude += (target - this.smoothedAmplitude) * 0.45;
        } else {
          this.smoothedAmplitude += (target - this.smoothedAmplitude) * 0.18;
        }

        const frequencies = Array.from(dataArray.slice(0, 16)).map((v) => v / 255);
        this.onAudioMetrics?.(this.smoothedAmplitude, frequencies);

        this.animationFrameId = requestAnimationFrame(processAudioFrame);
      };

      processAudioFrame();
    } catch (err) {
      console.warn('Audio analyzer init error:', err);
    }
  }

  /**
   * 3. Activates Clean Speech Recognition with robust fresh instance creation
   */
  private startListeningForUser() {
    if (!this.isEngineRunning || this.state === 'ENDED') return;

    // Cancel any active speech synthesis
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    this.stopSpeechRecognition();
    this.currentTranscript = '';
    this.setState('ACTIVE_LISTENING');

    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.onError?.('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      // Language selection: supports English and multilingual recognition
      const userLang = navigator.language || 'en-US';
      rec.lang = userLang.startsWith('hi') ? 'hi-IN' : 'en-US';

      rec.onstart = () => {
        this.isRecognitionStarting = false;
      };

      rec.onresult = (event: any) => {
        if (!this.isEngineRunning || this.isMuted || this.state === 'AI_SPEAKING' || this.state === 'AI_PROCESSING') {
          return;
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += piece;
          } else {
            interimTranscript += piece;
          }
        }

        const activeText = (finalTranscript || interimTranscript).trim();
        if (activeText) {
          this.currentTranscript = activeText;
          this.setState('USER_SPEAKING');
          this.onLiveTranscript?.(this.currentTranscript, Boolean(finalTranscript));

          if (finalTranscript) {
            this.resetSilenceTimer(450); // 450ms after final sentence
          } else {
            this.resetSilenceTimer(this.SILENCE_DURATION_MS);
          }
        }
      };

      rec.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech recognition warning:', event.error);
        }
      };

      rec.onend = () => {
        // When Web Speech recognition ends naturally, create a fresh instance if user turn is still active
        if (this.isEngineRunning && (this.state === 'ACTIVE_LISTENING' || this.state === 'USER_SPEAKING')) {
          setTimeout(() => {
            if (this.isEngineRunning && (this.state === 'ACTIVE_LISTENING' || this.state === 'USER_SPEAKING')) {
              this.startListeningForUser();
            }
          }, 100);
        }
      };

      this.recognition = rec;
      this.isRecognitionStarting = true;
      rec.start();
    } catch (err: any) {
      console.warn('Speech recognition start failed:', err);
      this.isRecognitionStarting = false;
    }
  }

  /**
   * Safely stops speech recognition during AI playback
   */
  private stopSpeechRecognition() {
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.onresult = null;
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
      this.isRecognitionStarting = false;
    }
  }

  /**
   * 4. Silence Timer: Submits utterance after natural pause
   */
  private resetSilenceTimer(customDelayMs?: number) {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    const delay = customDelayMs ?? this.SILENCE_DURATION_MS;

    this.silenceTimer = window.setTimeout(() => {
      if (this.currentTranscript.trim() && this.state === 'USER_SPEAKING') {
        this.submitUserUtterance(this.currentTranscript.trim());
      }
    }, delay);
  }

  /**
   * 5. Submit User Utterance to Centralized AI Backend
   */
  private async submitUserUtterance(spokenText: string) {
    if (!spokenText.trim()) return;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    const textToProcess = spokenText;
    this.currentTranscript = '';

    // Stop recognition while AI processes & speaks
    this.stopSpeechRecognition();
    this.setState('AI_PROCESSING');

    try {
      const res = await api.post('/ai/voice/chat', {
        transcript: textToProcess,
        conversation_id: this.activeConversationId || undefined,
      });

      const result: VoiceChatResult = res.data;
      this.activeConversationId = result.conversation_id;
      this.onAIResponse?.(result);

      // Speak AI Response
      this.speakAIResponse(result.speech_text || result.response);
    } catch (err) {
      console.error('Failed to process voice utterance:', err);
      this.onError?.("I'm having trouble responding right now. Please speak again.");
      this.startListeningForUser();
    }
  }

  /**
   * 6. High-Quality Natural Text-to-Speech
   */
  private speakAIResponse(text: string) {
    if (!('speechSynthesis' in window)) {
      this.startListeningForUser();
      return;
    }

    window.speechSynthesis.cancel();

    if (!text.trim()) {
      this.startListeningForUser();
      return;
    }

    const cleanText = text
      .replace(/[*#_`]/g, '')
      .replace(/⚠️/g, 'Caution: ')
      .replace(/•/g, ', ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;

    const isHindi = isHindiOrHinglish(cleanText);
    const voices = window.speechSynthesis.getVoices();

    if (isHindi) {
      utterance.lang = 'hi-IN';
      const hindiVoice = voices.find(
        (v) =>
          v.lang.startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.includes('हिन्दी') ||
          v.name.toLowerCase().includes('swara') ||
          v.name.toLowerCase().includes('madhur') ||
          v.name.toLowerCase().includes('lekha') ||
          v.name.toLowerCase().includes('kalpana') ||
          v.name.toLowerCase().includes('hemant') ||
          v.lang === 'en-IN'
      );
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
    } else {
      utterance.lang = 'en-US';
      const englishVoice = voices.find(
        (v) =>
          (v.name.toLowerCase().includes('google') ||
            v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('jenny') ||
            v.name.toLowerCase().includes('guy') ||
            v.name.toLowerCase().includes('zira')) &&
          v.lang.startsWith('en')
      );
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
    }

    utterance.onstart = () => {
      this.setState('AI_SPEAKING');
    };

    utterance.onend = () => {
      setTimeout(() => {
        if (this.isEngineRunning && this.state !== 'ENDED') {
          this.startListeningForUser();
        }
      }, 150);
    };

    utterance.onerror = (e) => {
      console.warn('TTS playback error:', e);
      if (this.isEngineRunning && this.state !== 'ENDED') {
        this.startListeningForUser();
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * 7. Explicit Barge-In / Interruption Handler
   */
  public handleBargeIn() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.startListeningForUser();
  }

  /**
   * 8. Mute Toggle
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.state === 'AI_SPEAKING') {
      window.speechSynthesis.cancel();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * 9. End Session
   */
  public endSession() {
    this.isEngineRunning = false;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.stopSpeechRecognition();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    this.currentTranscript = '';
    this.smoothedAmplitude = 0;
    this.setState('ENDED');
  }

  /**
   * 10. Fetch Conversation History from PostgreSQL
   */
  public async getVoiceHistory(): Promise<VoiceHistoryItem[]> {
    try {
      const res = await api.get('/ai/voice/history');
      return res.data || [];
    } catch (err) {
      console.warn('Voice history fetch fallback:', err);
      return [];
    }
  }

  /**
   * 11. Generate Full Doctor-Readable Report for a specific Voice Session
   */
  public async generateSessionReport(conversationId: string): Promise<any> {
    const res = await api.post(`/ai/voice/sessions/${conversationId}/generate-report`);
    return res.data;
  }

  /**
   * 12. Manual Prompt Injection
   */
  public async injectPrompt(promptText: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentTranscript = promptText;
    this.onLiveTranscript?.(promptText, true);
    await this.submitUserUtterance(promptText);
  }
}

export const voiceAssistantService = new HandsFreeVoiceEngine();
