'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PotholeDetector — High-Fidelity Tactical HUD Camera
 * Implements Stitch Design: `0099684f88464a39b36d0193b2a24c28`
 * Features: Glossy notches, pulse scanning, confidence scores.
 */
const PotholeDetector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [detected, setDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    const videoEl = videoRef.current;
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoEl) {
          videoEl.srcObject = stream;
          setHasCamera(true);
        }
      } catch (err) {
        console.error('Camera access denied or unavailable', err);
      }
    }
    setupCamera();

    return () => {
      if (videoEl?.srcObject) {
        const tracks = (videoEl.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, []);

  const handleScan = () => {
    setIsScanning(true);
    setDetected(false);
    setConfidence(0);
    
    // Simulate AI model inference sequence
    setTimeout(() => {
      setIsScanning(false);
      setDetected(true);
      setConfidence(94);
    }, 2800);
  };

  return (
    <div className="relative w-full aspect-video bg-[#071325] rounded-[2rem] overflow-hidden shadow-2xl border border-[#b0c6ff]/10 group">
      {hasCamera ? (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover opacity-80"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-[#b0c6ff]/40 p-12 text-center">
          <div className="w-12 h-12 mb-4 border-2 border-dashed border-[#b0c6ff]/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">Active Sensor Required</span>
        </div>
      )}

      {/* HUD Notches (The Vigilant Ghost Style) */}
      <div className="absolute inset-4 pointer-events-none border border-[#b0c6ff]/5 rounded-[1.5rem]">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#b0c6ff]/40 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#b0c6ff]/40 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#b0c6ff]/40 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#b0c6ff]/40 rounded-br-xl" />
      </div>

      {/* Target Reticle */}
      <AnimatePresence>
        {(isScanning || detected) && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-dashed ${
              detected ? 'border-[#ff5545] shadow-[0_0_30px_rgba(255,85,69,0.3)]' : 'border-[#b0c6ff]/40'
            } rounded-full flex items-center justify-center`}
          >
            {isScanning && (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border-t-2 border-[#b0c6ff] rounded-full"
              />
            )}
            <div className="text-[10px] uppercase font-black tracking-tighter text-[#b0c6ff]/60">
              {isScanning ? 'Analyzing...' : 'Locked'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result HUD Overlay */}
      <AnimatePresence>
        {detected && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#ff5545] text-[#071325] px-6 py-2 rounded-full shadow-2xl flex items-center gap-3"
          >
            <span className="w-2 h-2 bg-[#071325] rounded-full animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
              PH-CRATER DETECTED ({confidence}%)
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tactical Controller Plate */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
        <button 
          onClick={handleScan}
          disabled={isScanning || !hasCamera}
          className={`h-12 px-8 rounded-full font-black uppercase tracking-widest transition-all ${
            isScanning 
              ? 'bg-[#142032] text-[#b0c6ff]/40 cursor-not-allowed border border-[#b0c6ff]/10' 
              : 'bg-[#b0c6ff] text-[#071325] shadow-[0_8px_30px_rgba(176,198,255,0.4)] active:scale-95'
          } text-[10px]`}
        >
          {isScanning ? 'Processing Sensor Grid' : 'Initiate AI Scan'}
        </button>
      </div>
    </div>
  );
};

export default PotholeDetector;
