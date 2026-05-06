'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { logClientWarning } from './client-logger'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

    if (posthogKey) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: false,
        capture_pageleave: true,
      })
      return
    }

    logClientWarning('PostHog is not initialized (NEXT_PUBLIC_POSTHOG_KEY missing)')
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
