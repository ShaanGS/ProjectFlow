"use client"

import { cn } from "@/lib/utils"

const vendorStyles: Record<string, { label: string; mark: string; className: string }> = {
  razorpay: {
    label: "Razorpay",
    mark: "R",
    className: "bg-[#EAF2FF] text-[#116DFF] ring-[#116DFF]/15",
  },
  msg91: {
    label: "MSG91",
    mark: "M",
    className: "bg-[#FFF0EA] text-[#E94B22] ring-[#E94B22]/15",
  },
  "aws-s3": {
    label: "AWS S3",
    mark: "aws",
    className: "bg-[#FFF7E6] text-[#FF9900] ring-[#FF9900]/20",
  },
  cashfree: {
    label: "Cashfree",
    mark: "C",
    className: "bg-[#F0FFF4] text-[#16A34A] ring-[#16A34A]/15",
  },
  internal: {
    label: "Internal",
    mark: "IN",
    className: "bg-[#F4F4F5] text-[#52525B] ring-[#71717A]/15",
  },
  auth0: {
    label: "Auth0",
    mark: "A0",
    className: "bg-[#FFF4ED] text-[#EB5424] ring-[#EB5424]/15",
  },
  whatsapp: {
    label: "WhatsApp",
    mark: "W",
    className: "bg-[#ECFDF3] text-[#12B76A] ring-[#12B76A]/15",
  },
}

function normalizeVendor(vendor: string) {
  const value = vendor.toLowerCase()

  if (value.includes("razorpay")) return "razorpay"
  if (value.includes("msg91")) return "msg91"
  if (value.includes("aws")) return "aws-s3"
  if (value.includes("cashfree")) return "cashfree"
  if (value.includes("auth0")) return "auth0"
  if (value.includes("whatsapp")) return "whatsapp"
  if (value.includes("internal")) return "internal"

  return "internal"
}

export function VendorLogo({
  vendor,
  size = "md",
  showLabel = false,
}: {
  vendor: string
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}) {
  const style = vendorStyles[normalizeVendor(vendor)]

  const sizeClass = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-[11px]",
    lg: "h-11 w-11 text-[13px]",
  }[size]

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-xl font-black uppercase tracking-[-0.03em] ring-1",
          sizeClass,
          style.className
        )}
      >
        {style.mark}
      </span>
      {showLabel && <span className="text-[13px] font-semibold text-[#1A1A1A]">{style.label}</span>}
    </span>
  )
}

export function KairoLogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/10", className)}>
      <img src="/kairo-logo.png" alt="Kairo" className="h-9 w-9 object-contain" />
    </span>
  )
}

