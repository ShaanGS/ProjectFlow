"use client"

import { cn } from "@/lib/utils"
import {
  Building2,
  Cloud,
  CreditCard,
  Landmark,
  MessageCircle,
  MessageSquareText,
  type LucideIcon,
} from "lucide-react"

const vendorStyles: Record<string, { label: string; icon: LucideIcon; bgClassName: string; iconClassName: string }> = {
  razorpay: {
    label: "Razorpay",
    bgClassName: "bg-[#EAF2FF] ring-[#116DFF]/15",
    iconClassName: "text-[#116DFF]",
    icon: CreditCard,
  },
  msg91: {
    label: "MSG91",
    bgClassName: "bg-[#FFF0EA] ring-[#E94B22]/15",
    iconClassName: "text-[#E94B22]",
    icon: MessageSquareText,
  },
  "aws-s3": {
    label: "AWS S3",
    bgClassName: "bg-[#FFF7E6] ring-[#FF9900]/20",
    iconClassName: "text-[#B45309]",
    icon: Cloud,
  },
  cashfree: {
    label: "Cashfree",
    bgClassName: "bg-[#F0FFF4] ring-[#16A34A]/15",
    iconClassName: "text-[#16A34A]",
    icon: Landmark,
  },
  internal: {
    label: "Internal",
    bgClassName: "bg-[#F4F4F5] ring-[#71717A]/15",
    iconClassName: "text-[#52525B]",
    icon: Building2,
  },
  auth0: {
    label: "Auth0",
    bgClassName: "bg-[#FFF4ED] ring-[#EB5424]/15",
    iconClassName: "text-[#EB5424]",
    icon: Building2,
  },
  whatsapp: {
    label: "WhatsApp",
    bgClassName: "bg-[#ECFDF3] ring-[#12B76A]/15",
    iconClassName: "text-[#12B76A]",
    icon: MessageCircle,
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
  const iconSizeClass = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }[size]
  const Icon = style.icon

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-xl ring-1",
          sizeClass,
          style.bgClassName
        )}
      >
        <Icon className={cn(iconSizeClass, style.iconClassName)} strokeWidth={2} aria-hidden />
      </span>
      {showLabel && <span className="text-[13px] font-semibold text-gray-900">{style.label}</span>}
    </span>
  )
}

export function KairoLogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src="/new logo.svg"
        alt="Kairo"
        className="h-auto w-40 object-contain object-left"
      />
    </span>
  )
}
