'use client';

import { Shield, Heart, Car, Phone, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ name?: string; blood?: string; vehicle?: string; contact?: string }>;
}

export default async function EmergencyCardPage({ params, searchParams }: PageProps) {
  const { userId } = await params;
  const { name = '', blood = '', vehicle = '', contact = '' } = await searchParams;

  const hasData = !!(name || blood || contact);

  return (
    <div className="min-h-screen bg-[#0A0E14] flex items-center justify-center p-4 font-sans">
      {/* Scan grid background */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #00C896 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Top green scan line animation */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00C896] to-transparent opacity-60 animate-pulse" />

      <div className="relative w-full max-w-sm mx-auto">

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#1A5C38] flex items-center justify-center shadow-lg shadow-[#1A5C38]/40">
              <Shield size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-[#00C896] uppercase tracking-[0.25em]">SafeVixAI</p>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Emergency Protocol</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C896] animate-pulse" />
            <span className="text-[9px] font-black text-[#00C896] uppercase tracking-[0.1em]">
              First Responder Card Active
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-xl border border-white/10 bg-[#0D1117] overflow-hidden shadow-2xl shadow-black/60">

          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-[#1A5C38] via-[#00C896] to-[#1A5C38]" />

          {/* Emergency Alert Bar */}
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 flex items-center gap-3">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 animate-pulse" />
            <p className="text-[11px] font-semibold text-red-400 uppercase tracking-widest">
              Emergency Medical Information
            </p>
          </div>

          {/* Person info */}
          <div className="px-6 pt-6 pb-4">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Operator</p>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-1">
              {name || <span className="text-white/20">Unknown</span>}
            </h1>
            <p className="text-[10px] font-black text-[#00C896]/70 uppercase tracking-widest font-mono">
              {userId}
            </p>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-2 gap-3 px-6 pb-6">

            {/* Blood Group — largest, most critical */}
            <div className="col-span-2 p-5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Heart size={24} className="text-red-400" />
              </div>
              <div>
                <p className="text-[9px] font-black text-red-400/70 uppercase tracking-widest">Blood Group</p>
                <p className="text-4xl font-black text-red-400 leading-none mt-0.5">
                  {blood || <span className="text-red-400/30 text-2xl">Unknown</span>}
                </p>
              </div>
            </div>

            {/* Vehicle */}
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Car size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[8px] font-semibold text-emerald-400/70 uppercase tracking-widest">Vehicle</p>
                <p className="text-sm font-semibold text-white leading-tight mt-0.5">
                  {vehicle || <span className="text-white/20">—</span>}
                </p>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Phone size={16} className="text-amber-400" />
              </div>
              <div>
                <p className="text-[8px] font-semibold text-amber-400/70 uppercase tracking-widest">SOS Contact</p>
                <p className="text-sm font-semibold text-white leading-tight mt-0.5">
                  {contact || <span className="text-white/20">—</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Call SOS Contact CTA */}
          {contact && (
            <div className="px-6 pb-6">
              <a
                href={`tel:${contact.replace(/\s/g, '')}`}
                className="flex items-center justify-center gap-2 w-full h-14 rounded-lg bg-[#1A5C38] hover:bg-[#145230] transition-all text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-[#1A5C38]/30 active:scale-95"
              >
                <Phone size={18} />
                Call Emergency Contact
              </a>
            </div>
          )}

          {/* Quick Dial Emergency Numbers */}
          <div className="border-t border-white/5 px-6 py-4">
            <p className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest mb-3">India Emergency Lines</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Police', num: '100', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
                { label: 'Ambulance', num: '102', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
                { label: 'Fire', num: '101', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
                { label: 'Helpline', num: '112', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
              ].map((d) => (
                <a
                  key={d.num}
                  href={`tel:${d.num}`}
                  className={`flex flex-col items-center p-2.5 rounded-xl border ${d.color} transition-all active:scale-95`}
                >
                  <span className="text-lg font-black leading-none">{d.num}</span>
                  <span className="text-[7px] font-bold uppercase tracking-wider opacity-70 mt-0.5">{d.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 px-6 py-3 flex items-center justify-between">
            <span className="text-[8px] font-semibold text-slate-600 uppercase tracking-widest">
              Powered by SafeVixAI
            </span>
            <div className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-[#00C896]" />
              <span className="text-[8px] font-bold text-[#00C896] uppercase tracking-widest">Verified</span>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-6">
          Scanned from SafeVixAI Emergency QR Card
        </p>
      </div>
    </div>
  );
}
