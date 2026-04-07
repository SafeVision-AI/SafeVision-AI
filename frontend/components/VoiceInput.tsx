'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onResult: (text: string) => void;
  className?: string;
}

// Web Speech API types (not in default TS lib)
interface IWindow extends Window {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: Event) => void) | null;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
}

interface ISpeechRecognitionEvent extends Event {
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export function VoiceInput({ onResult, className = '' }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const handleResult = useCallback((text: string) => {
    onResult(text);
  }, [onResult]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window as IWindow;
    const SpeechAPI = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SpeechAPI) return;

    const recognition = new SpeechAPI();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsLoading(false);
      setIsRecording(true);
    };

    recognition.onresult = (e: ISpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      handleResult(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setIsLoading(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsLoading(false);
    };

    recognitionRef.current = recognition;
    return () => { recognition.abort(); };
  }, [handleResult]);

  const toggle = () => {
    if (!recognitionRef.current) {
      // Graceful fallback for browsers without Speech API
      handleResult('Is it safe to move an accident victim?');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsLoading(true);
      recognitionRef.current.start();
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
      className={`relative flex items-center justify-center rounded-full transition-all active:scale-90 ${className}`}
      style={{
        width: '44px',
        height: '44px',
        border: isRecording
          ? '2px solid var(--accent-red)'
          : '2px solid var(--outline-variant)',
        backgroundColor: isRecording
          ? 'color-mix(in srgb, var(--accent-red) 15%, transparent)'
          : 'var(--bg-card)',
        color: isRecording ? 'var(--accent-red)' : 'var(--text-secondary)',
        boxShadow: isRecording ? 'var(--glow-red)' : 'none',
        flexShrink: 0,
      }}
    >
      {isLoading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isRecording ? (
        <MicOff size={18} className="animate-pulse" />
      ) : (
        <Mic size={18} />
      )}
      {isRecording && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ backgroundColor: 'color-mix(in srgb, var(--accent-red) 20%, transparent)' }}
        />
      )}
    </button>
  );
}
