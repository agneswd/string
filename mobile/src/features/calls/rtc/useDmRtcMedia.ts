import { useEffect } from 'react'

import type { UseDmRtcMediaParams, UseDmRtcMediaResult } from './useDmRtcMedia.types'

export function useDmRtcMedia(_params: UseDmRtcMediaParams): UseDmRtcMediaResult {
  useEffect(() => {
    // Web / unsupported fallback: native RTC transport is only enabled on native builds.
  }, [])

  return {
    rtcReady: false,
    rtcError: null,
  }
}
