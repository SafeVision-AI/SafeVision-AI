'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;
  const colors = {
    success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    error: 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20 text-red-600 dark:text-red-400',
    info: 'bg-[#1A5C38]/8 border-blue-200 dark:bg-[#1A5C38]/10 dark:border-[#1A5C38]/20 text-[#1A5C38] dark:text-[#00C896]',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[200]"
        >
          <div className={`flex items-center gap-3 px-5 py-3 rounded-lg border shadow-lg backdrop-blur-md ${colors[type]}`}>
            <Icon size={18} />
            <span className="text-[11px] font-semibold uppercase tracking-widest leading-none mt-0.5">{message}</span>
            <button onClick={onClose} className="ml-2 hover:bg-black/5 dark:hover:bg-white/10 p-1 rounded-full transition-colors">
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
