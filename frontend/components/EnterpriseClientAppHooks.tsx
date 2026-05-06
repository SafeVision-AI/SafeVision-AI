'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { triggerSos } from '@/lib/api'
import { startCrashDetection, stopCrashDetection } from '@/lib/crash-detection'
import { enqueueSOS, registerOfflineSyncListeners } from '@/lib/offline-sos-queue'
import { CRASH_COUNTDOWN_SECONDS, STANDARD_GRAVITY_MS2 } from '@/lib/safety-constants'
import { useAppStore } from '@/lib/store'

export function EnterpriseClientAppHooks() {
  const { crashDetectionEnabled, gpsLocation } = useAppStore((state) => ({
    crashDetectionEnabled: state.crashDetectionEnabled,
    gpsLocation: state.gpsLocation,
  }))
  const [crashCountdown, setCrashCountdown] = useState<{ force: number; remaining: number } | null>(null)
  const [dispatching, setDispatching] = useState(false)

  useEffect(() => {
    registerOfflineSyncListeners()
  }, [])

  useEffect(() => {
    if (!crashDetectionEnabled) return
    const handleCrashDetected = (force: number) => {
      setCrashCountdown({ force, remaining: CRASH_COUNTDOWN_SECONDS })
    }

    void startCrashDetection(handleCrashDetected)
    return () => stopCrashDetection(handleCrashDetected)
  }, [crashDetectionEnabled])

  useEffect(() => {
    if (!crashCountdown || dispatching) return
    if (crashCountdown.remaining <= 0) {
      const dispatchSos = async () => {
        if (!gpsLocation) {
          toast.error('Crash detected, but location is unavailable. Open SOS and share your location manually.', {
            duration: 8000,
            position: 'top-center',
          })
          setCrashCountdown(null)
          return
        }

        setDispatching(true)
        try {
          await triggerSos({ lat: gpsLocation.lat, lon: gpsLocation.lon })
          toast.success('Auto-SOS dispatched with your current location.', {
            duration: 8000,
            position: 'top-center',
          })
        } catch {
          await enqueueSOS({ lat: gpsLocation.lat, lon: gpsLocation.lon })
          toast.error('Network unavailable. SOS saved offline and will retry automatically.', {
            duration: 8000,
            position: 'top-center',
          })
        } finally {
          setDispatching(false)
          setCrashCountdown(null)
        }
      }
      void dispatchSos()
      return
    }

    const timeout = window.setTimeout(() => {
      setCrashCountdown((current) =>
        current ? { ...current, remaining: current.remaining - 1 } : current
      )
    }, 1000)
    return () => window.clearTimeout(timeout)
  }, [crashCountdown, dispatching, gpsLocation])

  if (!crashCountdown) return null

  return (
    <div
      className="fixed inset-x-4 top-4 z-[1000] mx-auto max-w-md rounded-xl border border-red-500/40 bg-red-950/95 p-4 text-white shadow-2xl"
      role="alertdialog"
      aria-live="assertive"
      aria-labelledby="crash-countdown-title"
    >
      <div className="flex flex-col gap-3">
        <div>
          <p id="crash-countdown-title" className="text-base font-black uppercase tracking-wide">
            Crash Detected
          </p>
          <p className="text-sm text-red-100">
            G-force spike: {(crashCountdown.force / STANDARD_GRAVITY_MS2).toFixed(1)}G
          </p>
        </div>
        <div className="rounded-lg bg-white/10 p-3 text-center">
          <span className="text-4xl font-black tabular-nums">{crashCountdown.remaining}</span>
          <span className="ml-1 text-sm uppercase tracking-widest text-red-100">sec</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="h-11 flex-1 rounded-lg bg-white text-sm font-bold text-red-950"
            onClick={() => setCrashCountdown(null)}
          >
            I am safe
          </button>
          <button
            type="button"
            className="h-11 flex-1 rounded-lg bg-red-600 text-sm font-bold text-white"
            onClick={() => setCrashCountdown((current) => current && { ...current, remaining: 0 })}
          >
            Send SOS now
          </button>
        </div>
      </div>
    </div>
  )
}
