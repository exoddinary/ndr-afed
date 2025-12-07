"use client"

import { useState } from "react"
import { Sparkles, X } from "lucide-react"

type AIChatTriggerProps = {
    onClick: () => void
    isOpen: boolean
    isPanelOpen?: boolean
}

export function AIChatTrigger({ onClick, isOpen, isPanelOpen }: AIChatTriggerProps) {
    const [isHovered, setIsHovered] = useState(false)

    if (isOpen) return null

    return (
        <div
            className={`fixed bottom-6 z-30 transition-all duration-300 ease-in-out ${isPanelOpen ? "right-[424px]" : "right-6"
                }`}
        >
            {/* Tooltip */}
            <div
                className={`absolute bottom-full right-0 mb-2 transition-all duration-200 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
                    }`}
            >
                <div className="bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                    Ask AI Assistant
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
                </div>
            </div>

            {/* Floating Button */}
            <button
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative w-14 h-14 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full shadow-lg shadow-purple-500/40 hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-200 flex items-center justify-center"
            >
                {/* Pulse Animation Ring */}
                <div className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20" />

                {/* Icon */}
                <Sparkles className="w-6 h-6 text-white relative z-10 group-hover:scale-110 transition-transform" />
            </button>
        </div>
    )
}
