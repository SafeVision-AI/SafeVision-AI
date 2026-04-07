
'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  Mic,
  Navigation,
  Phone,
  RefreshCcw,
  Send,
  ShieldAlert,
  Upload,
} from 'lucide-react';

import BottomNav from '@/components/dashboard/BottomNav';
import SystemSidebar from '@/components/dashboard/SystemSidebar';
import TopSearch from '@/components/dashboard/TopSearch';
import HazardViewfinder from '@/components/report/HazardViewfinder';
import {
  type AuthorityPreviewResponse,
  type RoadInfrastructureResponse,
  type RoadReportResponse,
  fetchAuthorityPreview,
  fetchRoadInfrastructure,
  reverseGeocode,
  submitReport,
} from '@/lib/api';
import { useGeolocation } from '@/lib/geolocation';
import {
  formatAccuracyLabel,
  formatLocationLabel,
  formatLocationSubtitle,
  isApproximateLocation,
} from '@/lib/location-utils';
import { useAppStore } from '@/lib/store';

const ISSUE_OPTIONS = [
  ['pothole', 'Pothole', 'Surface collapse or broken asphalt'],
  ['debris', 'Road Debris', 'Objects blocking or endangering traffic'],
  ['waterlogging', 'Waterlogging', 'Flooding, drainage failure, hidden hazards'],
  ['signage', 'Signage', 'Missing barriers, broken signs, faded markings'],
  ['streetlight', 'Streetlight', 'Lighting failure reducing night visibility'],
  ['accident', 'Collision Scene', 'Crash spillover or active obstruction'],
] as const;

const SEVERITY_OPTIONS = [
  [1, 'Low', 'Monitor only'],
  [2, 'Guarded', 'Needs maintenance soon'],
  [3, 'Serious', 'Affects safe driving now'],
  [4, 'Critical', 'Immediate authority response'],
  [5, 'Extreme', 'High-risk emergency condition'],
] as const;

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function extractApiError(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const maybe = error as { response?: { data?: { detail?: string } }; message?: string };
    if (typeof maybe.response?.data?.detail === 'string') return maybe.response.data.detail;
    if (typeof maybe.message === 'string') return maybe.message;
  }
  return fallback;
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Not published';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function normalizeExternalUrl(url: string | null | undefined) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function SurfaceCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        'rounded-[2rem] border border-slate-200/70 bg-white/82 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl',
        'dark:border-slate-800/80 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.9))] dark:shadow-[0_30px_120px_rgba(2,6,23,0.52)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export default function ReportPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedType, setSelectedType] = useState<(typeof ISSUE_OPTIONS)[number][0]>('pothole');
  const [severity, setSeverity] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | undefined>();
  const [authorityPreview, setAuthorityPreview] = useState<AuthorityPreviewResponse | null>(null);
  const [infrastructure, setInfrastructure] = useState<RoadInfrastructureResponse | null>(null);
  const [locationDisplay, setLocationDisplay] = useState<string | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<RoadReportResponse | null>(null);

  const setGpsLocation = useAppStore((state) => state.setGpsLocation);
  const { location: gpsLocation, error: gpsError, loading: locating, refresh } = useGeolocation();

  const coordinateSignature = useMemo(() => (gpsLocation ? `${gpsLocation.lat.toFixed(4)}:${gpsLocation.lon.toFixed(4)}` : null), [gpsLocation]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(undefined);
      return;
    }
    const nextUrl = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [photoFile]);

  useEffect(() => {
    const location = gpsLocation;
    if (!coordinateSignature || !location) return;

    const baseLocation = {
      lat: location.lat,
      lon: location.lon,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
    };

    let cancelled = false;

    async function syncLocationContext() {
      setContextLoading(true);
      setContextError(null);

      const [reverseResult, authorityResult, infrastructureResult] = await Promise.allSettled([
        reverseGeocode({ lat: baseLocation.lat, lon: baseLocation.lon }),
        fetchAuthorityPreview({ lat: baseLocation.lat, lon: baseLocation.lon }),
        fetchRoadInfrastructure({ lat: baseLocation.lat, lon: baseLocation.lon }),
      ]);

      if (cancelled) return;

      let nextError: string | null = null;

      if (reverseResult.status === 'fulfilled') {
        setLocationDisplay(reverseResult.value.displayName ?? null);
        setGpsLocation({
          ...baseLocation,
          city: reverseResult.value.city ?? undefined,
          state: reverseResult.value.state ?? undefined,
          displayName: reverseResult.value.displayName ?? undefined,
        });
      } else {
        setLocationDisplay(null);
        nextError = extractApiError(
          reverseResult.reason,
          'Unable to resolve a readable address for your current coordinates.'
        );
      }

      if (authorityResult.status === 'fulfilled') {
        setAuthorityPreview(authorityResult.value);
      } else {
        setAuthorityPreview(null);
        nextError =
          nextError ??
          extractApiError(
            authorityResult.reason,
            'Road ownership lookup is temporarily unavailable.'
          );
      }

      if (infrastructureResult.status === 'fulfilled') {
        setInfrastructure(infrastructureResult.value);
      } else {
        setInfrastructure(null);
        nextError =
          nextError ??
          extractApiError(
            infrastructureResult.reason,
            'Road infrastructure data could not be loaded right now.'
          );
      }

      setContextError(nextError);
      setContextLoading(false);
    }

    void syncLocationContext();

    return () => {
      cancelled = true;
    };
  }, [coordinateSignature, gpsLocation, setGpsLocation]);

  const severityMeta = SEVERITY_OPTIONS.find((option) => option[0] === severity) ?? SEVERITY_OPTIONS[2];
  const locationLabel = formatLocationLabel(gpsLocation, gpsError);
  const locationSubtitle = gpsLocation ? locationDisplay ?? formatLocationSubtitle(gpsLocation) : 'Enable location to match the exact road-owning authority.';
  const accuracyLabel = formatAccuracyLabel(gpsLocation);
  const approximateLocation = isApproximateLocation(gpsLocation);
  const photoHint = photoFile ? `${photoFile.name} - ${(photoFile.size / (1024 * 1024)).toFixed(2)} MB` : 'JPG, PNG, or WEBP. Optional, but it speeds up verification.';

  const portalUrl = normalizeExternalUrl(submittedReport?.complaintPortal ?? authorityPreview?.complaintPortal ?? null);
  const helpline = submittedReport?.authorityPhone ?? authorityPreview?.helpline ?? null;
  const reportRoadName = submittedReport?.roadName ?? infrastructure?.roadName ?? authorityPreview?.roadName ?? null;
  const reportRoadNumber = submittedReport?.roadNumber ?? infrastructure?.roadNumber ?? authorityPreview?.roadNumber ?? null;
  const reportAuthority = submittedReport?.authorityName ?? authorityPreview?.authorityName ?? null;
  const reportType = submittedReport?.roadType ?? infrastructure?.roadType ?? authorityPreview?.roadType ?? null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gpsLocation) {
      setSubmitError('Enable location before submitting a road issue.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await submitReport({
        lat: gpsLocation.lat,
        lon: gpsLocation.lon,
        issue_type: selectedType,
        severity,
        description: notes,
        photo: photoFile,
      });
      setSubmittedReport(response);
    } catch (error) {
      setSubmittedReport(null);
      setSubmitError(extractApiError(error, 'Unable to submit the report right now. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPhotoFile(event.target.files?.[0] ?? null);
  }

  function resetForm() {
    setSelectedType('pothole');
    setSeverity(3);
    setNotes('');
    setPhotoFile(null);
    setSubmitError(null);
    setSubmittedReport(null);
  }

  if (!mounted) return null;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-[#020817] dark:text-[#d7e3fc]">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute right-[-10%] top-[-12%] hidden h-[38rem] w-[38rem] rounded-full bg-cyan-500/10 blur-[150px] dark:block" />
        <div className="absolute left-[22%] top-[4%] hidden h-[20rem] w-[20rem] rounded-full bg-violet-500/8 blur-[120px] dark:block" />
        <div className="absolute bottom-[-16%] left-[-8%] hidden h-[28rem] w-[28rem] rounded-full bg-blue-500/12 blur-[140px] dark:block" />
      </div>

      <SystemSidebar />

      {/* ── Top Search Header (Floating Pill) ── */}
      <div className="fixed top-0 left-0 w-full z-[100] pointer-events-none">
        <div className="pointer-events-auto">
          <TopSearch isMapPage={false} forceShow={true} />
        </div>
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-32 pt-28 sm:px-6 lg:px-8 lg:pb-10">
        
        {/* ── Dispatch Hero Section ── */}
        <section className="mt-4 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex w-fit items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 dark:border-blue-400/15 dark:bg-blue-500/12">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Dispatch Sentinel</span>
            </div>
            {approximateLocation && gpsLocation && (
              <div className="flex w-fit items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 dark:border-orange-400/15 dark:bg-orange-500/12">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Approximate GPS</span>
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase font-space leading-tight dark:bg-gradient-to-r dark:from-white dark:via-slate-100 dark:to-cyan-200 dark:bg-clip-text dark:text-transparent sm:text-3xl">
              Real-Time Road Hazard Reporting
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider opacity-70">
              Uplinking live road intel to matching authorities. Precision reporting for safer transit networks.
            </p>
          </div>
        </section>
        <div className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
          <section className="space-y-6">
            <SurfaceCard className="overflow-hidden p-0">
              <div className="min-h-[360px] sm:min-h-[420px]">
                <HazardViewfinder imageSrc={photoPreviewUrl} isDetecting={contextLoading || submitting} confidence={submittedReport ? 99.4 : contextLoading ? 96.2 : 97.8} statusLabel={submittedReport ? 'Dispatch confirmed' : contextLoading ? 'Syncing live road intel' : photoFile ? 'Photo attached and ready' : 'Live hazard viewport'} signalLabel={accuracyLabel ?? (locating ? 'Acquiring GPS' : 'Awaiting GPS')} locationLabel={gpsLocation ? `${gpsLocation.lat.toFixed(5)}, ${gpsLocation.lon.toFixed(5)}` : 'Awaiting live coordinates'} viewportId={submittedReport ? submittedReport.uuid : 'RW-LIVE-REPORT-01'} />
              </div>
            </SurfaceCard>

            <div className="grid gap-4 lg:grid-cols-2">
              <SurfaceCard>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Location Lock</div>
                    <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">{locationLabel}</h2>
                  </div>
                  <button type="button" onClick={refresh} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95 dark:border-slate-800/80 dark:bg-slate-950/55 dark:text-slate-200 dark:hover:border-blue-400/20 dark:hover:bg-blue-500/10 dark:hover:text-blue-100" aria-label="Refresh location">
                    {locating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
                  </button>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{gpsError ?? locationSubtitle}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-950/45">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Accuracy</div>
                    <div className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{accuracyLabel ?? 'Pending device fix'}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-950/45">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Coordinates</div>
                    <div className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{gpsLocation ? `${gpsLocation.lat.toFixed(5)}, ${gpsLocation.lon.toFixed(5)}` : '--'}</div>
                  </div>
                </div>
                {approximateLocation && gpsLocation ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-400/20 dark:bg-[linear-gradient(180deg,rgba(245,158,11,0.14),rgba(120,53,15,0.16))] dark:text-amber-100">Your browser is giving an approximate location. You can still report, but a sharper GPS fix will improve road ownership matching.</div> : null}
              </SurfaceCard>

              <SurfaceCard>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Evidence Capture</div>
                    <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Optional photo uplink</h2>
                  </div>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800/80 dark:bg-slate-950/55 dark:text-slate-200"><Camera size={18} /></div>
                </div>
                <label htmlFor="hazard-photo" className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50/70 dark:border-slate-800/80 dark:bg-slate-950/45 dark:hover:border-blue-400/20 dark:hover:bg-blue-500/10">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/16 dark:text-blue-100"><Upload size={22} /></div>
                  <div className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-slate-800 dark:text-slate-100">{photoFile ? 'Replace photo' : 'Attach road image'}</div>
                  <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">{photoHint}</p>
                </label>
                <input id="hazard-photo" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
              </SurfaceCard>
            </div>
          </section>

          <section className="space-y-6">
            <SurfaceCard>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Report Dispatch Form</div>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Flag the hazard with live authority routing</h2>
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800/80 dark:bg-slate-950/55 dark:text-slate-100"><Send size={18} /></div>
              </div>

              <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Hazard type</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {ISSUE_OPTIONS.map(([value, label, detail], index) => {
                      const active = value === selectedType;
                      const activeAccent = [
                        'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-50',
                        'border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-50',
                        'border-cyan-200 bg-cyan-50 text-cyan-950 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-50',
                        'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-50',
                        'border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-50',
                        'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-50',
                      ][index];
                      return (
                        <button key={value} type="button" onClick={() => setSelectedType(value)} className={cx('rounded-[1.5rem] border px-4 py-4 text-left transition', active ? activeAccent : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-800/80 dark:bg-slate-950/55 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-950/80')}>
                          <div className="text-sm font-black uppercase tracking-[0.16em]">{label}</div>
                          <p className="mt-2 text-sm font-medium opacity-80">{detail}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Severity</div>
                    <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">{severityMeta[1]} - {severityMeta[2]}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {SEVERITY_OPTIONS.map(([value, label]) => {
                      const active = value === severity;
                      return (
                        <button key={value} type="button" onClick={() => setSeverity(value)} className={cx('rounded-2xl border px-3 py-4 text-center transition', active ? value >= 4 ? 'border-red-500 bg-red-500 text-white shadow-lg shadow-red-500/20' : 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-950/55 dark:text-slate-100')}>
                          <div className="text-lg font-black leading-none">{value}</div>
                          <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em]">{label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Notes for the authority desk</div>
                    <div className="text-xs font-semibold text-slate-400 dark:text-slate-500">{notes.trim().length}/480</div>
                  </div>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value.slice(0, 480))} placeholder="Describe lane blockage, vehicle risk, traffic density, or how the hazard presents on the road." className="mt-3 min-h-[140px] w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white dark:border-slate-800/80 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400/40 dark:focus:bg-slate-950/75" />
                </div>

                {submitError ? <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-100">{submitError}</div> : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="submit" disabled={submitting || !gpsLocation} className="inline-flex flex-1 items-center justify-center gap-3 rounded-[1.6rem] bg-gradient-to-r from-orange-500 via-rose-500 to-red-500 px-5 py-4 text-sm font-black uppercase tracking-[0.22em] text-white shadow-[0_24px_80px_rgba(239,68,68,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50">
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {submitting ? 'Submitting...' : 'Submit live report'}
                  </button>
                  <button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-3 rounded-[1.6rem] border border-slate-200 bg-slate-100 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-800/80 dark:bg-slate-950/55 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-950/80">
                    <RefreshCcw size={18} />Reset
                  </button>
                </div>
              </form>
            </SurfaceCard>
            <AnimatePresence initial={false}>
              {submittedReport ? (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <SurfaceCard className="border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-500/10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/20 dark:text-emerald-100"><span className="h-1.5 w-1.5 rounded-full bg-current" />Report uplinked</span>
                        <h3 className="mt-3 text-2xl font-black tracking-tight text-emerald-950 dark:text-emerald-50">Complaint reference {submittedReport.complaintRef ?? submittedReport.uuid}</h3>
                        <p className="mt-2 text-sm font-semibold text-emerald-900/80 dark:text-emerald-100/80">The report is now tagged to {submittedReport.authorityName} for the {submittedReport.roadType} network.</p>
                      </div>
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"><CheckCircle2 size={22} /></div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-200/70 bg-white/80 px-4 py-3 dark:border-emerald-400/15 dark:bg-emerald-950/20">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700/70 dark:text-emerald-100/70">Authority desk</div>
                        <div className="mt-2 text-lg font-black text-emerald-950 dark:text-emerald-50">{submittedReport.authorityName}</div>
                        <a href={`tel:${submittedReport.authorityPhone}`} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4 dark:text-emerald-100"><Phone size={14} />{submittedReport.authorityPhone}</a>
                      </div>
                      <div className="rounded-2xl border border-emerald-200/70 bg-white/80 px-4 py-3 dark:border-emerald-400/15 dark:bg-emerald-950/20">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700/70 dark:text-emerald-100/70">Tagged road asset</div>
                        <div className="mt-2 text-lg font-black text-emerald-950 dark:text-emerald-50">{[submittedReport.roadNumber, submittedReport.roadName].filter(Boolean).join(' - ') || submittedReport.roadType}</div>
                        <div className="mt-2 text-sm font-semibold text-emerald-900/80 dark:text-emerald-100/80">{submittedReport.roadType}</div>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      {portalUrl ? <a href={portalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"><Navigation size={16} />Open complaint portal</a> : null}
                      <button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-emerald-800 transition hover:border-emerald-400 dark:border-emerald-400/15 dark:bg-emerald-950/20 dark:text-emerald-100 dark:hover:bg-emerald-950/35"><RefreshCcw size={16} />File another report</button>
                    </div>
                  </SurfaceCard>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <SurfaceCard>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Live Authority Match</div>
                  <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">{reportAuthority ?? 'Waiting for road ownership lookup'}</h2>
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800/80 dark:bg-slate-950/55 dark:text-slate-100">{contextLoading ? <Loader2 size={18} className="animate-spin" /> : <ShieldAlert size={18} />}</div>
              </div>
              {contextError ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-400/20 dark:bg-[linear-gradient(180deg,rgba(245,158,11,0.14),rgba(120,53,15,0.16))] dark:text-amber-100">{contextError}</div> : null}
              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/70">
                <div className="flex items-start justify-between gap-4 py-2"><div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Road</div><div className="max-w-[65%] text-right text-sm font-semibold text-slate-800 dark:text-slate-100">{[reportRoadNumber, reportRoadName].filter(Boolean).join(' - ') || reportType || 'Not available'}</div></div>
                <div className="flex items-start justify-between gap-4 py-2"><div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Authority</div><div className="max-w-[65%] text-right text-sm font-semibold text-slate-800 dark:text-slate-100">{reportAuthority ?? 'Not available'}</div></div>
                <div className="flex items-start justify-between gap-4 py-2"><div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Helpline</div><div className="max-w-[65%] text-right text-sm font-semibold text-slate-800 dark:text-slate-100">{helpline ? <a href={`tel:${helpline}`} className="text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-blue-500 dark:text-blue-300">{helpline}</a> : 'Not available'}</div></div>
                <div className="flex items-start justify-between gap-4 py-2"><div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Portal</div><div className="max-w-[65%] text-right text-sm font-semibold text-slate-800 dark:text-slate-100">{portalUrl ? <a href={portalUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-blue-500 dark:text-blue-300">Open official complaint portal</a> : 'Portal not listed'}</div></div>
                <div className="flex items-start justify-between gap-4 py-2"><div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Escalation</div><div className="max-w-[65%] text-right text-sm font-semibold text-slate-800 dark:text-slate-100">{authorityPreview?.escalationPath ?? 'Not available'}</div></div>
                <div className="flex items-start justify-between gap-4 py-2"><div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Executive engineer</div><div className="max-w-[65%] text-right text-sm font-semibold text-slate-800 dark:text-slate-100">{authorityPreview?.execEngineer ?? infrastructure?.execEngineer ?? 'Not available'}</div></div>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Road Asset Intelligence</div>
                  <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">{reportRoadNumber ?? reportRoadName ?? 'Infrastructure metadata pending'}</h2>
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800/80 dark:bg-slate-950/55 dark:text-slate-100"><MapPin size={18} /></div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-950/45"><div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Road type</div><div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{reportType ?? 'Waiting for live match'}</div></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-950/45"><div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Contractor</div><div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{infrastructure?.contractorName ?? submittedReport?.contractorName ?? 'Not published'}</div></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-950/45"><div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Budget sanctioned</div><div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatMoney(submittedReport?.budgetSanctioned ?? infrastructure?.budgetSanctioned ?? null)}</div></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-950/45"><div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Next maintenance</div><div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{submittedReport?.nextMaintenance ?? infrastructure?.nextMaintenance ?? authorityPreview?.nextMaintenance ?? 'Not scheduled'}</div></div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="border-slate-200/80 bg-slate-100/80 dark:border-slate-800/80 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(30,41,59,0.7))]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900"><AlertTriangle size={18} /></div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Enterprise note</div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">This page is now using live GPS, live authority matching, live road infrastructure data, and the real RoadWatch report endpoint. If location still looks wrong, the device or browser geolocation provider itself is returning an incorrect fix.</p>
                </div>
              </div>
            </SurfaceCard>
          </section>
        </div>
      </main>

      <div className="fixed right-4 top-[92px] z-30 flex flex-col gap-3 lg:right-8">
        <button type="button" onClick={refresh} className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/75 text-slate-700 shadow-[0_20px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:text-blue-700 dark:border-slate-800/80 dark:bg-slate-950/80 dark:text-slate-100 dark:shadow-[0_20px_40px_rgba(2,6,23,0.4)]" aria-label="Refresh live location">
          {locating ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />}
        </button>
      </div>

      <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-4 z-30 lg:hidden">
        <Link href="/locator" className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/85 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-800 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80 dark:text-slate-100">
          <Mic size={16} />Nearby help
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}

