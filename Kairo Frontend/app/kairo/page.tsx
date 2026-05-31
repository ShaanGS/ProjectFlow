"use client"

import { useEffect } from "react"
import { DashboardShell } from "@/components/kairo/dashboard-shell"

export default function KairoPage() {
  useEffect(() => {
    const seeded = localStorage.getItem("kairo_seeded")

    if (!seeded) {
      fetch("/api/seed", { method: "POST" })
        .then((response) => response.json())
        .then((payload) => {
          if (payload.success) localStorage.setItem("kairo_seeded", "true")
        })
        .catch(console.error)
    }
  }, [])

  return <DashboardShell />
}
