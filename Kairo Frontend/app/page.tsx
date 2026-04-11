"use client"

import { useEffect } from "react"
import { DashboardShell } from "@/components/kairo/dashboard-shell"

export default function KairoPage() {
  useEffect(() => {
    const seeded = localStorage.getItem("kairo_seeded")

    if (!seeded) {
      fetch("/api/seed", { method: "POST" })
        .then(() => localStorage.setItem("kairo_seeded", "true"))
        .catch(console.error)
    }
  }, [])

  return <DashboardShell />
}
