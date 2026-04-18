'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { generateSosWhatsAppLink, generateSosSmsLink } from '@/lib/sos-share';

/**
 * SOSButton — Pulsative Tactical Emergency Trigger
 * Features: Double-tap verification, pulse animation, WhatsApp + SMS share.
 */
export function SOSButton() {
  const { userProfile, gpsLocation } = useAppStore();
  const [isExpanding, setIsExpanding] = useState(false);

  const triggerWhatsApp = async () => {
    const link = await generateSosWhatsAppLink(userProfile, gpsLocation);
    window.open(link, '_blank');
    setIsExpanding(false);
  };

  const triggerSms = async () => {
    const link = await generateSosSmsLink(userProfile, gpsLocation);
    window.location.href = link;
    setIsExpanding(false);
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <AnimatePresence>
        {isExpanding && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: -100 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 backdrop-blur-3xl rounded-[2.5rem] p-6 pointer-events-auto"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--bg-primary) 95%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-red) 40%, transparent)',
              boxShadow: '0 0 80px color-mix(in srgb, var(--accent-red) 30%, transparent)',
            }}
          >
            <div className="text-center mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em]"
                style={{ color: 'var(--accent-red-deep)' }}>
                Confirm SOS Trigger
              </h4>
              <p className="text-[11px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                {gpsLocation
                  ? `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lon.toFixed(4)}`
                  : 'Acquiring GPS...'}
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={triggerWhatsApp}
                className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
                style={{
                  backgroundColor: 'var(--accent-red)',
                  color: 'white',
                  boxShadow: 'var(--glow-red)',
                }}
              >
                📲 Send WhatsApp SOS
              </button>
              <button
                onClick={triggerSms}
                className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid color-mix(in srgb, var(--accent-red) 20%, transparent)',
                  color: 'var(--accent-red-deep)',
                }}
              >
                📡 Standard SMS Alert
              </button>
              <button
                onClick={() => setIsExpanding(false)}
                className="w-full py-2 text-[9px] font-bold uppercase tracking-widest transition-all"
                style={{ color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsExpanding(!isExpanding)}
        className="relative group pointer-events-auto active:scale-90 transition-all"
        aria-label="Emergency SOS"
      >
        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-full animate-ping"
          style={{ backgroundColor: 'color-mix(in srgb, var(--accent-red) 20%, transparent)' }} />
        <span className="absolute inset-0 rounded-full animate-pulse"
          style={{ backgroundColor: 'color-mix(in srgb, var(--accent-red) 10%, transparent)' }} />

        <div
          className="relative w-20 h-20 rounded-full flex items-center justify-center border-4 group-hover:scale-110 transition-all"
          style={{
            backgroundColor: 'var(--accent-red)',
            borderColor: 'color-mix(in srgb, white 10%, transparent)',
            boxShadow: '0 0 40px color-mix(in srgb, var(--accent-red) 50%, transparent)',
            color: 'white',
          }}
        >
          <AlertCircle size={36} strokeWidth={2.5} />
          <div
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black border-2"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--accent-red)',
              color: 'var(--accent-red)',
            }}
          >
            SOS
          </div>
        </div>
      </button>
    </div>
  );
}
