'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';

export function GlobalSOS() {
  const pathname = usePathname();
  
  // Don't show on pages that already have their own SOS mechanism
  const hiddenOnRoutes = ['/sos', '/', '/emergency', '/first-aid', '/report', '/challan', '/profile', '/settings'];
  if (hiddenOnRoutes.includes(pathname)) return null;

  return (
    <>
      {/* Mobile SOS — positioned above BottomNav */}
      <div className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] right-5 z-50 lg:hidden pointer-events-auto">
        <Link href="/sos">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Emergency SOS"
            className="w-14 h-14 bg-gradient-to-br from-[#ff5545] to-[#c0000a] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,85,69,0.4)] text-white font-black text-sm tracking-widest relative overflow-hidden group"
          >
            <motion.div
              animate={{ scale: [1, 2], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 rounded-full border-2 border-white/30"
            />
            <span className="relative z-10">SOS</span>
          </motion.button>
        </Link>
      </div>

      {/* Desktop SOS */}
      <div className="fixed bottom-10 right-10 z-[60] hidden lg:block pointer-events-auto">
        <Link href="/sos">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 2 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Emergency SOS"
            className="w-20 h-20 bg-gradient-to-br from-[#ff5545] to-[#c0000a] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,85,69,0.4)] text-white font-black tracking-tighter relative overflow-hidden group"
          >
            <motion.div
              animate={{ scale: [1, 2, 2.5], opacity: [0.5, 0.2, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full border-4 border-white/20"
            />
            <span className="text-xl relative z-10 leading-none mb-0.5">SOS</span>
          </motion.button>
        </Link>
      </div>
    </>
  );
}
