'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, MapPin, DollarSign, ArrowRight, Calendar, X } from 'lucide-react'
import type { LicensingRound } from '@/data/licensing-rounds'

interface LicensingOpportunitiesPanelProps {
  rounds: LicensingRound[]
  onClose: () => void
}

const statusColors: Record<string, string> = {
  upcoming: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  running: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  pending: 'bg-green-500/20 text-green-300 border-green-500/30',
  conditional: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  open: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

export default function LicensingOpportunitiesPanel({ rounds, onClose }: LicensingOpportunitiesPanelProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
          className="absolute right-6 top-6 bottom-6 w-[420px] flex flex-col rounded-2xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Opportunities</div>
              <div className="text-lg font-semibold text-white">Available Blocks & Rounds</div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {rounds.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl p-5 bg-[#111111] border border-white/5 hover:border-white/10 transition-all group"
              >
                {/* Top Row: Icon + Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <Briefcase className="w-5 h-5 text-white/70" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[r.status] || 'bg-white/10 text-white/70 border-white/10'}`}>
                    {r.status}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-white/90 transition-colors">{r.name}</h3>
                <div className="text-xs text-white/50 mb-3">{r.region} • {r.type}</div>
                
                {/* Summary */}
                <p className="text-sm text-white/70 mb-5 leading-relaxed">{r.summary}</p>

                {/* Info Grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-white/40 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-wide">Coords</span>
                    </div>
                    <span className="text-xs text-white/80 font-medium">{r.coordinates[1].toFixed(2)}, {r.coordinates[0].toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-white/40 mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-wide">Terms</span>
                    </div>
                    <span className="text-xs text-white/80 font-medium leading-tight">{r.fiscalTerms}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-white/40 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-wide">Deadline</span>
                    </div>
                    <span className="text-xs text-white/80 font-medium">{r.deadline}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 transition-all">
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
            
            {/* Bottom padding for scroll */}
            <div className="h-4" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
