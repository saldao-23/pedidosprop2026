"use client"

import { useSessionTracking } from "@/hooks/useSessionTracking"

export default function SessionTracker() {
  useSessionTracking()
  return null
}
