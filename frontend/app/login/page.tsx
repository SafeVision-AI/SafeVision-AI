'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Eye, EyeOff, LogIn, AlertTriangle,
  CheckCircle2, Zap, Lock, Mail, ChevronRight,
  Wifi, WifiOff
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

// Demo credential quick-fills for hackathon presentation
const DEMO_CREDS = [
  { label: 'Demo Operator', email: 'demo@safevixai.app', password: 'SafeVixAI@2024', color: 'text-[#00C896]' },
  { label: 'IITM Evaluator', email: 'iitm@safevixai.app', password: 'iitm2024', color: 'text-amber-400' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, setUserProfile } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scanLine, setScanLine] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) router.replace('/');
  }, [isAuthenticated, router]);

  // Animate scan line
  useEffect(() => {
    const id = setInterval(() => setScanLine(p => (p + 1) % 100), 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.title = 'Operator Auth | SafeVixAI';
    emailRef.current?.focus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('All fields required.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Invalid credentials');
      }

      const data = await res.json();
      setAuth(data.access_token, data.operator_name);
      setUserProfile({ name: data.operator_name });
      setSuccess(`Welcome, ${data.operator_name}`);
      setTimeout(() => router.replace('/'), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Demo mode bypass — uses the hardcoded mock token
  const handleDemoMode = () => {
    setLoading(true);
    setTimeout(() => {
      setAuth('mock-jwt-token-for-hackathon', 'Demo Operator');
      setUserProfile({ name: 'Demo Operator', bloodGroup: 'O+', vehicleNumber: 'TN01AB1234', emergencyContact: '+91 98765 43210' });
      setSuccess('Demo Mode Active — Entering Command Center');
      setTimeout(() => router.replace('/'), 1000);
    }, 600);
  };

  const fillCreds = (c: typeof DEMO_CREDS[0]) => {
    setEmail(c.email);
    setPassword(c.password);
    setError('');
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0A0E14] flex items-center justify-center overflow-hidden">

      {/* ── Tactical Background ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #00C896 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Top-right green glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#1A5C38]/20 blur-[120px]" />
        {/* Bottom-left glow */}
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#00C896]/10 blur-[100px]" />

        {/* Animated scan line */}
        <div
          className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00C896]/40 to-transparent transition-none pointer-events-none"
          style={{ top: `${scanLine}%` }}
        />
      </div>

      {/* ── Main Login Panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 24, stiffness: 200 }}
        className="relative w-full max-w-md mx-4"
      >

        {/* Card */}
        <div className="relative rounded-xl border border-white/10 bg-[#0D1117]/90 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-black/60">

          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-[#1A5C38] via-[#00C896] to-[#1A5C38]" />

          {/* Card Body */}
          <div className="p-8">

            {/* Logo + Brand */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <motion.div
                animate={{ boxShadow: ['0 0 20px rgba(0,200,150,0.15)', '0 0 40px rgba(0,200,150,0.35)', '0 0 20px rgba(0,200,150,0.15)'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-lg bg-[#1A5C38] flex items-center justify-center border border-[#00C896]/20"
              >
                <Shield size={32} className="text-white" />
              </motion.div>

              <div className="text-center">
                <h1 className="text-2xl font-black text-white tracking-tight font-space uppercase">
                  SafeVixAI
                </h1>
                <p className="text-[10px] font-bold text-[#00C896] uppercase tracking-[0.1em] mt-0.5">
                  Operator Authentication
                </p>
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A5C38]/20 border border-[#1A5C38]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C896] animate-pulse" />
                  <span className="text-[9px] font-semibold text-[#00C896] uppercase tracking-widest">Sentinel Online</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <Lock size={9} className="text-slate-400" />
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">JWT Secured</span>
                </div>
              </div>
            </div>

            {/* ── Auth Form ── */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.25em] pl-1">
                  Operator Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    ref={emailRef}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="operator@safevixai.app"
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none focus:border-[#1A5C38] focus:ring-1 focus:ring-[#1A5C38]/40 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.25em] pl-1">
                  Access Key
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••••••"
                    className="w-full h-12 pl-11 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none focus:border-[#1A5C38] focus:ring-1 focus:ring-[#1A5C38]/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error / Success messages */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                    <span className="text-[12px] font-bold text-red-400">{error}</span>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-[12px] font-bold text-emerald-400">{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="relative h-13 w-full rounded-xl bg-[#1A5C38] hover:bg-[#145230] disabled:opacity-60 disabled:cursor-not-allowed border border-[#1A5C38]/40 text-white font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-[#1A5C38]/20 overflow-hidden flex items-center justify-center gap-2 mt-1"
                style={{ height: '52px' }}
              >
                {/* Shimmer on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear', repeatDelay: 1 }}
                />
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Enter Command Center</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* ── Demo Mode Button ── */}
            <button
              onClick={handleDemoMode}
              disabled={loading}
              className="w-full h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-[#1A5C38]/30 transition-all text-slate-300 hover:text-white text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group"
            >
              <Zap size={14} className="text-[#00C896] group-hover:animate-pulse" />
              Demo Mode (Hackathon)
              <ChevronRight size={13} className="text-slate-500 group-hover:text-[#00C896] group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* ── Quick-fill Demo Credentials ── */}
            <div className="mt-5 flex flex-col gap-2">
              <p className="text-[8px] font-semibold text-slate-600 uppercase tracking-[0.1em] text-center mb-1">
                Demo Credentials
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_CREDS.map((c) => (
                  <button
                    key={c.email}
                    onClick={() => fillCreds(c)}
                    type="button"
                    className="flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-[#1A5C38]/30 transition-all text-left"
                  >
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${c.color}`}>
                      {c.label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 truncate w-full">{c.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield size={10} className="text-[#1A5C38]" />
              <span className="text-[8px] font-semibold text-slate-600 uppercase tracking-[0.1em]">
                SafeVixAI Sentinel Protocol
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Wifi size={9} className="text-[#00C896]" />
              <span className="text-[8px] font-bold text-[#00C896] uppercase tracking-widest">Secure</span>
            </div>
          </div>
        </div>

        {/* Outside card — version tag */}
        <p className="text-center text-[9px] font-bold text-slate-700 uppercase tracking-[0.1em] mt-5">
          SafeVixAI v2.4 · IIT Madras Hackathon 2024
        </p>
      </motion.div>
    </div>
  );
}
