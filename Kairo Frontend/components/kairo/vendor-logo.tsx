"use client"

import { cn } from "@/lib/utils"

const vendorStyles: Record<string, { label: string; logo: string; bgColor: string; bgClassName: string }> = {
  razorpay: {
    label: "Razorpay",
    logo: "/logos/razorpay.svg",
    bgColor: "#116DFF",
    bgClassName: "bg-[#EAF2FF] ring-[#116DFF]/15",
  },
  msg91: {
    label: "MSG91",
    logo: "/logos/msg91.svg",
    bgColor: "#E94B22",
    bgClassName: "bg-[#FFF0EA] ring-[#E94B22]/15",
  },
  "aws-s3": {
    label: "AWS S3",
    logo: "/logos/aws-s3.svg",
    bgColor: "#FF9900",
    bgClassName: "bg-[#FFF7E6] ring-[#FF9900]/20",
  },
  cashfree: {
    label: "Cashfree",
    logo: "/logos/cashfree.svg",
    bgColor: "#16A34A",
    bgClassName: "bg-[#F0FFF4] ring-[#16A34A]/15",
  },
  internal: {
    label: "Internal",
    logo: "/logos/internal.svg",
    bgColor: "#52525B",
    bgClassName: "bg-[#F4F4F5] ring-[#71717A]/15",
  },
  auth0: {
    label: "Auth0",
    logo: "/logos/auth0.svg",
    bgColor: "#EB5424",
    bgClassName: "bg-[#FFF4ED] ring-[#EB5424]/15",
  },
  whatsapp: {
    label: "WhatsApp",
    logo: "/logos/whatsapp.svg",
    bgColor: "#12B76A",
    bgClassName: "bg-[#ECFDF3] ring-[#12B76A]/15",
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
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  }[size]

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-xl ring-1 overflow-hidden",
          sizeClass,
          style.bgClassName
        )}
      >
        <img
          src={style.logo}
          alt={style.label}
          className="h-full w-full object-contain p-1"
          onError={(e) => {
            // Fallback: if logo fails to load, show a solid color circle
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </span>
      {showLabel && <span className="text-[13px] font-semibold text-gray-900">{style.label}</span>}
    </span>
  )
}

export function KairoLogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src="/kairo-logo.png"
        alt="Kairo"
        className="w-44 h-auto object-contain object-left"
      />
    </span>
  )
}

