'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartPulse, Activity, Flame, Bone, Droplets, 
  Search, ArrowLeft, X, CheckCircle2, 
  Phone, Clock, AlertTriangle, ShieldAlert,
  ChevronRight, Camera, Globe, CameraOff,
} from 'lucide-react';
import TopSearch from '@/components/dashboard/TopSearch';
import SystemHeader from '@/components/dashboard/SystemHeader';
import BottomNav from '@/components/dashboard/BottomNav';
import SystemSidebar from '@/components/dashboard/SystemSidebar';

interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  citations?: string[];
  suggestedQueries?: string[];
}

const TypingText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  const index = useRef(0);

  useEffect(() => {
    index.current = 0;
    setDisplayedText("");
  }, [text]);

  useEffect(() => {
    if (index.current < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index.current]);
        index.current += 1;
      }, 10);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [displayedText, text, onComplete]);

  return <span>{displayedText}</span>;
};

const CameraViewport = ({ onError }: { onError: (err: string | null) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        onError(null);
      } catch (err) {
        console.error("Camera access denied:", err);
        setError("Camera Access Denied");
        onError("Camera Access Denied");
      }
    }
    startCamera();
    const currentVideo = videoRef.current;
    return () => {
      if (currentVideo?.srcObject) {
        (currentVideo.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [onError]);

  if (error) return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm text-slate-400 font-bold uppercase tracking-widest text-[10px] px-12 text-center gap-3">
      <div className="p-3 rounded-full bg-slate-800/50 border border-white/5">
        <CameraOff size={24} className="text-slate-500" />
      </div>
      <span>{error} — Enable permissions in settings to activate AI diagnostics</span>
    </div>
  );

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 mix-blend-screen"
      />
      {/* HUD Overlays - Simplified */}
      <div className="absolute inset-0 border-[1px] border-white/10 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-blue-500/20 rounded-full animate-pulse"></div>
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[9px] font-mono text-emerald-400 tracking-widest uppercase">Sentinel-X Active</span>
      </div>
    </div>
  );
};

interface Guide {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  icon: string;
  iconType: 'filled' | 'outlined';
  steps: string[];
}

const GUIDES: Record<string, Guide> = {
  cpr: {
    id: 'cpr',
    title: 'CPR',
    subtitle: 'Step-by-step resuscitation for adults, children, and infants. Essential life support.',
    accent: '#ffb4aa', // primary
    icon: 'ecg_heart',
    iconType: 'filled',
    steps: [
      'Check scene safety — shout &quot;Are you OK?&quot; and tap shoulders',
      'Call 112 now or ask a bystander to call immediately',
      'Tilt head back, lift chin, check for breathing (10 sec)',
      'Give 30 chest compressions: hard, fast, center of chest',
      'Give 2 rescue breaths — seal mouth, watch for chest rise',
      'Continue 30:2 cycles until paramedics arrive',
    ]
  },
  choking: {
    id: 'choking',
    title: 'Choking',
    subtitle: 'Heimlich maneuver and airway clearance techniques for all ages.',
    accent: '#adc6ff', // tertiary
    icon: 'airwave',
    iconType: 'outlined',
    steps: [
      'Ask &quot;Are you choking?&quot; — if unable to speak/cough, act',
      'Give 5 firm back blows between shoulder blades',
      'Give 5 abdominal thrusts (Heimlich maneuver)',
      'Repeat back blows + thrusts until object dislodges',
      'If unconscious: lay down, begin CPR, check mouth before breaths',
    ]
  },
  bleeding: {
    id: 'bleeding',
    title: 'Severe Bleeding',
    subtitle: 'Tourniquet application and pressure points to control hemorrhaging.',
    accent: '#ffb4aa', // primary
    icon: 'blood_pressure',
    iconType: 'filled',
    steps: [
      'Apply firm direct pressure with clean cloth — do NOT remove',
      'Elevate the wound above the heart level if possible',
      'Apply tourniquet 5–7cm above wound for limb bleeding',
      'Note exact time of tourniquet application (write on skin)',
      'Keep victim warm and calm — monitor for shock',
      'Call 108 and keep pressure until medics arrive',
    ]
  },
  burns: {
    id: 'burns',
    title: 'Burns',
    subtitle: 'Treating thermal, chemical, and electrical burns. Degrees of severity.',
    accent: '#FFB45B', // yellow-ish
    icon: 'local_fire_department',
    iconType: 'outlined',
    steps: [
      'Remove from heat source — ensure your own safety first',
      'Cool burn under cool (NOT cold) running water for 20 minutes',
      'Do NOT use ice, butter, toothpaste or any home remedies',
      'Remove jewelry/clothing near burn — but NOT if stuck to skin',
      'Cover loosely with non-fluffy sterile dressing (cling film ideal)',
      'Call 108 for burns larger than palm, or face/genital area',
    ]
  },
  fractures: {
    id: 'fractures',
    title: 'Fractures',
    subtitle: 'Stabilizing broken bones and suspected spinal injuries safely.',
    accent: '#53e16f', // secondary
    icon: 'skeleton',
    iconType: 'outlined',
    steps: [
      'Do not move the victim unless in immediate danger',
      'Control any bleeding with direct pressure',
      'Immobilize the injured area using a splint or sling',
      'Apply cold packs wrapped in cloth to reduce swelling',
      'Monitor for signs of shock (paleness, rapid breathing)',
      'Wait for emergency medical personnel',
    ]
  }
};

export default function FirstAidPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setMounted(true);
    document.title = 'First Aid Guide | SafeVixAI';
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveGuide(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleModalScroll = () => {
    if (modalScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = modalScrollRef.current;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(progress);
    }
  };

  const toggleStep = (idx: number) => {
    const newSteps = new Set(completedSteps);
    if (newSteps.has(idx)) newSteps.delete(idx);
    else newSteps.add(idx);
    setCompletedSteps(newSteps);
  };

  const guideKeys = Object.keys(GUIDES).filter(key => 
    GUIDES[key].title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    GUIDES[key].subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div className="relative w-full h-[100dvh] bg-[#f8fafc] dark:bg-[#071325] text-slate-800 dark:text-[#d7e3fc] overflow-hidden flex flex-col">
      {/* ── Unified Tactical Navigation Header ── */}
      <SystemHeader title="First Aid Dispatch HUD" showBack={false} />
      
      <div className="lg:hidden relative z-[100]">
        <TopSearch isMapPage={false} forceShow={true} showBack={false} />
      </div>

      <SystemSidebar />

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-32 lg:pt-28 pb-44">
        <div className="max-w-7xl mx-auto">
          {/* ── Premium HUD Header ── */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 font-space">Emergency Response Protocol</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-white font-space uppercase">First Aid <span className="text-red-500">HUD</span></h1>
            </div>

            {/* Emergency Mode Toggle */}
            <button 
              onClick={() => setEmergencyMode(!emergencyMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 font-bold text-xs uppercase tracking-widest ${emergencyMode ? 'bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'}`}
            >
              <AlertTriangle size={14} className={emergencyMode ? 'animate-pulse' : ''} />
              {emergencyMode ? 'Emergency Active' : 'Normal Mode'}
            </button>
          </div>
          {/* ── Search HUD ── */}
          {!emergencyMode && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 relative group"
            >
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500 font-space">System Status: <span className="text-emerald-500">Operational</span></span>
                </div>
                <div className="flex items-center gap-1">
                   <div className="w-1 h-1 rounded-full bg-slate-400" />
                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">L-09 Mission Ready</span>
                </div>
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl blur opacity-20 transition duration-500 group-hover:opacity-40"></div>
              <div className="relative bg-white/60 dark:bg-[#1a2133]/40 backdrop-blur-xl p-3 sm:p-4 rounded-2xl flex items-center gap-4 border border-slate-300/80 dark:border-white/5 focus-within:border-blue-500/30 transition-all duration-300">
                <Search className="text-slate-400 dark:text-slate-500 shrink-0" size={18} />
                <input 
                  className="bg-transparent border-none text-slate-800 dark:text-[#d7e3fc] placeholder:text-slate-500/40 focus:ring-0 w-full text-base focus:outline-none font-medium" 
                  placeholder="Search emergency protocol..." 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.section>
          )}

        {/* ── Protocol Grid ── */}
        <motion.div 
          layout
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
              }
            }
          }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {guideKeys
              .filter(key => !emergencyMode || ['cpr', 'choking', 'bleeding'].includes(key))
              .map((key, index) => {
                const guide = GUIDES[key];
                const isCritical = ['cpr', 'bleeding'].includes(key);
                
                return (
                  <motion.div
                    key={key}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.95 },
                      show: { 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                        transition: { type: "spring", damping: 25, stiffness: 300 }
                      }
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => {
                      setActiveGuide(key);
                      setCompletedSteps(new Set());
                    }}
                    className={`group cursor-pointer relative overflow-hidden rounded-3xl p-6 sm:p-8 transition-all duration-300 border ${
                      isCritical 
                        ? 'bg-white dark:bg-[#1a2133] border-red-500/20 shadow-[0_20px_50px_rgba(239,68,68,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]' 
                        : 'bg-white/60 dark:bg-[#101c2e]/40 backdrop-blur-md border-slate-300/80 dark:border-white/5 hover:border-blue-500/30'
                    } ${emergencyMode && key === 'cpr' ? 'md:col-span-2 lg:col-span-3 py-12' : ''}`}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-4 right-6 flex items-center gap-2">
                      {isCritical && (
                        <div className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border border-red-500/20 flex items-center gap-1">
                          <AlertTriangle size={10} />
                          Priority P0
                        </div>
                      )}
                      <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border border-emerald-500/20 flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Offline
                      </div>
                    </div>

                    <div className={`flex flex-col h-full justify-between gap-8 relative z-10 ${emergencyMode && key === 'cpr' ? 'md:flex-row md:items-center' : ''}`}>
                      <div className="flex flex-col gap-5">
                        <div className={`p-4 rounded-2xl w-fit transition-transform group-hover:scale-110 duration-500 ${
                          isCritical ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {key === 'cpr' && <HeartPulse size={emergencyMode ? 48 : 32} />}
                          {key === 'choking' && <Activity size={32} />}
                          {key === 'bleeding' && <Droplets size={32} />}
                          {key === 'burns' && <Flame size={32} />}
                          {key === 'fractures' && <Bone size={32} />}
                        </div>
                        
                        <div>
                          <h2 className={`font-black tracking-tight dark:text-white mb-2 font-space uppercase ${
                            emergencyMode && key === 'cpr' ? 'text-4xl sm:text-5xl' : 'text-2xl'
                          }`}>
                            {guide.title}
                          </h2>
                          <p className={`text-slate-500 dark:text-slate-400 font-medium leading-relaxed ${
                            emergencyMode && key === 'cpr' ? 'text-lg max-w-xl' : 'text-sm'
                          }`}>
                            {guide.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 ${
                          isCritical 
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40' 
                            : 'bg-slate-800 dark:bg-white/10 text-white hover:bg-slate-900 dark:hover:bg-white/20'
                        }`}>
                          Start Guide <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Decorative Background Elements */}
                    <div className="absolute -bottom-6 -right-6 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                       {key === 'cpr' && <HeartPulse size={180} />}
                       {key === 'bleeding' && <Droplets size={180} />}
                    </div>
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {/* Quick Access Kit Card */}
          {!emergencyMode && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group cursor-pointer relative bg-gradient-to-br from-slate-800 to-slate-900 dark:from-[#1a2133] dark:to-[#030e20] rounded-3xl p-8 border border-white/5 flex items-center justify-between col-span-1 md:col-span-2 lg:col-span-1 hover:border-blue-500/20 transition-all shadow-xl shadow-black/20"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-blue-400" />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest font-space">Inventory HUD</span>
                </div>
                <h3 className="text-xl font-black text-white font-space uppercase">First Aid Kit</h3>
                <p className="text-slate-400 text-xs font-medium">Inventory checklist & alerts</p>
              </div>
              <button className="bg-white/10 p-4 rounded-2xl text-white group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <ChevronRight size={24} />
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* ── AI Vision Assessment: Live Simulation ── */}
        <section className="mt-12 mb-20 bg-white/30 dark:bg-white/[0.02] border border-slate-300 dark:border-white/5 rounded-[2.5rem] p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Camera size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500 font-space">Diagnostic Module SVX-1</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-space uppercase mb-2">AI Vision Assessment</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-lg leading-relaxed">Real-time identification of trauma, bleeding patterns, and skeletal anomalies using multi-spectral computer vision.</p>
            </div>
            
            <button 
              onClick={() => setIsScanning(true)}
              className="bg-blue-600 hover:bg-blue-700 shadow-[0_8px_25px_rgba(37,99,235,0.2)] px-8 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-3 active:scale-95 transition-all w-fit"
            >
              <Camera size={18} />
              Invoke Full Scan
            </button>
          </div>
          
          <div className="relative rounded-[2rem] overflow-hidden group border border-slate-300 dark:border-white/10 bg-slate-950 aspect-video sm:aspect-[16/9] sm:h-auto max-h-[500px] shadow-2xl">
            {/* Camera Viewport */}
            {isScanning ? (
              <CameraViewport onError={setCameraError} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4 bg-slate-900/40">
                <Camera size={48} className="opacity-20" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Scanner Offline. Invoke full scan to initialize.</span>
              </div>
            )}

            {/* HUD Overlay - Only show if camera is NOT errored and is scanning */}
            {!cameraError && isScanning && (
              <div className="absolute inset-0 pointer-events-none z-10 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2">
                    <div className="w-10 h-10 border-t border-l border-blue-500/40" />
                    <div className="flex flex-col mt-2">
                      <span className="text-[7px] font-black text-blue-500/60 font-mono tracking-tighter uppercase">Initializing...</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 border-t border-r border-blue-500/40" />
                </div>

                {/* Center Crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                  <div className="w-24 h-24 border border-blue-500/10 rounded-full animate-ping opacity-20" />
                  <div className="w-16 h-px bg-blue-500/30" />
                  <div className="h-16 w-px bg-blue-500/30" />
                </div>

                <div className="flex justify-between items-end">
                  <div className="w-10 h-10 border-b border-l border-blue-500/40" />
                  <div className="bg-black/80 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/5 flex items-center gap-4">
                     <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Focus State</span>
                       <span className="text-[10px] font-bold text-white font-mono">AWAITING_INPUT</span>
                     </div>
                     <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  </div>
                  <div className="w-10 h-10 border-b border-r border-blue-500/40" />
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>

      <BottomNav />

      {/* ── Active Guide Modal: Survival HUD ── */}
      <AnimatePresence>
        {activeGuide && GUIDES[activeGuide] && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#f8fafc]/90 dark:bg-[#071325]/95 backdrop-blur-xl flex flex-col overflow-hidden"
          >
            {/* Top Navigation HUD */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-[#071325]/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveGuide(null)}
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 font-space">Live Protocol</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-space uppercase">
                    {GUIDES[activeGuide].title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a 
                  href="tel:112"
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/25 active:scale-95 transition-transform"
                >
                  <Phone size={14} />
                  Call 112
                </a>
                <button 
                  onClick={() => setActiveGuide(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 bg-red-500/20 w-full relative">
               <motion.div 
                 className="absolute inset-y-0 left-0 bg-red-500" 
                 initial={{ width: 0 }}
                 animate={{ width: `${scrollProgress}%` }}
               />
            </div>
            
            <div 
              ref={modalScrollRef}
              onScroll={handleModalScroll}
              className="flex-1 overflow-y-auto px-4 sm:px-6 py-8"
            >
              <div className="max-w-3xl mx-auto space-y-8">
                {/* Protocol Header Card */}
                <div className="bg-white dark:bg-[#1a2133] rounded-3xl p-6 sm:p-8 border border-slate-300 dark:border-white/5 shadow-xl">
                  <div className="flex items-start gap-6">
                    <div className="p-5 rounded-2xl bg-red-500/10 text-red-500 hidden sm:block">
                      <HeartPulse size={40} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-red-500 uppercase tracking-widest font-space mb-2">Instructions</h3>
                      <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                        <TypingText text={GUIDES[activeGuide].subtitle} />
                      </p>
                    </div>
                  </div>

                  {/* CPR Metronome Integration */}
                  {activeGuide === 'cpr' && (
                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col items-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Compression Metronome (100 BPM)</p>
                      <div className="relative">
                        <motion.div 
                          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                          className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center"
                        >
                          <div className="w-12 h-12 rounded-full bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]" />
                        </motion.div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <span className="text-white font-black text-sm uppercase">PULSE</span>
                        </div>
                      </div>
                      <p className="mt-4 text-xs font-bold text-red-500 uppercase tracking-widest animate-pulse">Push Hard, Push Fast</p>
                    </div>
                  )}
                </div>

                {/* Tactical Step List */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-2">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.25em] font-space">Sequential Actions</h3>
                     <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                       {completedSteps.size} / {GUIDES[activeGuide].steps.length} Complete
                     </span>
                   </div>

                  {GUIDES[activeGuide].steps.map((step, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (idx * 0.1) }}
                      onClick={() => toggleStep(idx)}
                      className={`group cursor-pointer p-5 sm:p-6 rounded-2xl border transition-all duration-300 flex gap-5 items-start ${
                        completedSteps.has(idx) 
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-500/5 dark:text-emerald-400 dark:border-emerald-500/20 opacity-60 scale-[0.98]' 
                          : 'bg-white dark:bg-[#1a2133]/60 dark:hover:bg-[#1a2133] border-slate-200 dark:border-white/5 text-slate-800 dark:text-[#d7e3fc]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black flex-shrink-0 text-xs transition-colors ${
                        completedSteps.has(idx) 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                      }`}>
                        {completedSteps.has(idx) ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>

                      <div className="flex-1 space-y-1">
                        <p className="font-bold leading-relaxed">{step}</p>
                        {idx === 0 && !completedSteps.has(idx) && (
                          <div className="flex items-center gap-1.5 text-red-500 animate-pulse">
                            <AlertTriangle size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Critical Foundation</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Final Call to Action */}
                <div className="pt-8 pb-12 flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <button 
                    onClick={() => setActiveGuide(null)}
                    className="w-full sm:w-auto px-10 py-4 bg-slate-800 dark:bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl active:scale-95 transition-all"
                  >
                    Terminate Protocol
                  </button>
                  <a 
                    href="tel:108"
                    className="w-full sm:w-auto px-10 py-4 bg-red-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-red-500/20 animate-pulse flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Phone size={16} />
                    Emergency Hotline
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
