"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Sparkles, Loader2, MessageSquare, Zap, Map } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Message = {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
    agents?: string[]
    mapActions?: {
        action: string;
        layer: string;
        identifiers: string[]
        radiusInfo?: {
            originLayer: string
            originId: string
            radiusKm: number
        }
    }[]
    followUpQuestions?: string[]
    latencyMs?: number
}

type AIChatPanelProps = {
    isOpen: boolean
    onClose: () => void
    onMapAction?: (action: {
        action: string;
        layer: string;
        identifiers: string[]
        radiusInfo?: {
            originLayer: string
            originId: string
            radiusKm: number
        }
    }) => void
    mapView?: __esri.MapView | __esri.SceneView | null
    initialQuestion?: string
    theme?: 'light' | 'dark'
}

const SUGGESTED_QUESTIONS = [
    "List all gas fields by operator",
    "Find wells with oil discovery",
    "How many offshore blocks are there?",
    "Which fields are still active?",
    "Find wells near the K06-T field within 30 km",
    "What are the most common well result types?",
    "List all operators in the hydrocarbon fields",
    "How many seismic 3D surveys were done after 2010?",
]

const AGENT_COLORS: Record<string, string> = {
    ASSET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    SPATIAL: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    INSIGHT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export function AIChatPanel({ isOpen, onClose, onMapAction, mapView, initialQuestion, theme = 'light' }: AIChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm the **NDR AI Assistant** — a multi-agent system built on your map data.\n\nI can query wells, hydrocarbon fields, offshore blocks, and seismic surveys. I can also reason spatially — finding nearby assets, calculating distances, and identifying clusters.\n\nAsk me anything about the data layers on your map.",
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const hasProcessedInitialQuestion = useRef(false)

    useEffect(() => {
        if (isOpen && initialQuestion && !hasProcessedInitialQuestion.current) {
            hasProcessedInitialQuestion.current = true
            handleSendMessage(initialQuestion, true) // true = derived context
        }
    }, [isOpen, initialQuestion])

    // Reset the flag when panel closes
    useEffect(() => {
        if (!isOpen) {
            hasProcessedInitialQuestion.current = false
        }
    }, [isOpen])

    const handleSendMessage = async (messageText?: string, isDerivedContext = false) => {
        const text = messageText || inputValue.trim()
        if (!text || isLoading) return

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: isDerivedContext ? `[Derived from Spatial Analysis] ${text}` : text,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputValue("")
        setIsLoading(true)
        setShowSuggestions(false)

        try {
            // Get current map view extent for spatial context
            const extentContext = mapView?.extent ? {
                xmin: mapView.extent.xmin,
                ymin: mapView.extent.ymin,
                xmax: mapView.extent.xmax,
                ymax: mapView.extent.ymax,
                center: {
                    lat: mapView.center?.latitude,
                    lon: mapView.center?.longitude
                },
                scale: mapView.scale,
                zoom: mapView.zoom
            } : undefined

            const res = await fetch('/api/ndr-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text, 
                    context: extentContext ? { extent: extentContext } : {}
                })
            })

            if (!res.ok) {
                throw new Error(`API error: ${res.status}`)
            }

            const data = await res.json()

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: data.answer || 'No response generated.',
                timestamp: new Date(),
                agents: data.agents,
                mapActions: data.mapActions,
                followUpQuestions: data.followUpQuestions,
                latencyMs: data.metadata?.latencyMs,
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (err) {
            const errorMsg: Message = {
                id: `error-${Date.now()}`,
                role: "assistant",
                content: `⚠️ Error reaching the AI system: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <div
            className={cn(
                "relative h-full shadow-xl z-20 transition-all duration-300 ease-in-out border-l",
                theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200",
                isOpen ? "w-[400px]" : "w-0"
            )}
        >
            <div className="w-[400px] h-full flex flex-col">
                {/* Header */}
                <div className="h-12 flex-none flex items-center justify-between px-4 border-b border-gray-200 bg-gradient-to-r from-violet-600 to-purple-700">
                    <div className="flex items-center gap-2 text-white">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-bold">NDR AI Assistant</span>
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-medium tracking-wide">MULTI-AGENT</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                        aria-label="Close chat"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className={cn(
                    "flex-1 overflow-y-auto p-4 space-y-4",
                    theme === 'dark' ? "bg-slate-900" : "bg-slate-50"
                )}>
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-[88%] ${message.role === "user" ? "space-y-1" : "space-y-2"}`}>
                                <div
                                    className={cn(
                                        "rounded-2xl px-4 py-3",
                                        message.role === "user"
                                            ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-br-md"
                                            : theme === 'dark'
                                                ? "bg-slate-800 text-slate-200 border border-slate-700 shadow-sm rounded-bl-md"
                                                : "bg-white text-slate-700 border border-slate-200 shadow-sm rounded-bl-md"
                                    )}
                                >
                                    {message.role === "user" ? (
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                    ) : (
                                        <div className={cn(
                                            "text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-headings:my-3",
                                            theme === 'dark'
                                                ? "prose-headings:text-slate-200 prose-strong:text-slate-100 prose-p:text-slate-300 prose-li:text-slate-300"
                                                : "prose-headings:text-slate-800 prose-strong:text-slate-900"
                                        )}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    table: ({ ...props }) => <table className={cn("w-full border-collapse my-4 rounded-lg overflow-hidden", theme === 'dark' ? "border-slate-700" : "border-slate-200")} {...props} />,
                                                    thead: ({ ...props }) => <thead className={cn("border-b", theme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")} {...props} />,
                                                    th: ({ ...props }) => <th className={cn("text-left p-3 text-xs font-semibold border-r last:border-r-0", theme === 'dark' ? "text-slate-300 border-slate-700" : "text-slate-700 border-slate-200")} {...props} />,
                                                    td: ({ ...props }) => <td className={cn("p-3 text-xs border-r last:border-r-0 border-b last:border-b-0", theme === 'dark' ? "text-slate-400 border-slate-700" : "text-slate-600 border-slate-200")} {...props} />,
                                                    strong: ({ ...props }) => <strong className={cn("font-semibold", theme === 'dark' ? "text-slate-100" : "text-slate-900")} {...props} />,
                                                    ul: ({ ...props }) => <ul className="list-disc list-outside ml-4 mb-3 space-y-1" {...props} />,
                                                    ol: ({ ...props }) => <ol className="list-decimal list-outside ml-4 mb-3 space-y-1" {...props} />,
                                                    li: ({ ...props }) => <li className="pl-1" {...props} />,
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                    <div className={`flex items-center gap-2 mt-2 ${message.role === "user" ? "justify-end" : "justify-between"}`}>
                                        <p className={`text-[10px] ${message.role === "user" ? "text-white/70" : "text-slate-400"}`}>
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {message.latencyMs && <span className="ml-1">· {(message.latencyMs / 1000).toFixed(1)}s</span>}
                                        </p>
                                        {message.agents && (
                                            <div className="flex gap-1">
                                                {message.agents.map(a => (
                                                    <span key={a} className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${AGENT_COLORS[a] || 'bg-slate-100 text-slate-500'}`}>
                                                        {a}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Map actions badge — clickable to zoom map */}
                                {message.mapActions && message.mapActions.length > 0 && onMapAction && (
                                    <button
                                        onClick={() => onMapAction(message.mapActions![0])}
                                        className={cn(
                                            "flex items-center gap-1.5 text-[10px] rounded-lg px-2.5 py-1.5 w-fit transition-colors cursor-pointer border",
                                            theme === 'dark'
                                                ? "text-emerald-400 bg-emerald-900/20 border-emerald-800/50 hover:bg-emerald-900/30"
                                                : "text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100"
                                        )}
                                    >
                                        <Map className="w-3 h-3" />
                                        <span className="font-semibold">Focus on map</span>
                                        <span className={theme === 'dark' ? "text-emerald-500" : "text-emerald-500"}>· zoom to {message.mapActions[0].identifiers.length} feature{message.mapActions[0].identifiers.length !== 1 ? 's' : ''}</span>
                                    </button>
                                )}

                                {/* Follow-up questions */}
                                {message.followUpQuestions && message.followUpQuestions.length > 0 && message.role === 'assistant' && (
                                    <div className="flex flex-col gap-1.5 pt-1">
                                        {message.followUpQuestions.map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSendMessage(q)}
                                                className={cn(
                                                    "text-left px-3 py-2 text-xs rounded-lg transition-all shadow-sm group w-fit max-w-full border",
                                                    theme === 'dark'
                                                        ? "bg-slate-800 border-slate-700 hover:border-purple-500 hover:bg-slate-700"
                                                        : "bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50"
                                                )}
                                            >
                                                <span className={cn(
                                                    "group-hover:text-purple-400",
                                                    theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                                )}>↪ {q}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Initial Suggestions */}
                    {showSuggestions && messages.length === 1 && !isLoading && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className={cn(
                                "flex items-center gap-2 text-xs font-medium",
                                theme === 'dark' ? "text-slate-500" : "text-slate-500"
                            )}>
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Ask about the map layers</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED_QUESTIONS.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSendMessage(question)}
                                        className={cn(
                                            "text-left px-3 py-2 text-xs rounded-lg transition-all shadow-sm hover:shadow group border",
                                            theme === 'dark'
                                                ? "bg-slate-800 border-slate-700 hover:border-purple-500 hover:bg-slate-700"
                                                : "bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50"
                                        )}
                                    >
                                        <span className={cn(
                                            "group-hover:text-purple-400",
                                            theme === 'dark' ? "text-slate-300" : "text-slate-600"
                                        )}>{question}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className={cn(
                                "shadow-sm rounded-2xl rounded-bl-md px-4 py-3 border",
                                theme === 'dark'
                                    ? "bg-slate-800 text-slate-300 border-slate-700"
                                    : "bg-white text-slate-700 border-slate-200"
                            )}>
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                    <span className={cn(
                                        "text-sm",
                                        theme === 'dark' ? "text-slate-400" : "text-slate-500"
                                    )}>Agents running...</span>
                                </div>
                                <div className="flex gap-1 mt-2">
                                    {['ASSET', 'SPATIAL', 'INSIGHT'].map(a => (
                                        <span key={a} className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-pulse ${AGENT_COLORS[a]}`}>
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={cn(
                    "flex-none p-4 border-t",
                    theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
                )}>
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about wells, fields, blocks, seismic..."
                            className={cn(
                                "flex-1 px-4 py-2.5 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
                                theme === 'dark'
                                    ? "bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
                                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                            )}
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!inputValue.trim() || isLoading}
                            className="p-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <p className={cn(
                            "text-[10px]",
                            theme === 'dark' ? "text-slate-500" : "text-slate-400"
                        )}>Powered by Groq · Asset · Spatial · Insight agents</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
