"use client"

import { useEffect } from "react"

export default function HomePage() {
  useEffect(() => {
    function handleLandingMessage(event: MessageEvent) {
      if (event.data?.type === "kairo:open-product") {
        window.location.assign("/kairo")
      }
    }

    window.addEventListener("message", handleLandingMessage)
    return () => window.removeEventListener("message", handleLandingMessage)
  }, [])

  return (
    <iframe
      title="Kairo landing page"
      src="/landing-embed"
      className="block h-screen w-full border-0"
      sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
    />
  )
}
