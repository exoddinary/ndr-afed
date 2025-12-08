'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'
import type { LicensingRound } from '@/data/licensing-rounds'

interface LicensingSummaryPanelProps {
  rounds: LicensingRound[]
  onOpen: () => void
}

const statusColorMap: Record<LicensingRound['status'], string> = {
  upcoming: '#D8B4FE',
  running: '#FDE047',
  pending: '#86EFAC',
  conditional: '#15803D',
  open: '#A97142',
}

export default function LicensingSummaryPanel({ rounds, onOpen }: LicensingSummaryPanelProps) {
  const total = rounds.length
  const running = rounds.filter(r => r.status === 'running').length
  const upcoming = rounds.filter(r => r.status === 'upcoming').length

  const top = rounds.slice(0, 3)

  return (
    <div className="absolute top-6 right-6 z-40 w-[360px] glass-panel rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">2025 Licensing Rounds</div>
        <div className="text-sm text-white/80 mt-1">{total} Blocks • {running} Running • {upcoming} Upcoming</div>
      </div>

      <div className="divide-y divide-white/10">
        {top.map((r) => (
          <div key={r.id} className="px-5 py-4 flex items-start gap-3">
            <div className="mt-1 w-2 h-2 rounded-full" style={{ backgroundColor: statusColorMap[r.status] }} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-white/90">{r.name}</div>
              <div className="text-[11px] text-white/60">{r.region} • {r.type} • Deadline: {r.deadline}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10">
        <button onClick={onOpen} className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold flex items-center justify-center gap-2 border border-white/15 transition-colors">
          View Opportunities
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
