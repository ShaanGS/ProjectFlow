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
    <div className="hidden h-full w-[340px] min-w-[340px] flex-col border-l border-gray-100 bg-white xl:flex">
      <AgentChat activeIncident={activeIncident} injectedMessage={injectedMessage} />
    </div>
  )
}
