'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ShieldCheck, Gavel, BookOpen, Copy,
  HelpCircle, Mic, Paperclip, Send, ThumbsUp, ThumbsDown, RotateCcw,
  Search, Menu
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TopSearch from '@/components/dashboard/TopSearch';
import BottomNav from '@/components/dashboard/BottomNav';
import SystemSidebar from '@/components/dashboard/SystemSidebar';
import SystemHeader from '@/components/dashboard/SystemHeader';
import PureMultimodalInput, { Attachment } from '@/components/chat/multimodal-ai-chat-input';
import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  citations?: string[];
  suggestedQueries?: string[];
}

const TypingText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, 10); // Fast but visible decryption speed
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, onComplete]);

  return <span>{displayedText}</span>;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'sys-1',
    role: 'system',
    text: 'Session encrypted with SafeVision Protocol v2.4',
    timestamp: '',
  }
];

const MOCK_RESPONSES: Record<string, Message> = {
  dui: {
    id: 'mock-dui',
    role: 'ai',
    text: 'Under current regulations, first-time offenders face imprisonment up to 6 months and/or a fine up to ₹10,000 for Drunk Driving (BAC > 30mg/100ml). Subsequent offenses within 3 years increase the penalty significantly.',
    timestamp: '',
    citations: ['MV Act §185', 'Fine: ₹10,000', 'Custody: Max 6 Mo.'],
    suggestedQueries: ['What if the breathalyzer test was faulty?', 'Bail procedure details']
  },
  default: {
    id: 'mock-default',
    role: 'ai',
    text: 'Under the Motor Vehicles Act 1988, the general penalty for traffic violations not covered under specific sections is ₹500 for the first offense and ₹1,500 for repeat violations.',
    timestamp: '',
    citations: ['MV Act §177', 'Gen. Penalty: ₹500']
  }
};

const SUGGESTED_STARTERS = [
  "🚨 Help! I've been in an accident, what do I do?",
  "🚑 Send an ambulance to my current location",
  "Explain the hit-and-run legal procedure",
  "What are my rights during a police inspection?"
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const setSystemSidebarOpen = useAppStore((state) => state.setSystemSidebarOpen);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const welcomeAdded = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-mount
    if (welcomeAdded.current) return;
    welcomeAdded.current = true;
    document.title = 'AI Assistant | SafeVisionAI';
    const welcomeMsg: Message = {
      id: 'ai-1',
      role: 'ai',
      text: 'SafeVision AI assistant online. I can answer questions about the Motor Vehicles Act, traffic penalties, your rights during a police stop, and road safety laws across India. What do you need?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, welcomeMsg]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: time,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      let aiMsg = { ...MOCK_RESPONSES.default };
      if (text.toLowerCase().includes('dui') || text.toLowerCase().includes('drunk') || text.toLowerCase().includes('influence')) {
        aiMsg = { ...MOCK_RESPONSES.dui };
      }
      aiMsg.id = (Date.now() + 1).toString();
      aiMsg.timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full relative overflow-hidden bg-slate-50/50 dark:bg-[#0B1121]">
      {/* ── Background Decorative Lines (SafeVision Pro Aesthetic) ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Ambient Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-400/5 dark:bg-blue-500/10 blur-[120px] hidden dark:block" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-400/5 dark:bg-emerald-500/10 blur-[100px] hidden dark:block" />
      </div>

      {/* ── Unified Tactical Navigation Header ── */}
      <SystemHeader title="AI Assistant HUD" showBack={false} />

      <div className="lg:hidden relative z-40">
        <TopSearch isMapPage={false} forceShow={true} showBack={false} />
      </div>

      <SystemSidebar />
      <BottomNav />

      {/* ── Chat Canvas ── */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 overflow-x-hidden pt-28 lg:pt-24 pb-48 lg:pb-36 flex flex-col max-w-4xl mx-auto w-full relative z-10 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-8 flex flex-col w-full pb-8">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              if (msg.role === 'system') {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="self-center mt-2"
                  >
                    <div className="bg-white dark:bg-white/5 px-4 py-2 rounded-full border border-slate-200 dark:border-white/5 shadow-sm backdrop-blur-md">
                      <span className="text-blue-600 dark:text-blue-400 text-[10px] uppercase tracking-[0.2em] font-black font-space">
                        {msg.text}
                      </span>
                    </div>
                  </motion.div>
                );
              }

              if (msg.role === 'user') {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    className="self-end max-w-[85%] sm:max-w-[75%]"
                  >
                    <div className="flex flex-col items-end gap-2">
                      <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-600 dark:to-indigo-600 rounded-t-2xl rounded-bl-2xl px-5 py-3.5 shadow-lg shadow-blue-600/20 border border-blue-500/50">
                        <p className="text-white text-[15px] leading-relaxed font-medium">{msg.text}</p>
                      </div>
                      <span suppressHydrationWarning className="text-[10px] text-slate-400 dark:text-slate-500 mr-2 font-medium tracking-wide shadow-sm">{msg.timestamp} • SafeVision AI</span>
                    </div>
                  </motion.div>
                );
              }

              if (msg.role === 'ai') {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    className="self-start max-w-[90%] sm:max-w-[85%]"
                  >
                    <div className="flex flex-col items-start gap-2 w-full">
                      <div className="bg-white/90 dark:bg-[#1a2133]/60 backdrop-blur-xl rounded-2xl rounded-tl-sm p-5 sm:p-6 shadow-md shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Gavel size={16} />
                          </div>
                          <span className="text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-[0.15em] font-space">Analysis Complete</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 text-[15px] leading-relaxed font-medium">
                          <TypingText text={msg.text} />
                        </p>

                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {msg.citations.map((cite, i) => (
                              <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${i === 0 ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400' : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'}`}>
                                {i === 0 && <BookOpen size={12} />}
                                <span className={`text-[11px] font-semibold tracking-wide ${!i && 'uppercase'}`}>{cite}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 ml-2 mb-1">
                        <span suppressHydrationWarning className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">{msg.timestamp} • SafeVision AI</span>
                        <div className="flex gap-1.5 ml-1">
                          <button className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Copy size={13} strokeWidth={2} />
                          </button>
                          <button className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ThumbsUp size={13} strokeWidth={2} />
                          </button>
                          <button className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ThumbsDown size={13} strokeWidth={2} />
                          </button>
                          <button className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ml-1">
                            <RotateCcw size={13} strokeWidth={2} />
                          </button>
                        </div>
                      </div>

                      {msg.suggestedQueries && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 w-full">
                          {msg.suggestedQueries.map((q, i) => (
                            <button
                              key={i}
                              onClick={() => handleSend(q)}
                              className="group bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md transition-all duration-200 p-4 rounded-xl flex items-start gap-3 text-left border border-slate-200/60 dark:border-white/5 hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-sm"
                            >
                              <div className="mt-0.5 p-1 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <HelpCircle size={14} />
                              </div>
                              <span className="text-slate-700 dark:text-slate-300 text-[13px] font-medium leading-snug">{q}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              }
            })}

            {messages.length <= 2 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="self-start w-full mt-2"
              >
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 font-semibold px-2 uppercase tracking-widest">Suggested Inquiries</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_STARTERS.map((text, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(text)}
                      className="group bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md transition-all duration-200 px-4 py-3 rounded-xl text-left border border-slate-200/60 dark:border-white/5 hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-sm flex items-start gap-3"
                    >
                      <div className="mt-0.5 p-1 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0">
                        <HelpCircle size={14} />
                      </div>
                      <span className="text-[13px] text-slate-700 dark:text-slate-300 font-medium leading-snug">{text}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Skeleton Loading State */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="self-start max-w-[90%] sm:max-w-[85%]"
              >
                <div className="bg-white/80 dark:bg-[#1a2133]/60 backdrop-blur-xl rounded-2xl rounded-tl-sm px-6 py-5 shadow-sm border border-slate-200/60 dark:border-white/5 flex gap-1.5 items-center w-fit">
                  <span className="w-2.5 h-2.5 bg-blue-500/70 dark:bg-blue-400/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2.5 h-2.5 bg-blue-500/70 dark:bg-blue-400/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2.5 h-2.5 bg-blue-500/70 dark:bg-blue-400/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* ── Bottom Input Shell ── */}
      <div className="absolute bottom-0 w-full z-50 flex justify-between items-end bg-gradient-to-t from-slate-50 dark:from-[#0B1121] via-slate-50/90 dark:via-[#0B1121]/90 to-transparent pt-16 pb-24 lg:pb-6 px-4 sm:px-6 pointer-events-none">
        <div className="max-w-4xl mx-auto w-full flex flex-col relative items-end pointer-events-none">
          <div className="w-full flex items-end gap-2 sm:gap-3 pointer-events-auto">
            <PureMultimodalInput
              value={input}
              onChange={setInput}
              onSendMessage={({ input }) => handleSend(input)}
              isGenerating={loading}
              canSend={!loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
