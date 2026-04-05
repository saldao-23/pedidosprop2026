import type React from "react"
import SessionTracker from "@/components/session-tracker"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SessionTracker />
      {children}
    </>
  )
}
