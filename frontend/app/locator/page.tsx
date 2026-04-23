'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ArrowLeft,
  Flame,
  Loader2,
  MapPin,
  Menu,
  Mic,
  Moon,
  Navigation,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Siren,
  Sun,
  Truck,
  Wrench,
} from 'lucide-react';

import { EmergencyMap } from '@/components/EmergencyMap';
import { useTheme } from '@/components/ThemeProvider';
import BottomNav from '@/components/dashboard/BottomNav';
import DashboardMapBootstrap from '@/components/dashboard/DashboardMapBootstrap';
import SystemSidebar from '@/components/dashboard/SystemSidebar';
import TopSearch from '@/components/dashboard/TopSearch';
import SystemHeader from '@/components/dashboard/SystemHeader';
import { fetchRoutePreview, RouteOption, RoutePreviewResponse } from '@/lib/api';
import { formatLocationSubtitle } from '@/lib/location-utils';
import { FALLBACK_MAP_CENTER } from '@/lib/map-defaults';
import { NearbyService, ServiceSearchMeta, useAppStore } from '@/lib/store';

const DEFAULT_COORDS: [number, number] = FALLBACK_MAP_CENTER;

const FILTER_CHIPS = ['All', 'Hospital', 'Police', 'Fire', 'Mechanic', 'Towing'] as const;
type Filter = typeof FILTER_CHIPS[number];

type ServiceCardType =
  | 'Hospital'
  | 'Ambulance'
  | 'Pharmacy'
  | 'Police'
  | 'Fire'
  | 'Mechanic'
  | 'Towing';

interface LocatorService {
  id: string;
  name: string;
  type: ServiceCardType;
  filterType: Exclude<Filter, 'All'>;
  distance: string;
  address: string;
  accentColor: string;
  coords: [number, number];
  phone?: string;
  category: NearbyService['category'];
}

function formatDistance(distance: number) {
  return distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`;
}

function formatCoverageRadius(distance: number) {
  return distance >= 1000 ? `${Math.round(distance / 1000)} km` : `${Math.round(distance)} m`;
}

function buildNavigationHref(origin: [number, number], destination: [number, number]) {
  const params = new URLSearchParams({
    api: '1',
    origin: `${origin[0]},${origin[1]}`,
    destination: `${destination[0]},${destination[1]}`,
    travelmode: 'driving',
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function formatDuration(seconds: number) {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

function haversineMeters(from: [number, number], to: [number, number]) {
  const earthRadiusMeters = 6_371_000;
  const [fromLat, fromLon] = from;
  const [toLat, toLon] = to;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLon = ((toLon - fromLon) * Math.PI) / 180;
  const fromLatRad = (fromLat * Math.PI) / 180;
  const toLatRad = (toLat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.min(1, Math.sqrt(a)));
}

function minimumRouteDeviationMeters(route: RouteOption, location: [number, number]) {
  if (!route.path.length) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.min(
    ...route.path.map((point) => haversineMeters(location, [point.lat, point.lon]))
  );
}

function mapService(service: NearbyService): LocatorService {
  switch (service.category) {
    case 'hospital':
      return {
        id: service.id,
        name: service.name,
        type: 'Hospital',
        filterType: 'Hospital',
        distance: formatDistance(service.distance),
        address: service.address ?? 'Address unavailable',
        accentColor: '#ef4444',
        coords: [service.lat, service.lon],
        phone: service.phone,
        category: service.category,
      };
    case 'ambulance':
      return {
        id: service.id,
        name: service.name,
        type: 'Ambulance',
        filterType: 'Hospital',
        distance: formatDistance(service.distance),
        address: service.address ?? 'Address unavailable',
        accentColor: '#10b981',
        coords: [service.lat, service.lon],
        phone: service.phone,
        category: service.category,
      };
    case 'pharmacy':
      return {
        id: service.id,
        name: service.name,
        type: 'Pharmacy',
        filterType: 'Hospital',
        distance: formatDistance(service.distance),
        address: service.address ?? 'Address unavailable',
        accentColor: '#06b6d4',
        coords: [service.lat, service.lon],
        phone: service.phone,
        category: service.category,
      };
    case 'police':
      return {
        id: service.id,
        name: service.name,
        type: 'Police',
        filterType: 'Police',
        distance: formatDistance(service.distance),
        address: service.address ?? 'Address unavailable',
        accentColor: '#3b82f6',
        coords: [service.lat, service.lon],
        phone: service.phone,
        category: service.category,
      };
    case 'fire':
      return {
        id: service.id,
        name: service.name,
        type: 'Fire',
        filterType: 'Fire',
        distance: formatDistance(service.distance),
        address: service.address ?? 'Address unavailable',
        accentColor: '#f97316',
        coords: [service.lat, service.lon],
        phone: service.phone,
        category: service.category,
      };
    case 'towing':
      return {
        id: service.id,
        name: service.name,
        type: 'Towing',
        filterType: 'Towing',
        distance: formatDistance(service.distance),
        address: service.address ?? 'Address unavailable',
        accentColor: '#f59e0b',
        coords: [service.lat, service.lon],
        phone: service.phone,
        category: service.category,
      };
    case 'puncture':
    case 'showroom':
    default:
      return {
        id: service.id,
        name: service.name,
        type: 'Mechanic',
        filterType: 'Mechanic',
        distance: formatDistance(service.distance),
        address: service.address ?? 'Address unavailable',
        accentColor: '#8b5cf6',
        coords: [service.lat, service.lon],
        phone: service.phone,
        category: service.category,
      };
  }
}

function fallbackNumber(type: Exclude<Filter, 'All'>) {
  switch (type) {
    case 'Hospital':
      return '108';
    case 'Police':
      return '100';
    case 'Fire':
      return '101';
    case 'Mechanic':
    case 'Towing':
    default:
      return '1033';
  }
}

const ServiceIcon = ({ type, className }: { type: ServiceCardType; className?: string }) => {
  switch (type) {
    case 'Hospital':
      return <Activity className={className} />;
    case 'Ambulance':
      return <Siren className={className} />;
    case 'Pharmacy':
      return <Activity className={className} />;
    case 'Police':
      return <Shield className={className} />;
    case 'Fire':
      return <Flame className={className} />;
    case 'Towing':
      return <Truck className={className} />;
    case 'Mechanic':
    default:
      return <Wrench className={className} />;
  }
};

function EmptyState({
  locating,
  activeFilter,
  searchMeta,
}: {
  locating: boolean;
  activeFilter: Filter;
  searchMeta: ServiceSearchMeta;
}) {
  const expandedBeyondDefault = searchMeta.radiusUsed > 5000;
  const hasNearbyServicesInOtherFilters = activeFilter !== 'All' && searchMeta.count > 0;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#1a2133]/40 backdrop-blur-xl p-6 text-center">
      <h3 className="text-base font-black text-slate-900 dark:text-[#d7e3fc]">
        {locating ? 'Locating nearby services...' : 'No services found for this filter'}
      </h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {locating
          ? 'Once the live backend responds, emergency resources will appear here.'
          : hasNearbyServicesInOtherFilters
            ? `We found nearby resources within ${formatCoverageRadius(searchMeta.radiusUsed)}, but none matched the ${activeFilter.toLowerCase()} filter.`
            : expandedBeyondDefault
              ? `Search widened to ${formatCoverageRadius(searchMeta.radiusUsed)} and still found no matching services. Try refreshing your location or switching filters.`
              : 'Try switching the filter or refreshing your location.'}
      </p>
    </div>
  );
}

function RouteStatusCard({
  activeRoute,
  activeRouteOption,
  routeError,
  loadingLabel,
  selectedServiceName,
  navigationHref,
  selectedRouteId,
  onSelectRoute,
  rerouting,
}: {
  activeRoute: RoutePreviewResponse | null;
  activeRouteOption: RouteOption | null;
  routeError: string | null;
  loadingLabel: string | null;
  selectedServiceName: string | null;
  navigationHref: string | null;
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  rerouting: boolean;
}) {
  if (!activeRoute && !routeError && !loadingLabel) {
    return null;
  }

  if (routeError) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-4 text-amber-900 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-600 dark:text-amber-300">
          Route Unavailable
        </div>
        <p className="mt-2 text-sm font-semibold">{routeError}</p>
      </div>
    );
  }

  if (loadingLabel) {
    return (
      <div className="rounded-lg border border-[#1A5C38]/20 bg-[#1A5C38]/8/90 p-4 shadow-sm dark:border-[#1A5C38]/20 dark:bg-[#1A5C38]/10">
        <div className="flex items-center gap-3 text-[#1A5C38] dark:text-[#00C896]">
          <Loader2 size={16} className="animate-spin" />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#1A5C38] dark:text-[#00C896]">
              Building Route
            </div>
            <p className="mt-1 text-sm font-semibold">Calculating the clearest drive to {loadingLabel}.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!activeRoute || !activeRouteOption) {
    return null;
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-300">
        {rerouting ? 'Rerouting' : 'Route Ready'}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-50">
        <span>{selectedServiceName ?? 'Destination selected'}</span>
        <span className="opacity-50">|</span>
        <span>{formatDuration(activeRouteOption.durationSeconds)}</span>
        <span className="opacity-50">|</span>
        <span>{formatDistance(activeRouteOption.distanceMeters)}</span>
      </div>
      <p className="mt-1 text-xs font-medium text-emerald-700/90 dark:text-emerald-100/80">
        Provider: {activeRoute.provider}
      </p>
      {activeRoute.warnings.length > 0 ? (
        <div className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/80 px-3 py-2 text-[11px] font-semibold text-amber-900 dark:border-amber-300/15 dark:bg-amber-500/10 dark:text-amber-100">
          {activeRoute.warnings[0]}
        </div>
      ) : null}
      {activeRoute.routes.length > 1 ? (
        <div className="mt-3">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700/70 dark:text-emerald-100/70">
            Route Options
          </div>
          <div className="flex flex-wrap gap-2">
            {activeRoute.routes.map((routeOption) => {
              const isSelected = selectedRouteId === routeOption.routeId;
              return (
                <button
                  key={routeOption.routeId}
                  type="button"
                  onClick={() => onSelectRoute(routeOption.routeId)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'border-emerald-200 bg-white/80 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-300/15 dark:bg-white/5 dark:text-emerald-100 dark:hover:bg-emerald-500/10'
                  }`}
                >
                  {routeOption.label} - {formatDuration(routeOption.durationSeconds)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="mt-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700/70 dark:text-emerald-100/70">
          Step-by-Step
        </div>
        <ol className="space-y-2">
          {activeRouteOption.steps.slice(0, 6).map((step) => (
            <li
              key={`${activeRouteOption.routeId}-${step.index}`}
              className="rounded-xl border border-emerald-200/70 bg-white/80 px-3 py-2 text-left dark:border-emerald-300/10 dark:bg-white/5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold text-white">
                  {step.index}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-emerald-950 dark:text-emerald-50">
                    {step.instruction}
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-emerald-800/80 dark:text-emerald-100/70">
                    {[step.streetName, formatDistance(step.distanceMeters), formatDuration(step.durationSeconds)]
                      .filter(Boolean)
                      .join(' - ')}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
      {navigationHref ? (
        <a
          href={navigationHref}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800 transition hover:border-emerald-500 hover:bg-emerald-100 dark:border-emerald-300/15 dark:bg-white/5 dark:text-emerald-100 dark:hover:bg-emerald-500/10"
        >
          <Navigation size={14} />
          Open External Navigation
        </a>
      ) : null}
    </div>
  );
}

function MobileLocator({
  coords,
  currentLocation,
  address,
  filtered,
  locating,
  serviceSearchMeta,
  coverageSummary,
  activeFilter,
  setActiveFilter,
  activeRoute,
  activeRouteOption,
  alternativeRoutes,
  routeError,
  routeLoadingId,
  selectedServiceId,
  selectedServiceName,
  navigationHref,
  selectedRouteId,
  rerouting,
  onLocateService,
  onSelectRoute,
  onPreviewService,
}: {
  coords: [number, number];
  currentLocation: {
    lat: number;
    lon: number;
    accuracy: number;
    displayName?: string;
  } | null;
  address: string;
  filtered: LocatorService[];
  locating: boolean;
  serviceSearchMeta: ServiceSearchMeta;
  coverageSummary: string;
  activeFilter: Filter;
  setActiveFilter: (filter: Filter) => void;
  activeRoute: RoutePreviewResponse | null;
  activeRouteOption: RouteOption | null;
  alternativeRoutes: RouteOption[];
  routeError: string | null;
  routeLoadingId: string | null;
  selectedServiceId: string | null;
  selectedServiceName: string | null;
  navigationHref: string | null;
  selectedRouteId: string | null;
  rerouting: boolean;
  onLocateService: (service: LocatorService) => void;
  onSelectRoute: (routeId: string) => void;
  onPreviewService: (service: LocatorService) => void;
}) {
  const locationIsApproximate = Boolean(currentLocation && currentLocation.accuracy >= 2500);
  const currentLocationAccuracy = currentLocation
    ? currentLocation.accuracy >= 1000
      ? `${(currentLocation.accuracy / 1000).toFixed(1)} km accuracy`
      : `${Math.round(currentLocation.accuracy)} m accuracy`
    : null;

  return (
    <div className="min-h-dvh pb-48 bg-slate-50 dark:bg-[#0D1117] text-slate-900 dark:text-[#d7e3fc] font-['Inter'] selection:bg-[#1A5C38]/80/30 relative overflow-x-hidden w-full">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      <SystemHeader title="Emergency Resource Dispatch" showBack={false} />
      
      <div className="lg:hidden relative z-[100]">
        <TopSearch isMapPage={true} forceShow={true} showBack={false} />
      </div>
      <BottomNav />

      <div className="pt-24 lg:pt-0 px-5 flex items-center justify-between relative z-10 hide-on-short-screen">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 font-black tracking-tight text-xl font-space uppercase">
            Emergency Locator
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-[#00C896] font-bold opacity-80 mt-1 tracking-wider uppercase">
            {address} - {coverageSummary}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Live HUD
          </span>
        </div>
      </div>

      <main className="relative z-10 pt-4 pb-40 w-full">
        <section className="relative h-[440px] w-full px-4 border-b border-slate-200 dark:border-white/5 overflow-hidden">
          <div className="relative h-full w-full rounded-lg overflow-hidden bg-slate-200 dark:bg-[#030e20] border border-slate-200 dark:border-white/10 shadow-2xl">
            <div className="absolute inset-0 z-0">
              <EmergencyMap
                center={coords}
                facilities={filtered.map((service) => ({
                  id: service.id,
                  name: service.name,
                  coords: service.coords,
                  type: service.type,
                  accentColor: service.accentColor,
                  distance: service.distance,
                }))}
                route={
                  activeRouteOption
                    ? {
                      routeId: activeRouteOption.routeId,
                      label: activeRouteOption.label,
                      path: activeRouteOption.path,
                      distanceMeters: activeRouteOption.distanceMeters,
                      durationSeconds: activeRouteOption.durationSeconds,
                    }
                    : null
                }
                alternativeRoutes={alternativeRoutes}
                currentLocation={
                  currentLocation
                    ? {
                        lat: currentLocation.lat,
                        lon: currentLocation.lon,
                        accuracy: currentLocation.accuracy,
                        title: 'Current location',
                        subtitle: currentLocation.displayName ?? address,
                      }
                    : null
                }
                selectedFacilityId={selectedServiceId}
              />
            </div>
            <div className="absolute inset-0 pointer-events-none bg-slate-900/5 dark:bg-slate-900/10 mix-blend-color z-10" />
          </div>
        </section>

        <section className="mt-6 px-4 relative">
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-50 dark:from-[#0D1117] to-transparent z-20 pointer-events-none" />

          <div className="flex overflow-x-auto gap-3 pb-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-12">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setActiveFilter(chip)}
                aria-label={`Filter by ${chip}`}
                className={`flex-none px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${activeFilter === chip
                    ? 'bg-[#1A5C38] text-white shadow-lg shadow-[#1A5C38]/30 ring-1 ring-white/20'
                    : 'bg-white dark:bg-[#1a2133]/60 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 shadow-sm'
                  }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-2 px-4 space-y-4">
          <RouteStatusCard
            activeRoute={activeRoute}
            activeRouteOption={activeRouteOption}
            routeError={routeError}
            loadingLabel={filtered.find((service) => service.id === routeLoadingId)?.name ?? null}
            selectedServiceName={selectedServiceName}
            navigationHref={navigationHref}
            selectedRouteId={selectedRouteId}
            onSelectRoute={onSelectRoute}
            rerouting={rerouting}
          />
          {locationIsApproximate && currentLocationAccuracy ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-amber-900 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-600 dark:text-amber-300">
                Approximate Location
              </div>
              <p className="mt-1 text-sm font-semibold">
                Your browser is giving an approximate fix ({currentLocationAccuracy}). Live routes may be offset until precise GPS settles.
              </p>
            </div>
          ) : null}
          {filtered.length === 0 ? (
            <EmptyState
              locating={locating}
              activeFilter={activeFilter}
              searchMeta={serviceSearchMeta}
            />
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((service) => (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`group relative rounded-lg p-5 backdrop-blur-xl shadow-sm transition-all ${selectedServiceId === service.id
                      ? 'border border-[#1A5C38]/30 bg-[#1A5C38]/8/90 dark:border-[#1A5C38]/40 dark:bg-[#0D1117]/70'
                      : 'border border-slate-200 bg-white/80 dark:border-white/5 dark:bg-[#1a2133]/40 hover:bg-white dark:hover:bg-[#1f283d]/60'
                    }`}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: service.accentColor }} />

                  <div className="flex justify-between items-start mb-5">
                    <div className="flex gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-inner"
                        style={{ color: service.accentColor }}
                      >
                        <ServiceIcon type={service.type} className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-slate-900 dark:text-[#d7e3fc] font-black text-base tracking-tight font-space">
                          {service.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin size={12} className="text-slate-400" />
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{service.address}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#1A5C38]/8 dark:bg-[#1A5C38]/10 px-3 py-1 rounded-lg border border-[#1A5C38]/20 dark:border-[#1A5C38]/20">
                      <span className="text-[10px] font-semibold text-[#1A5C38] dark:text-[#00C896] tracking-tight">{service.distance}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link href={`tel:${service.phone ?? fallbackNumber(service.filterType)}`} className="flex-1">
                      <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[12px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                        <Phone size={16} /> Call
                      </button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => onLocateService(service)}
                      className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[12px] uppercase tracking-widest transition-all hover:bg-slate-100 dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={routeLoadingId === service.id}
                    >
                      {routeLoadingId === service.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Routing
                        </>
                      ) : (
                        <>
                          <Navigation size={16} /> Locate
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onPreviewService(service)}
                      className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 py-3.5 rounded-xl flex items-center justify-center gap-2 font-black text-[12px] uppercase tracking-widest transition-all hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      <Search size={16} /> Focus
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </section>
      </main>
    </div>
  );
}

function DesktopLocator({
  coords,
  currentLocation,
  address,
  filtered,
  locating,
  serviceSearchMeta,
  coverageSummary,
  activeFilter,
  setActiveFilter,
  activeRoute,
  activeRouteOption,
  alternativeRoutes,
  routeError,
  routeLoadingId,
  selectedServiceId,
  selectedServiceName,
  navigationHref,
  selectedRouteId,
  rerouting,
  onLocateService,
  onSelectRoute,
  onPreviewService,
}: {
  coords: [number, number];
  currentLocation: {
    lat: number;
    lon: number;
    accuracy: number;
    displayName?: string;
  } | null;
  address: string;
  filtered: LocatorService[];
  locating: boolean;
  serviceSearchMeta: ServiceSearchMeta;
  coverageSummary: string;
  activeFilter: Filter;
  setActiveFilter: (filter: Filter) => void;
  activeRoute: RoutePreviewResponse | null;
  activeRouteOption: RouteOption | null;
  alternativeRoutes: RouteOption[];
  routeError: string | null;
  routeLoadingId: string | null;
  selectedServiceId: string | null;
  selectedServiceName: string | null;
  navigationHref: string | null;
  selectedRouteId: string | null;
  rerouting: boolean;
  onLocateService: (service: LocatorService) => void;
  onSelectRoute: (routeId: string) => void;
  onPreviewService: (service: LocatorService) => void;
}) {
  const locationIsApproximate = Boolean(currentLocation && currentLocation.accuracy >= 2500);
  const currentLocationAccuracy = currentLocation
    ? currentLocation.accuracy >= 1000
      ? `${(currentLocation.accuracy / 1000).toFixed(1)} km accuracy`
      : `${Math.round(currentLocation.accuracy)} m accuracy`
    : null;
  const setSystemSidebarOpen = useAppStore((state) => state.setSystemSidebarOpen);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full h-dvh bg-slate-50 dark:bg-[#0D1117] text-slate-900 dark:text-[#dae6ff] font-['Inter'] relative overflow-hidden flex flex-col">
      <SystemHeader title="Emergency Resource Dispatch" showBack={false} />

      <main className="flex-1 flex w-full relative z-0 overflow-hidden lg:mt-0">
        <section className="flex-1 h-full relative overflow-hidden bg-slate-200 dark:bg-[#061327] border-r border-slate-200 dark:border-white/5">
          <div className="absolute top-20 left-6 right-6 z-20 flex justify-center">
            <div className="flex gap-1 bg-white/90 dark:bg-[#0A0E14]/80 backdrop-blur-2xl p-1.5 rounded-lg border border-slate-200 dark:border-white/10 shadow-2xl overflow-x-auto [scrollbar-width:none]">
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setActiveFilter(chip)}
                  className={`px-3 lg:px-5 py-2.5 rounded-xl font-black text-[8px] lg:text-[9px] uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === chip
                      ? 'bg-[#1A5C38] text-white shadow-xl'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="absolute inset-0 z-0">
            <EmergencyMap
              center={coords}
              facilities={filtered.map((service) => ({
                id: service.id,
                name: service.name,
                coords: service.coords,
                type: service.type,
                accentColor: service.accentColor,
                distance: service.distance,
              }))}
              route={
                activeRouteOption
                  ? {
                    routeId: activeRouteOption.routeId,
                    label: activeRouteOption.label,
                    path: activeRouteOption.path,
                    distanceMeters: activeRouteOption.distanceMeters,
                    durationSeconds: activeRouteOption.durationSeconds,
                  }
                  : null
              }
              alternativeRoutes={alternativeRoutes}
              currentLocation={
                currentLocation
                  ? {
                      lat: currentLocation.lat,
                      lon: currentLocation.lon,
                      accuracy: currentLocation.accuracy,
                      title: 'Current location',
                      subtitle: currentLocation.displayName ?? address,
                    }
                  : null
              }
              selectedFacilityId={selectedServiceId}
            />
            <div className="absolute inset-0 pointer-events-none bg-slate-900/5 dark:bg-black/20 mix-blend-color z-10" />
          </div>

          <div className="absolute bottom-8 left-8 z-20 bg-white/90 dark:bg-[#0D1117]/90 backdrop-blur-md p-4 rounded-lg border border-slate-200 dark:border-white/10 shadow-xl min-w-[180px] hidden lg:block">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Telemetry Active</span>
            </div>
            <div className="text-sm font-semibold text-slate-800 dark:text-[#00C896] tracking-tight">{address}</div>
            <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{coverageSummary}</div>
          </div>
        </section>

        <section className="w-[300px] lg:w-[340px] xl:w-[360px] h-full bg-white dark:bg-[#0D1117] flex flex-col z-20 shadow-2xl overflow-hidden shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)] border-l border-slate-200 dark:border-white/5">
          <div className="p-6 lg:p-8 pb-4 shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#1A5C38] flex items-center justify-center shadow-lg shadow-[#1A5C38]/20 shrink-0">
                <MapPin className="text-white w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#1A5C38] dark:text-[#00C896] whitespace-nowrap">
                  Locator Subsystem
                </h2>
                <h1 className="text-xl lg:text-2xl font-black tracking-tight text-slate-800 dark:text-white leading-none truncate">
                  Emergency Resources
                </h1>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs lg:text-sm font-medium">
              Found {filtered.length} priority facilities across {coverageSummary.toLowerCase()}.
            </p>
            <div className="mt-4">
              <RouteStatusCard
                activeRoute={activeRoute}
                activeRouteOption={activeRouteOption}
                routeError={routeError}
                loadingLabel={filtered.find((service) => service.id === routeLoadingId)?.name ?? null}
                selectedServiceName={selectedServiceName}
                navigationHref={navigationHref}
                selectedRouteId={selectedRouteId}
                onSelectRoute={onSelectRoute}
                rerouting={rerouting}
              />
              {locationIsApproximate && currentLocationAccuracy ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-amber-900 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-600 dark:text-amber-300">
                    Approximate Location
                  </div>
                  <p className="mt-1 text-sm font-semibold">
                    The browser is reporting an approximate fix ({currentLocationAccuracy}). If this still shows Chennai, the device or browser geolocation itself is returning Chennai-area coordinates.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-4 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filtered.length === 0 ? (
              <EmptyState
                locating={locating}
                activeFilter={activeFilter}
                searchMeta={serviceSearchMeta}
              />
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map((service) => (
                  <motion.div
                    key={service.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`group rounded-lg p-5 lg:p-6 transition-all ${selectedServiceId === service.id
                        ? 'border border-[#1A5C38]/30 bg-[#1A5C38]/8 dark:border-[#1A5C38]/40 dark:bg-[#0D1117]/70'
                        : 'border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/5 dark:bg-[#152640]/40 dark:hover:bg-[#1a2c48]/60'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4 lg:gap-5">
                        <div
                          className="w-12 h-12 lg:w-14 lg:h-14 rounded-lg shrink-0 flex items-center justify-center bg-white dark:bg-[#030e20] shadow-sm border border-slate-100 dark:border-white/10"
                          style={{ color: service.accentColor }}
                        >
                          <ServiceIcon type={service.type} className="w-6 h-6 lg:w-7 lg:h-7" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[8px] lg:text-[9px] font-semibold uppercase tracking-[0.1em] mb-1 block opacity-70" style={{ color: service.accentColor }}>
                            {service.type}
                          </span>
                          <h3 className="text-base lg:text-xl font-bold text-slate-800 dark:text-[#dae6ff] truncate">{service.name}</h3>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <Navigation size={12} className="text-slate-400" />
                              <span className="text-[10px] lg:text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                {service.distance}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{service.address}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Link href={`tel:${service.phone ?? fallbackNumber(service.filterType)}`} className="flex-1">
                        <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 rounded-xl text-[9px] lg:text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                          <Phone size={14} /> Call
                        </button>
                      </Link>
                      <button
                        type="button"
                        onClick={() => onLocateService(service)}
                        className="px-4 py-2.5 rounded-xl bg-[#1A5C38] text-white font-bold text-[9px] lg:text-[10px] uppercase tracking-widest hover:bg-[#1A5C38]/80 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
                        disabled={routeLoadingId === service.id}
                      >
                        {routeLoadingId === service.id ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Routing
                          </>
                        ) : (
                          <>
                            <Navigation size={12} /> Locate
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onPreviewService(service)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold text-[9px] lg:text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5"
                      >
                        Focus
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="p-6 lg:p-8 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 shrink-0">
            {[
              { n: '112', l: 'SOS' },
              { n: '108', l: 'MED' },
              { n: '100', l: 'POL' },
              { n: '101', l: 'FIRE' },
            ].map((dial) => (
              <button key={dial.n} className="flex flex-col items-center justify-center py-3 lg:py-4 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 hover:border-[#1A5C38]/50 transition-all group">
                <span className="text-base lg:text-lg font-black text-slate-800 dark:text-white group-hover:text-[#1A5C38] dark:text-[#00C896]">{dial.n}</span>
                <span className="text-[7px] lg:text-[8px] font-bold text-slate-400 uppercase tracking-widest">{dial.l}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function LocatorPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<RoutePreviewResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [routeLoadingId, setRouteLoadingId] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [rerouting, setRerouting] = useState(false);
  const lastRerouteAtRef = useRef(0);
  const lastRerouteLocationRef = useRef<[number, number] | null>(null);
  const { gpsError, gpsLocation, nearbyServices, serviceSearchMeta } = useAppStore((state) => ({
    gpsError: state.gpsError,
    gpsLocation: state.gpsLocation,
    nearbyServices: state.nearbyServices,
    serviceSearchMeta: state.serviceSearchMeta,
  }));

  const coords: [number, number] = gpsLocation ? [gpsLocation.lat, gpsLocation.lon] : DEFAULT_COORDS;

  const address = gpsError
    ? 'Location access needed'
    : gpsLocation
      ? formatLocationSubtitle(gpsLocation)
      : 'Enable location for live directions';
  const coverageSummary =
    serviceSearchMeta.radiusUsed > 0
      ? `${formatCoverageRadius(serviceSearchMeta.radiusUsed)} coverage`
      : `${formatCoverageRadius(5000)} coverage`;

  const locating = !gpsLocation && !gpsError;

  const services = useMemo(() => nearbyServices.map(mapService), [nearbyServices]);

  const filtered = useMemo(
    () => services.filter((service) => activeFilter === 'All' || service.filterType === activeFilter),
    [activeFilter, services]
  );

  const selectedService = useMemo(
    () => filtered.find((service) => service.id === selectedServiceId) ?? null,
    [filtered, selectedServiceId]
  );
  const activeRouteOption = useMemo(
    () => activeRoute?.routes.find((route) => route.routeId === selectedRouteId) ?? activeRoute?.routes[0] ?? null,
    [activeRoute, selectedRouteId]
  );
  const alternativeRoutes = useMemo(
    () => activeRoute?.routes.filter((route) => route.routeId !== activeRouteOption?.routeId) ?? [],
    [activeRoute, activeRouteOption?.routeId]
  );
  const navigationHref =
    gpsLocation && selectedService
      ? buildNavigationHref(
          [gpsLocation.lat, gpsLocation.lon],
          selectedService.coords,
        )
      : null;

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedServiceId(null);
      setActiveRoute(null);
      setSelectedRouteId(null);
      return;
    }

    if (!selectedServiceId || !filtered.some((service) => service.id === selectedServiceId)) {
      setSelectedServiceId(filtered[0].id);
      setActiveRoute(null);
      setSelectedRouteId(null);
    }
  }, [filtered, selectedServiceId]);

  useEffect(() => {
    if (!activeRoute) {
      return;
    }

    if (!selectedRouteId || !activeRoute.routes.some((route) => route.routeId === selectedRouteId)) {
      setSelectedRouteId(activeRoute.selectedRouteId);
    }
  }, [activeRoute, selectedRouteId]);

  useEffect(() => {
    if (!gpsLocation) {
      return;
    }

    setActiveRoute(null);
    setSelectedRouteId(null);
  }, [gpsLocation]);

  function extractRouteError(error: unknown) {
    if (typeof error === 'object' && error !== null) {
      const maybeResponse = error as { response?: { data?: { detail?: string } }; message?: string };
      if (typeof maybeResponse.response?.data?.detail === 'string') {
        return maybeResponse.response.data.detail;
      }
      if (typeof maybeResponse.message === 'string') {
        return maybeResponse.message;
      }
    }
    return 'Unable to calculate the route right now.';
  }

  function handlePreviewService(service: LocatorService) {
    setSelectedServiceId(service.id);
    setRouteError(null);
    if (activeRoute && selectedServiceId !== service.id) {
      setActiveRoute(null);
      setSelectedRouteId(null);
    }
  }

  async function handleLocateService(service: LocatorService) {
    setSelectedServiceId(service.id);
    setRouteError(null);

    if (!gpsLocation) {
      setActiveRoute(null);
      setRouteLoadingId(null);
      setRouteError('Enable location to calculate a road-aware route from your current position.');
      return;
    }

    setRouteLoadingId(service.id);
    try {
      const route = await fetchRoutePreview({
        originLat: gpsLocation.lat,
        originLon: gpsLocation.lon,
        destinationLat: service.coords[0],
        destinationLon: service.coords[1],
        profile: 'driving-car',
        alternatives: 2,
      });
      setActiveRoute(route);
      setSelectedRouteId(route.selectedRouteId);
      lastRerouteAtRef.current = Date.now();
      lastRerouteLocationRef.current = [gpsLocation.lat, gpsLocation.lon];
    } catch (error) {
      setActiveRoute(null);
      setSelectedRouteId(null);
      setRouteError(extractRouteError(error));
    } finally {
      setRouteLoadingId(null);
    }
  }

  function handleSelectRoute(routeId: string) {
    setSelectedRouteId(routeId);
  }

  useEffect(() => {
    if (!gpsLocation || !selectedService || !activeRoute || !activeRouteOption || routeLoadingId || rerouting) {
      return;
    }

    const currentLocation: [number, number] = [gpsLocation.lat, gpsLocation.lon];
    const lastRerouteLocation = lastRerouteLocationRef.current;
    const now = Date.now();
    const movedSinceLastReroute = lastRerouteLocation
      ? haversineMeters(currentLocation, lastRerouteLocation)
      : 0;
    const deviation = minimumRouteDeviationMeters(activeRouteOption, currentLocation);

    if (deviation < activeRoute.rerouteThresholdMeters || movedSinceLastReroute < 90 || now - lastRerouteAtRef.current < 15_000) {
      return;
    }

    let cancelled = false;
    setRerouting(true);
    setRouteError(null);

    fetchRoutePreview({
      originLat: gpsLocation.lat,
      originLon: gpsLocation.lon,
      destinationLat: selectedService.coords[0],
      destinationLon: selectedService.coords[1],
      profile: 'driving-car',
      alternatives: 2,
    })
      .then((route) => {
        if (cancelled) {
          return;
        }
        setActiveRoute(route);
        setSelectedRouteId(route.selectedRouteId);
        lastRerouteAtRef.current = Date.now();
        lastRerouteLocationRef.current = currentLocation;
      })
      .catch((error) => {
        if (!cancelled) {
          setRouteError(extractRouteError(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRerouting(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeRoute, activeRouteOption, gpsLocation, rerouting, routeLoadingId, selectedService]);

  return (
    <div className="w-full h-full min-h-dvh flex flex-col overflow-hidden">
      <DashboardMapBootstrap />
      <SystemSidebar />

      <div className="lg:hidden flex-1 flex flex-col">
        <MobileLocator
          coords={coords}
          currentLocation={gpsLocation}
          address={address}
          filtered={filtered}
          locating={locating}
          serviceSearchMeta={serviceSearchMeta}
          coverageSummary={coverageSummary}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          activeRoute={activeRoute}
          activeRouteOption={activeRouteOption}
          alternativeRoutes={alternativeRoutes}
          routeError={routeError}
          routeLoadingId={routeLoadingId}
          selectedServiceId={selectedServiceId}
          selectedServiceName={selectedService?.name ?? null}
          navigationHref={navigationHref}
          selectedRouteId={selectedRouteId}
          rerouting={rerouting}
          onLocateService={handleLocateService}
          onSelectRoute={handleSelectRoute}
          onPreviewService={handlePreviewService}
        />
      </div>

      <div className="hidden lg:flex flex-1 flex-col h-full overflow-hidden">
        <DesktopLocator
          coords={coords}
          currentLocation={gpsLocation}
          address={address}
          filtered={filtered}
          locating={locating}
          serviceSearchMeta={serviceSearchMeta}
          coverageSummary={coverageSummary}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          activeRoute={activeRoute}
          activeRouteOption={activeRouteOption}
          alternativeRoutes={alternativeRoutes}
          routeError={routeError}
          routeLoadingId={routeLoadingId}
          selectedServiceId={selectedServiceId}
          selectedServiceName={selectedService?.name ?? null}
          navigationHref={navigationHref}
          selectedRouteId={selectedRouteId}
          rerouting={rerouting}
          onLocateService={handleLocateService}
          onSelectRoute={handleSelectRoute}
          onPreviewService={handlePreviewService}
        />
      </div>
    </div>
  );
}

