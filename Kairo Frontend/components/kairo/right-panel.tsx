"use client"

import { AgentChat } from "./agent-chat"

interface RightPanelProps {
  activeIncident: unknown
  injectedMessage: {
    id: string
    role: "assistant"
    content: string
  } | null
}

export function RightPanel({ activeIncident, injectedMessage }: RightPanelProps) {
  return (
    <div className="hidden xl:flex h-full w-[340px] min-w-[340px] flex-col border-l border-border bg-background">
      <AgentChat activeIncident={activeIncident} injectedMessage={injectedMessage} />
    </div>
  )
}
