'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { useAppStore } from '@/lib/store';
import { submitReport } from '@/lib/api';
import { enqueueRoadReport } from '@/lib/offline-sos-queue';

const MAX_UPLOAD_BYTES = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES || 5242880);
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * ReportForm — High-Fidelity Road Reporter HUD
 * Implements Stitch Design: `0099684f88464a39b36d0193b2a24c28`
 * Features: Multi-step layout, glassmorphism cards, and functional offline sync.
 */
const ReportForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [issue, setIssue] = useState('pothole');
  const [severity, setSeverity] = useState(3);
  const [desc, setDesc] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { gpsLocation, connectivity } = useAppStore();

  const handleSubmit = async () => {
    if (!gpsLocation) {
      toast.error('Location is required before broadcasting a road report.');
      return;
    }

    if (photo) {
      if (photo.size > MAX_UPLOAD_BYTES) {
        toast.error('Photo must be less than 5MB');
        return;
      }
      if (!ALLOWED_TYPES.includes(photo.type)) {
        toast.error('Only JPEG, PNG or WebP allowed');
        return;
      }
    }

    setLoading(true);
    const payload = {
      issue_type: issue,
      severity,
      description: desc,
      lat: gpsLocation.lat,
      lon: gpsLocation.lon,
      photo: photo ?? undefined
    };

    const enqueue = () => enqueueRoadReport({
      issue_type: payload.issue_type,
      severity: payload.severity,
      description: payload.description,
      lat: payload.lat,
      lon: payload.lon,
      photo: photo ?? undefined,
      photoName: photo?.name,
    });

    try {
      if (connectivity === 'online') {
        await submitReport(payload);
      } else {
        // Save to offline queue in localStorage — synced when connectivity returns
        await enqueue();
        toast.success('Report saved offline and will sync automatically.');
      }
      setSubmitted(true);
    } catch {
      await enqueue();
      toast.success('Network failed. Report saved offline and will retry.');
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0D1117]/60 backdrop-blur-3xl border border-[#40e56c]/20 p-8 rounded-[2rem] text-center"
      >
        <div className="w-16 h-16 bg-[#40e56c]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#40e56c]/30">
          <svg className="w-8 h-8 text-[#40e56c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-black uppercase tracking-tighter text-[#40e56c]">Report Uplinked</h3>
        <p className="text-sm text-[#00C896]/60 mt-2 leading-relaxed">
          The hazard has been localized and broadcasted to regional enforcement units.
        </p>
        <button 
          onClick={() => { setSubmitted(false); setStep(1); setDesc(''); setPhoto(null); }}
          className="mt-6 w-full py-4 bg-[#00C896]/10 hover:bg-[#00C896]/20 text-[#00C896] rounded-xl text-[10px] font-semibold uppercase tracking-widest border border-[#00C896]/20 transition-all"
        >
          Begin New Recon
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HUD Navigation / Steps */}
      <div className="flex justify-between items-center px-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#00C896]/40">Form Protocol 01-{step.toString().padStart(2, '0')}</span>
        <div className="flex gap-1">
          {[1, 2].map((s) => (
            <div key={s} className={`w-6 h-1 rounded-full ${s === step ? 'bg-[#00C896]' : 'bg-[#00C896]/10'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {['pothole', 'accident', 'debris', 'signage'].map((type) => (
                <button
                  key={type}
                  onClick={() => setIssue(type)}
                  className={`p-4 rounded-lg text-left border transition-all ${
                    issue === type 
                      ? 'bg-[#00C896] text-[#0A0E14] border-transparent shadow-[0_4px_20px_rgba(176,198,255,0.4)]' 
                      : 'bg-[#0D1117]/40 text-[#00C896] border-[#00C896]/10 hover:bg-[#00C896]/5'
                  }`}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-widest">{type}</div>
                </button>
              ))}
            </div>

            <div className="p-4 bg-[#0D1117]/40 rounded-lg border border-[#00C896]/10">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#00C896]/40 mb-3 block">Danger Index (Severity)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSeverity(lvl)}
                    className={`flex-1 h-10 rounded-lg transition-all ${
                      severity >= lvl 
                        ? (severity >= 4 ? 'bg-[#ff5545]' : 'bg-[#00C896]') 
                        : 'bg-[#00C896]/5 border border-[#00C896]/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button 
              onClick={() => setStep(2)}
              className="w-full py-5 bg-[#00C896] text-[#0A0E14] rounded-[1.5rem] text-[11px] font-semibold uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Configure Details
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="step2"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="space-y-4"
          >
            <textarea 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Operational details (e.g. Left lane impassable)..."
              className="w-full bg-[#0D1117]/40 border border-[#00C896]/10 rounded-lg p-4 text-sm text-[#d7e3fc] placeholder-[#00C896]/20 min-h-[120px] focus:outline-none focus:border-[#00C896]/40"
            />

            <div className="bg-[#0D1117]/40 rounded-lg border border-[#00C896]/10 p-4">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#00C896]/40 mb-3 block">Attach Evidence (Photo)</label>
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="text-xs text-[#00C896] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#00C896]/10 file:text-[#00C896] hover:file:bg-[#00C896]/20"
              />
              {photo && <p className="text-[10px] text-[#40e56c] mt-2">Attached: {photo.name}</p>}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(1)}
                className="w-20 h-14 border border-[#00C896]/10 rounded-lg flex items-center justify-center text-[#00C896] hover:bg-[#00C896]/5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-5 bg-[#0D1117] text-[#00C896] border border-[#00C896]/40 rounded-[1.5rem] text-[11px] font-semibold uppercase tracking-widest shadow-2xl hover:bg-[#00C896] hover:text-[#0A0E14] transition-all"
              >
                {loading ? 'Transmitting Data...' : 'Broadcast Report'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportForm;
