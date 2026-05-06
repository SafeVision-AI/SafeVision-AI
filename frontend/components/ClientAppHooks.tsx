'use client'

import { useEffect } from 'react'
import { registerOfflineSyncListeners } from '@/lib/offline-sos-queue'
import { startCrashDetection, stopCrashDetection } from '@/lib/crash-detection'
import { STANDARD_GRAVITY_MS2 } from '@/lib/safety-constants'
import toast from 'react-hot-toast'

export function ClientAppHooks() {
  useEffect(() => {
    registerOfflineSyncListeners()

    const handleCrashDetected = (force: number) => {
      toast.error(
        () => (
          <div className="flex flex-col gap-2">
            <p className="font-bold text-lg">⚠️ CRASH DETECTED!</p>
            <p className="text-sm">G-Force Spike: {(force / STANDARD_GRAVITY_MS2).toFixed(1)}G</p>
            <p className="text-xs mt-1 animate-pulse text-red-500">Auto-SOS will trigger in 20s...</p>
          </div>
        ),
        { duration: 10000, position: 'top-center' }
      )
    }

    void startCrashDetection(handleCrashDetected)
    return () => stopCrashDetection(handleCrashDetected)
  }, [])

  return null
}
