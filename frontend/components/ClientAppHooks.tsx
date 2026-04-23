'use client'

import { useEffect } from 'react'
import { registerOfflineSyncListeners } from '@/lib/offline-sos-queue'
import { startCrashDetection } from '@/lib/crash-detection'
import toast, { Toast } from 'react-hot-toast'

export function ClientAppHooks() {
  useEffect(() => {
    // 1. Initialize the Offline SOS Sync Listener
    registerOfflineSyncListeners()

    // 2. Start Crash Detection (Global listener for Hackathon demo)
    startCrashDetection((force: number) => {
      console.log('CRASH DETECTED VIA GLOBAL HOOK!', force)
      // Display a massive alert for the demo
      toast.error(
        (t: Toast) => (
          <div className="flex flex-col gap-2">
            <p className="font-bold text-lg">⚠️ CRASH DETECTED!</p>
            <p className="text-sm">G-Force Spike: {(force / 9.81).toFixed(1)}G</p>
            <p className="text-xs mt-1 animate-pulse text-red-500">Auto-SOS will trigger in 20s...</p>
          </div>
        ),
        { duration: 10000, position: 'top-center' }
      )
      
      // In a real app, this would trigger a 20s countdown modal that, if not cancelled, fires the SOS.
      // We will build that exact modal in the UI phase.
    })
    
    // We intentionally do not stop it for the global app scope,
    // but in production we'd want user opt-in before attaching sensors.
  }, [])

  return null
}
