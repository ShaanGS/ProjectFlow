import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Kairo - Institutional Memory for On-Call Engineers",
  description: "Memory-backed incident intelligence for vendor failures.",
  icons: {
    icon: "/new favicon.svg",
    shortcut: "/new favicon.svg",
    apple: "/new favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
