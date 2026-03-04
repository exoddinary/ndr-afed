'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface BlockInfoPanelProps {
    block: any
    onClose: () => void
}

export default function BlockInfoPanel({ block, onClose }: BlockInfoPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-24 right-8 z-50 w-96 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        >
            <div className="p-6">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-white mb-4">{block.blockName || block.namobj}</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-white/60">Operator:</span>
                        <span className="text-white font-medium">{block.operator || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-white/60">Status:</span>
                        <span className="text-white font-medium">{block.status || 'N/A'}</span>
                    </div>
                    {block.expiryDate && (
                        <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="text-white/60">Expiry:</span>
                            <span className="text-white font-medium">{block.expiryDate}</span>
                        </div>
                    )}
                    {block.note && (
                        <div className="pt-2">
                            <p className="text-white/70 text-xs italic">{block.note}</p>
                        </div>
                    )}
                    {block.metrics && (
                        <div className="pt-2">
                            <div className="text-white/60 text-xs mb-2">Metrics:</div>
                            {block.metrics.valuation_npv10 && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/60">NPV10:</span>
                                    <span className="text-accent font-mono">{block.metrics.valuation_npv10}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
