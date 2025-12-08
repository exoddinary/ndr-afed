'use client'

import React, { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, Shield, Globe, Landmark, FileSearch } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function OfficialLicensingAuthority({ onClose }: Props) {
  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const stop = useCallback((e: React.MouseEvent) => e.stopPropagation(), [])

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Official Licensing Authority"
    >
      <div
        onClick={stop}
        className="w-[92vw] max-w-5xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-xl bg-black/70 select-none"
      >
        {/* Header */}
        <div className="px-6 md:px-8 py-6 md:py-7 bg-black/60 border-b border-white/10 relative">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-yellow-400/15 text-yellow-400 border border-yellow-400/20"><Shield className="w-5 h-5" /></div>
            <div>
              <div className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-yellow-400">Republic of Indonesia</div>
              <h2 className="text-2xl md:text-3xl font-black text-white mt-1">Official Licensing Authority</h2>
              <p className="mt-2 text-sm text-white/80 max-w-3xl">
                Facilitating sustainable energy exploration through transparent, efficient, and investor‑friendly licensing mechanisms.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 md:px-8 py-6 md:py-8 bg-black/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Card 1 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-400/20"><Globe className="w-5 h-5" /></div>
                <div className="text-white font-bold">Global Standards</div>
              </div>
              <p className="text-sm text-white/70">Adhering to international best practices in energy regulation and data security.</p>
            </div>
            {/* Card 2 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-300/20"><Landmark className="w-5 h-5" /></div>
                <div className="text-white font-bold">Investment Climate</div>
              </div>
              <p className="text-sm text-white/70">Continuous improvement of fiscal terms to ensure competitiveness.</p>
            </div>
            {/* Card 3 */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-300/20"><FileSearch className="w-5 h-5" /></div>
                <div className="text-white font-bold">Transparency</div>
              </div>
              <p className="text-sm text-white/70">Open access to reliable data and clear bidding processes.</p>
            </div>
          </div>

          {/* Partners */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Governing Bodies & Partners</div>
            <div className="flex items-center gap-8 mb-6">
              {/* ESDM Logo/Text */}
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white tracking-wide">ESDM</span>
                <div className="text-[8px] leading-tight text-white/50 uppercase border-l border-white/20 pl-2">
                  Ministry of Energy<br/>and Mineral Resources
                </div>
              </div>
              <div className="h-8 w-px bg-white/20" />
              {/* SKK Migas Logo */}
              <div className="flex items-center gap-2">
                <Image
                  src="/images/skkmigas-logo.png"
                  alt="SKK Migas"
                  width={40}
                  height={40}
                  className="opacity-90"
                />
                <span className="text-xl font-black text-white tracking-wide">SKKMIGAS</span>
              </div>
            </div>
            
            {/* Powered by AFED Digital */}
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/5">
              <span className="text-[9px] uppercase tracking-widest text-white/40 font-medium">Powered by</span>
              <Image
                src="/vdr-tagline.png"
                alt="AFED Digital"
                width={70}
                height={18}
                className="opacity-80"
              />
            </div>
            
            <div className="text-[10px] text-white/30 text-center mt-4">© 2025 Indonesia Petroleum Bidding Round. All Rights Reserved.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
