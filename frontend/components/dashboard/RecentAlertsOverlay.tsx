'use client';

import React from 'react';

import { useAppStore } from '@/lib/store';

function getAlertVisual(issueType: string, severity: number) {
  const normalized = issueType.toLowerCase();

  if (severity >= 4) {
    return {
      icon: 'warning',
      iconClass: 'text-[#ff5545]',
      borderClass: 'border-red-500/30',
    };
  }

  if (normalized.includes('flood') || normalized.includes('rain')) {
    return {
      icon: 'rainy',
      iconClass: 'text-[#1A5C38] dark:text-[#00C896]',
      borderClass: 'border-[#1A5C38]/30',
    };
  }

  if (normalized.includes('traffic') || normalized.includes('accident')) {
    return {
      icon: 'traffic',
      iconClass: 'text-orange-500',
      borderClass: 'border-orange-500/30',
    };
  }

  return {
    icon: 'report_problem',
    iconClass: 'text-amber-500',
    borderClass: 'border-amber-500/30',
  };
}

function formatIssueType(issueType: string) {
  return issueType
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function RecentAlertsOverlay() {
  const { isDesktopSidebarCollapsed, nearbyRoadIssues } = useAppStore((state) => ({
    isDesktopSidebarCollapsed: state.isDesktopSidebarCollapsed,
    nearbyRoadIssues: state.nearbyRoadIssues,
  }));

  const visibleIssues = nearbyRoadIssues.slice(0, 3);
  const summaryLabel =
    nearbyRoadIssues.length > 0
      ? `${nearbyRoadIssues.length} active alerts nearby`
      : 'No active alerts nearby';

  return (
    <div
      className={`fixed bottom-24 lg:bottom-4 left-0 w-full z-40 pointer-events-none pl-4 pr-20 flex flex-col items-center lg:pr-0 transition-all duration-300 ${isDesktopSidebarCollapsed ? 'lg:pl-[88px]' : 'lg:pl-[280px]'}`}
    >
      <div className="w-fit max-w-full pointer-events-auto flex flex-col gap-2">
        <div className="self-center bg-white/90 dark:bg-[#0D1117]/90 backdrop-blur-xl rounded-full px-4 py-1.5 border border-slate-200 dark:border-white/10 shadow-xl flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${nearbyRoadIssues.length > 0 ? 'bg-[#ff5545] animate-pulse shadow-[0_0_8px_rgba(255,85,69,0.8)]' : 'bg-emerald-500'}`}
          />
          <span className="text-[10px] font-semibold tracking-[0.1em] text-slate-700 dark:text-[#00C896] uppercase font-space">
            {summaryLabel}
          </span>
        </div>

        {visibleIssues.length > 0 ? (
          <div className="flex justify-center gap-3 overflow-x-auto pb-2 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth snap-x snap-mandatory">
            {visibleIssues.map((issue) => {
              const visual = getAlertVisual(issue.issueType, issue.severity);
              return (
                <div
                  key={issue.uuid}
                  className={`snap-center flex-shrink-0 bg-white/90 dark:bg-[#1a2133]/90 backdrop-blur-md rounded-full ${visual.borderClass} px-3 py-1.5 shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2a3548] transition-colors relative border`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${visual.iconClass}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {visual.icon}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-[#d7e3fc] truncate">
                    {formatIssueType(issue.issueType)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
