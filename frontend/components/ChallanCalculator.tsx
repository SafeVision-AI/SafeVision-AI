'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { calculateChallan } from '@/lib/api';

/**
 * ChallanCalculator — High-Fidelity Fine Specialist
 * Implements Stitch Design: `6304aa246be8445781a95e263d919f85`
 * Features: Visual violation selector, state-specific fine lookup, and premium result cards.
 */
const ChallanCalculator: React.FC = () => {
  const [violationCode, setViolationCode] = useState('194D');
  const [vehicleClass, setVehicleClass] = useState('2W');
  const [stateCode, setStateCode] = useState('TN');
  const [isRepeat, setIsRepeat] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { connectivity } = useAppStore();

  const VIOLATIONS = [
    { code: '194D', label: 'Helmet', icon: '🪖' },
    { code: '194B', label: 'Seatbelt', icon: '💺' },
    { code: '183', label: 'Speeding', icon: '⚡' },
    { code: '185', label: 'Drunk Driving', icon: '🍺' },
    { code: '181', label: 'License', icon: '📋' },
    { code: '179', label: 'Disobedience', icon: '🛑' },
  ];

  const handleCalculate = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Functional calculation logic preserved
      if (connectivity === 'online') {
        const data = await calculateChallan({
          violation_code: violationCode,
          vehicle_class: vehicleClass,
          state_code: stateCode,
          is_repeat: isRepeat
        });
        setResult({ ...data, source: 'online' });
      } else {
        // Mock offline fallback (duckdb logic would go here)
        await new Promise(r => setTimeout(r, 800));
        setResult({
          section: violationCode,
          description: `Fine for ${violationCode} violation in ${stateCode}`,
          base_fine: 1000,
          repeat_fine: 3000,
          source: 'offline_engine'
        });
      }
    } catch (err) {
      console.error('Calculation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Violation Selection Grid */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-[#b0c6ff]/40 px-2">Select Violation Type</label>
        <div className="grid grid-cols-3 gap-3">
          {VIOLATIONS.map((v) => (
            <button
              key={v.code}
              onClick={() => setViolationCode(v.code)}
              className={`flex flex-col items-center justify-center p-4 rounded-[1.5rem] border transition-all gap-2 ${
                violationCode === v.code 
                  ? 'bg-[#b0c6ff] text-[#071325] border-transparent shadow-[0_4px_20px_rgba(176,198,255,0.4)]' 
                  : 'bg-[#142032]/40 text-[#b0c6ff] border-[#b0c6ff]/10 hover:bg-[#b0c6ff]/5'
              }`}
            >
              <div className="text-xl">{v.icon}</div>
              <div className="text-[9px] font-black uppercase tracking-widest text-center">{v.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Config Panel */}
      <div className="bg-[#142032]/60 backdrop-blur-3xl p-6 rounded-[2rem] border border-[#b0c6ff]/5 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-[#b0c6ff]/40">Vehicle Class</label>
            <select 
              value={vehicleClass} 
              onChange={(e) => setVehicleClass(e.target.value)}
              className="w-full bg-[#071325]/40 border border-[#b0c6ff]/10 rounded-xl p-3 text-xs text-[#d7e3fc] outline-none"
            >
              <option value="2W">2-Wheeler</option>
              <option value="LMV">Car / SUV</option>
              <option value="HMV">Truck / HMV</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-[#b0c6ff]/40">State/UT</label>
            <select 
              value={stateCode} 
              onChange={(e) => setStateCode(e.target.value)}
              className="w-full bg-[#071325]/40 border border-[#b0c6ff]/10 rounded-xl p-3 text-xs text-[#d7e3fc] outline-none"
            >
              <option value="TN">Tamil Nadu</option>
              <option value="KA">Karnataka</option>
              <option value="MH">Maharashtra</option>
              <option value="DL">Delhi</option>
            </select>
          </div>
        </div>

        <button 
          onClick={() => setIsRepeat(!isRepeat)}
          className={`w-full py-3 rounded-xl border transition-all flex items-center justify-center gap-3 ${
            isRepeat 
              ? 'bg-[#ff5545]/10 border-[#ff5545]/40 text-[#ff5545]' 
              : 'bg-white/5 border-white/10 text-[#b0c6ff]/40'
          }`}
        >
          <div className={`w-3 h-3 rounded-full ${isRepeat ? 'bg-[#ff5545] animate-pulse' : 'bg-white/10'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">Repeat Offender Status</span>
        </button>

        <button 
          onClick={handleCalculate}
          disabled={loading}
          className="w-full py-5 bg-[#b0c6ff] text-[#071325] rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          {loading ? 'Processing Penalty Grid...' : 'Calculate Penalty'}
        </button>
      </div>

      {/* Result Display */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#142032] border-2 border-[#b0c6ff]/20 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff5545]/5 blur-[60px] rounded-full" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff5545] mb-1">Section {result.section} CMV Act</h4>
                  <p className="text-sm font-bold text-[#d7e3fc] leading-tight">{result.description}</p>
                </div>
                <div className="bg-[#b0c6ff]/10 px-3 py-1 rounded-full border border-[#b0c6ff]/20 text-[9px] font-black text-[#b0c6ff]">
                  {result.source.toUpperCase()}
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-[#d7e3fc] tracking-tighter">
                  ₹{isRepeat ? (result.repeat_fine || result.base_fine * 3) : result.base_fine}
                </span>
                {isRepeat && (
                  <span className="text-[10px] font-black text-[#ff5545] uppercase tracking-widest">Multiplied Penalty</span>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
                <button className="flex-1 py-3 bg-[#b0c6ff]/10 hover:bg-[#b0c6ff]/20 rounded-xl text-[#b0c6ff] text-[9px] font-black uppercase tracking-widest border border-[#b0c6ff]/20">
                  Legal Advice
                </button>
                <button className="flex-1 py-3 bg-[#b0c6ff] text-[#071325] rounded-xl text-[9px] font-black uppercase tracking-widest">
                  Pay Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChallanCalculator;
