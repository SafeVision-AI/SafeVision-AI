'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { logClientError } from '@/lib/client-logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientError('App route error boundary caught an error', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0A0E14] text-slate-100 flex items-center justify-center px-6">
      <section className="w-full max-w-xl border border-red-500/25 bg-red-950/20 rounded-lg p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="mt-1 rounded-full bg-red-500/15 p-3 text-red-300">
            <AlertTriangle aria-hidden="true" size={24} />
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-red-200/70">System Recovery</p>
            <h1 className="text-2xl font-black tracking-tight">SafeVixAI hit a recoverable error</h1>
            <p className="text-sm leading-6 text-slate-300">
              The current screen failed to render safely. Your emergency shortcuts remain available from the home screen.
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-slate-500">Digest: {error.digest}</p>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-red-400 px-4 text-sm font-bold text-[#0A0E14] transition hover:bg-red-300"
              >
                <RefreshCw aria-hidden="true" size={16} />
                Retry
              </button>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-700 px-4 text-sm font-bold text-slate-100 transition hover:bg-white/10"
              >
                <Home aria-hidden="true" size={16} />
                Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
