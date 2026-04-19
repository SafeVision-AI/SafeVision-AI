'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  User, Shield, CheckCircle, Activity, 
  Droplet, Car, Globe, Bell, 
  CloudOff, Zap, ShieldAlert, Award,
  ArrowRight, Heart, Star, Edit3, Save, X
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import BottomNav from '@/components/dashboard/BottomNav';
import TopSearch from '@/components/dashboard/TopSearch';
import SystemHeader from '@/components/dashboard/SystemHeader';
import SystemSidebar from '@/components/dashboard/SystemSidebar';

export default function ProfilePage() {
  const { 
    crashDetectionEnabled, 
    setCrashDetectionEnabled,
    userProfile,
    setUserProfile,
  } = useAppStore();

  const [offlineMode, setOfflineMode] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({ ...userProfile });
  const [saveFlash, setSaveFlash] = useState(false);

  useEffect(() => { document.title = 'Profile | SafeVisionAI'; }, []);

  // Sync draft when not editing (e.g. external store update)
  useEffect(() => {
    if (!isEditing) setEditDraft({ ...userProfile });
  }, [isEditing, userProfile]);

  const handleEdit = () => {
    setEditDraft({ ...userProfile });
    setIsEditing(true);
  };

  const handleSave = () => {
    setUserProfile(editDraft);
    setIsEditing(false);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  };

  const handleCancel = () => {
    setEditDraft({ ...userProfile });
    setIsEditing(false);
  };

  const handlePurge = () => {
    if (!showPurgeConfirm) {
      setShowPurgeConfirm(true);
      setTimeout(() => setShowPurgeConfirm(false), 3000);
    } else {
      // Intended purge logic here
      alert('Local session data purged.');
      setShowPurgeConfirm(false);
    }
  };

  // Derive a display ID from the user name (or placeholder)
  const displayId = userProfile.name
    ? `SVA-${userProfile.name.slice(0, 4).toUpperCase().replace(/\s/g, '')}-X`
    : 'NOT SET';

  return (
    <div className="relative w-full min-h-[100dvh] bg-[#f8fafc] dark:bg-[#071325] text-slate-800 dark:text-[#d7e3fc] overflow-x-hidden flex flex-col transition-colors duration-500 font-inter">
      
      {/* ── Unified Tactical Navigation Header ── */}
      <SystemHeader title="Operator Identity Matrix" showBack={false} />
      
      <div className="lg:hidden relative z-[100]">
        <TopSearch isMapPage={false} forceShow={true} showBack={false} />
      </div>

      <SystemSidebar />

      <main className="flex-1 w-full max-w-2xl mx-auto pt-28 lg:pt-24 pb-44 px-6 space-y-12 relative z-10">
        
        {/* ── Save Flash Banner ── */}
        <AnimatePresence>
          {saveFlash && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-xl text-sm font-black uppercase tracking-widest"
            >
              <CheckCircle size={16} />
              Profile Saved
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Section 1: Hero Identity Matrix ── */}
        <section className="flex flex-col gap-8 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] font-space leading-none">Profile Matrix Sync</span>
            </div>

            {/* Edit / Save / Cancel controls */}
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 transition-all"
              >
                <Edit3 size={12} />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-3 py-2 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-all"
                >
                  <X size={12} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-4 py-2 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg"
                >
                  <Save size={12} />
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white dark:border-white/10 ring-8 ring-emerald-500/5 overflow-hidden relative shadow-2xl transition-transform duration-500 group-hover:scale-105 bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                {userProfile.name ? (
                  <span className="text-4xl font-black text-slate-400 dark:text-white/40 uppercase">
                    {userProfile.name.charAt(0)}
                  </span>
                ) : (
                  <User size={40} className="text-slate-300 dark:text-white/20" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-10 h-10 rounded-2xl flex items-center justify-center border-4 border-white dark:border-[#071325] shadow-lg">
                <CheckCircle size={20} className="text-white" />
              </div>
            </div>
            
            <div className="text-center sm:text-left flex flex-col gap-2">
              {isEditing ? (
                <input
                  type="text"
                  value={editDraft.name}
                  onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                  placeholder="Your Full Name"
                  className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-space leading-none bg-transparent border-b-2 border-emerald-500 outline-none placeholder:text-slate-300 dark:placeholder:text-white/20 w-full"
                />
              ) : (
                <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-space leading-none">
                  {userProfile.name || <span className="text-slate-300 dark:text-white/20">Set Your Name</span>}
                </h2>
              )}
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <div className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                   <span className="text-[9px] font-black text-slate-500 dark:text-emerald-500 uppercase tracking-widest leading-none">ID: {displayId}</span>
                </div>
                <div className="px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-center gap-1">
                   <Award size={10} className="text-amber-600 dark:text-amber-400" />
                   <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none">SafeVision AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vitals HUD Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 shadow-sm flex flex-col gap-4">
               <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Vessel</p>
                  <Car size={16} className="text-emerald-500" />
               </div>
               <div className="flex flex-col">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editDraft.vehicleNumber}
                      onChange={e => setEditDraft(d => ({ ...d, vehicleNumber: e.target.value }))}
                      placeholder="MH 01 AB 1234"
                      className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter bg-transparent border-b-2 border-emerald-500/60 outline-none placeholder:text-slate-300 dark:placeholder:text-white/20"
                    />
                  ) : (
                    <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                      {userProfile.vehicleNumber || <span className="text-slate-300 dark:text-white/20">Not Set</span>}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">VEHICLE_REGISTRATION</span>
               </div>
            </div>
            
            <div className="p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 shadow-sm flex flex-col gap-4">
               <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bio Signature</p>
                  <Heart size={16} className="text-red-500" />
               </div>
               <div className="flex flex-col">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editDraft.bloodGroup}
                      onChange={e => setEditDraft(d => ({ ...d, bloodGroup: e.target.value }))}
                      placeholder="O+, A-, B+..."
                      className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter bg-transparent border-b-2 border-red-500/60 outline-none placeholder:text-slate-300 dark:placeholder:text-white/20"
                    />
                  ) : (
                    <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                      {userProfile.bloodGroup || <span className="text-slate-300 dark:text-white/20">Not Set</span>}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">EMERGENCY_BROADCAST_ON</span>
               </div>
            </div>

            {/* Emergency Contact — full width */}
            <div className="sm:col-span-2 p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 shadow-sm flex flex-col gap-4">
               <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency Contact</p>
                  <Shield size={16} className="text-blue-500" />
               </div>
               <div className="flex flex-col">
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editDraft.emergencyContact}
                      onChange={e => setEditDraft(d => ({ ...d, emergencyContact: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="text-xl font-black text-slate-900 dark:text-white tracking-tighter bg-transparent border-b-2 border-blue-500/60 outline-none placeholder:text-slate-300 dark:placeholder:text-white/20"
                    />
                  ) : (
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {userProfile.emergencyContact || <span className="text-slate-300 dark:text-white/20 font-normal text-base">Add emergency contact</span>}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">SOS_DISPATCH_CONTACT</span>
               </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Operational Protocols ── */}
        <section className="flex flex-col gap-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-space px-2">Mission Protocol</h3>
          <div className="flex flex-col gap-3">
             {[
               { id: 'offline', icon: <CloudOff size={18} />, label: 'V8 Offline Mode', sub: 'Process locally, no network leakage', state: offlineMode, toggle: setOfflineMode },
               { id: 'crash', icon: <ShieldAlert size={18} />, label: 'Crash Detection', sub: 'Instant satellite SOS engagement', state: crashDetectionEnabled, toggle: setCrashDetectionEnabled },
               { id: 'notify', icon: <Bell size={18} />, label: 'Push Hub', sub: 'Critical hazard & P0 alerts', state: pushNotifs, toggle: setPushNotifs },
             ].map(item => (
               <label key={item.id} className="group flex items-center justify-between p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-300 dark:border-white/5 shadow-sm hover:border-emerald-500/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${item.state ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-50 dark:bg-white/10 text-slate-400'}`}>
                        {item.icon}
                     </div>
                     <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.label}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.sub}</span>
                     </div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={item.state} onChange={e => item.toggle(e.target.checked)} aria-label={`Toggle ${item.label}`} />
                    <div className="w-12 h-6 bg-slate-200 dark:bg-white/10 rounded-full peer peer-focus:ring-2 peer-focus:ring-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </div>
               </label>
             ))}
          </div>
        </section>

        {/* ── Section 3: Achievements & Legacy ── */}
        <section className="flex flex-col gap-6">
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-space px-2">Tactical Awards</h3>
           <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {[
                { title: 'Road Safety', score: 'Active User', bgColor: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
                { title: 'First Responder', score: 'Trained', bgColor: 'bg-amber-500/10', iconColor: 'text-amber-500' },
                { title: 'AI Master', score: 'SafeVision AI', bgColor: 'bg-indigo-500/10', iconColor: 'text-indigo-500' },
              ].map(badge => (
                <div key={badge.title} className="flex-shrink-0 w-40 p-6 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col items-center gap-3">
                   <div className={`p-4 rounded-3xl ${badge.bgColor}`}>
                      <Star size={24} className={badge.iconColor} />
                   </div>
                   <div className="text-center">
                     <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{badge.title}</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{badge.score}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Action Panel */}
        <section className="flex flex-col items-center gap-6 pt-10">
           <button 
             onClick={handlePurge}
             className={`h-14 px-10 rounded-full border-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${
               showPurgeConfirm
                 ? 'border-red-500 bg-red-500/10 text-red-500'
                 : 'border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-500 hover:border-red-500/20'
             }`}
           >
             {showPurgeConfirm ? 'CONFIRM PURGE?' : 'PURGE LOCAL SESSION'}
           </button>
           <p className="text-[9px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-[0.3em]">Sentinel V4.2 Real-time Security Layer</p>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
