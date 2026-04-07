'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { sendChatMessage, ChatMessage as ApiChatMessage } from '@/lib/api';
import { useGeolocation } from '@/lib/geolocation';
import { ConnectivityBadge } from './ConnectivityBadge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

export function ChatInterface() {
  const {
    aiMode,
    connectivity,
    setAiMode
  } = useAppStore();
  const { location } = useGeolocation();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      role: 'assistant',
      content: 'Hello! I am your SafeVisionAI assistant. How can I help you today? You can ask me about traffic rules, emergency procedures, or first-aid instructions.',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (aiMode === 'online') {
        const response = await sendChatMessage({
          message: userMsg.content,
          session_id: 'default-session', // hardcoded for demo
          lat: location?.lat,
          lon: location?.lon,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: response.response,
            sources: response.sources,
          },
        ]);
      } else {
        // Offline mode simulation - wait for ModelLoader and actual WebLLM
        // If WebLLM isn't hooked up yet, just reply with a placeholder
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: '[OFFLINE] First aid for burns: 1. Cool the burn under running water for 20 minutes. 2. Remove clothing/jewelry near the burn. 3. Cover with a sterile dressing. Do NOT apply ice or ointments.',
            },
          ]);
          setIsLoading(false);
        }, 1000);
        return; // handle offline state inside the timeout for now
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered a communication error. Please check your connection or switch to Offline Mode.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* HEADER / MODE TOGGLE */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem',
        borderBottom: '1px solid var(--outline-variant)',
        background: 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>🧠</span>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>SafeVisionAI Chat</div>
        </div>

        {/* Toggle between Online and Offline Mode */}
        <div style={{ display: 'flex', background: 'var(--bg-card-high)', borderRadius: '99px', padding: '4px' }}>
          <button
            onClick={() => setAiMode('online')}
            style={{
              padding: '4px 12px',
              borderRadius: '99px',
              border: 'none',
              background: aiMode === 'online' ? 'var(--brand-primary)' : 'transparent',
              color: aiMode === 'online' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Online (Fast)
          </button>
          <button
            onClick={() => setAiMode('offline')}
            style={{
              padding: '4px 12px',
              borderRadius: '99px',
              border: 'none',
              background: aiMode === 'offline' ? 'var(--accent-purple)' : 'transparent',
              color: aiMode === 'offline' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            disabled={connectivity === 'offline'} // Or allow them to force it
          >
            Offline LLM
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES AREA */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: 'var(--bg-main)'
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className="animate-fade-in-up"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '100%',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                flexDirection: isUser ? 'row-reverse' : 'row',
                maxWidth: '85%',
              }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: isUser ? 'var(--brand-primary)' : 'var(--accent-green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', flexShrink: 0, marginTop: '4px'
                }}>
                  {isUser ? '👤' : '🤖'}
                </div>

                <div style={{
                  padding: '10px 14px',
                  borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
                  background: isUser ? 'var(--brand-primary)' : 'var(--bg-card-high)',
                  color: isUser ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  border: isUser ? 'none' : '1px solid var(--outline-variant)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', alignSelf: 'flex-start' }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px',
            }}>🤖</div>
            <div style={{
              padding: '10px 14px', background: 'var(--bg-card-high)', borderRadius: '16px 16px 16px 0',
              display: 'flex', gap: '4px'
            }}>
              <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' }} />
              <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animationDelay: '0.2s' }} />
              <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div style={{
        padding: '0.75rem',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--outline-variant)'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about traffic rules or first aid..."
            disabled={isLoading || aiMode === 'loading'}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '99px',
              border: '1px solid var(--outline)',
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border var(--transition-fast)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--outline)'}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || aiMode === 'loading'}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              background: !input.trim() || isLoading ? 'var(--bg-card-highest)' : 'var(--brand-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            {aiMode === 'loading' ? '⌛' : '↑'}
          </button>
        </form>
      </div>
    </div>
  );
}
