"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Sparkles, Loader2, MessageSquare, Zap, Map } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Message = {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
    agents?: string[]
    mapActions?: { action: string; layer: string; identifiers: string[] }[]
    followUpQuestions?: string[]
    latencyMs?: number
}

type AIChatPanelProps = {
    isOpen: boolean
    onClose: () => void
    onMapAction?: (action: { action: string; layer: string; identifiers: string[] }) => void
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
    ASSET: 'bg-blue-100 text-blue-700',
    SPATIAL: 'bg-emerald-100 text-emerald-700',
    INSIGHT: 'bg-amber-100 text-amber-700',
}

export function AIChatPanel({ isOpen, onClose, onMapAction }: AIChatPanelProps) {
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

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
    }, [isOpen])

    const handleSendMessage = async (messageText?: string) => {
        const text = messageText || inputValue.trim()
        if (!text || isLoading) return

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: text,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputValue("")
        setIsLoading(true)
        setShowSuggestions(false)

        try {
            const res = await fetch('/api/ndr-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, context: {} })
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
            className={`relative h-full bg-white shadow-xl z-20 transition-all duration-300 ease-in-out border-l border-gray-200 ${isOpen ? "w-[400px]" : "w-0"
                }`}
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
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-[88%] ${message.role === "user" ? "space-y-1" : "space-y-2"}`}>
                                <div
                                    className={`rounded-2xl px-4 py-3 ${message.role === "user"
                                        ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-br-md"
                                        : "bg-white text-slate-700 border border-slate-200 shadow-sm rounded-bl-md"
                                        }`}
                                >
                                    {message.role === "user" ? (
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                    ) : (
                                        <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-headings:my-3 prose-headings:text-slate-800 prose-strong:text-slate-900 prose-table:my-4 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-200 prose-th:bg-slate-50 prose-th:p-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:text-slate-700 prose-td:border prose-td:border-slate-200 prose-td:p-2 prose-td:text-xs prose-td:text-slate-600">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    table: ({ ...props }) => <table className="w-full border-collapse border border-slate-200 my-4 rounded-lg overflow-hidden" {...props} />,
                                                    thead: ({ ...props }) => <thead className="bg-slate-50 border-b border-slate-200" {...props} />,
                                                    th: ({ ...props }) => <th className="text-left p-3 text-xs font-semibold text-slate-700 border-r border-slate-200 last:border-r-0" {...props} />,
                                                    td: ({ ...props }) => <td className="p-3 text-xs text-slate-600 border-r border-slate-200 last:border-r-0 border-b border-slate-100 last:border-b-0" {...props} />,
                                                    p: ({ ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                                                    ul: ({ ...props }) => <ul className="list-disc list-outside ml-4 mb-3 space-y-1" {...props} />,
                                                    ol: ({ ...props }) => <ol className="list-decimal list-outside ml-4 mb-3 space-y-1" {...props} />,
                                                    li: ({ ...props }) => <li className="pl-1" {...props} />,
                                                    strong: ({ ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
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
                                        className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1.5 w-fit hover:bg-emerald-100 hover:border-emerald-400 transition-colors cursor-pointer"
                                    >
                                        <Map className="w-3 h-3" />
                                        <span className="font-semibold">Focus on map</span>
                                        <span className="text-emerald-500">· zoom to {message.mapActions[0].identifiers.length} feature{message.mapActions[0].identifiers.length !== 1 ? 's' : ''}</span>
                                    </button>
                                )}

                                {/* Follow-up questions */}
                                {message.followUpQuestions && message.followUpQuestions.length > 0 && message.role === 'assistant' && (
                                    <div className="flex flex-col gap-1.5 pt-1">
                                        {message.followUpQuestions.map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSendMessage(q)}
                                                className="text-left px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all shadow-sm group w-fit max-w-full"
                                            >
                                                <span className="text-slate-500 group-hover:text-purple-700">↪ {q}</span>
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
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Ask about the map layers</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED_QUESTIONS.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSendMessage(question)}
                                        className="text-left px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all shadow-sm hover:shadow group"
                                    >
                                        <span className="text-slate-600 group-hover:text-purple-700">{question}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white text-slate-700 border border-slate-200 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                    <span className="text-sm text-slate-500">Agents running...</span>
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
                <div className="flex-none p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about wells, fields, blocks, seismic..."
                            className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-slate-50"
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
                        <p className="text-[10px] text-slate-400">Powered by Groq · Asset · Spatial · Insight agents</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
