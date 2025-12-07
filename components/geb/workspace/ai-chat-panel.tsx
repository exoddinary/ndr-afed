"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Sparkles, Loader2, MessageSquare } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Message = {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

type AIChatPanelProps = {
    isOpen: boolean
    onClose: () => void
}

// Suggested questions for VDR
const SUGGESTED_QUESTIONS = [
    "What are the potential 75 blocks for 2025 bidding?",
    "Which blocks have the highest 2P reserves?",
    "What are the fiscal terms for PSC Gross Split?",
    "Compare offshore vs onshore exploration risks",
    "Show me blocks expiring in the next 2 years",
    "What is the average IRR for active blocks?",
    "Which operators have the most active licenses?",
    "Analyze the Mahakam Delta production history"
]

// Placeholder AI responses mapped to specific questions
const QUESTION_RESPONSES: Record<string, string> = {
    "What are the potential 75 blocks for 2025 bidding?": `Based on ESDM's latest announcement, here are the key highlights for the 2025 Oil & Gas Bidding Round:

**Total Blocks Available:** 75 exploration blocks

**Regional Distribution:**
• **Eastern Indonesia:** 28 blocks (Papua, Maluku, Sulawesi)
• **Kalimantan:** 18 blocks (East, South, North Kalimantan)  
• **Sumatra:** 15 blocks (Aceh, Riau, South Sumatra)
• **Java Sea:** 14 blocks (North Java, Madura Strait)

**Top Recommended Blocks:**
1. **Andaman IV** - Estimated 850 MMboe, deepwater
2. **West Papua XVIII** - Gas-prone, 2.1 Tcf potential
3. **South Makassar Strait** - Near existing infrastructure
4. **North Sumatra Offshore** - Proven petroleum system

The bidding window opens Q2 2025. Would you like detailed analysis on any specific block?`,

    "Which blocks have the highest 2P reserves?": `Here are the top exploration blocks by 2P (Proven + Probable) reserves:

**Top 10 by Oil Reserves:**
1. **Mahakam Delta** - 1,250 MMbbl
2. **Cepu Block** - 890 MMbbl  
3. **Natuna Sea A** - 720 MMbbl
4. **South Sumatra Basin** - 650 MMbbl
5. **Rokan Block** - 580 MMbbl

**Top 5 by Gas Reserves:**
1. **Tangguh** - 18.4 Tcf
2. **Masela (Abadi)** - 12.8 Tcf
3. **Natuna D-Alpha** - 9.2 Tcf
4. **Corridor Block** - 4.8 Tcf
5. **Senoro-Toili** - 2.5 Tcf

The Mahakam Delta remains Indonesia's most prolific oil producing area, while Tangguh leads gas reserves.`,

    "What are the fiscal terms for PSC Gross Split?": `**Indonesia PSC Gross Split Fiscal Terms (2024 Update):**

**Base Split:**
• Contractor: 57% Oil / 52% Gas
• Government: 43% Oil / 48% Gas

**Variable Components (adjustments ±):**
| Factor | Oil | Gas |
|--------|-----|-----|
| Frontier Area | +7% | +6% |
| Water Depth >500m | +5% | +5% |
| Field Size <25 MMBOE | +4% | +4% |
| H2S >100 ppm | +3% | +3% |
| CO2 >5% | +2% | +2% |
| Local Content >50% | +2% | +2% |

**Key Benefits:**
• No cost recovery mechanism
• DMO: 25% at market price
• Income Tax: 40% corporate tax
• No signature bonus required

This makes Indonesia competitive with Malaysia's PSC terms.`,

    "Compare offshore vs onshore exploration risks": `**Risk Comparison: Offshore vs Onshore Exploration**

**Technical Risks:**
| Factor | Offshore | Onshore |
|--------|----------|---------|
| Drilling Cost | $50-150M | $5-20M |
| Data Quality | Excellent 3D | Variable |
| Well Complexity | High | Moderate |
| Timeline | 2-4 years | 1-2 years |

**Commercial Risks:**
• **Offshore:** Higher CAPEX, but larger discoveries typically (>100 MMboe)
• **Onshore:** Lower entry cost, faster monetization, smaller fields (10-50 MMboe)

**Success Rates (Indonesia 2014-2024):**
• Offshore: 38% technical success
• Onshore: 45% technical success

**Recommendation:**
For new entrants, onshore blocks in proven basins (South Sumatra, Central Sumatra) offer better risk-adjusted returns. Majors should target deepwater frontier plays.`,
}

// Generic placeholder responses for unmapped questions
const PLACEHOLDER_RESPONSES = [
    "Based on my analysis of the exploration blocks in this region, the Mahakam Delta shows promising hydrocarbon potential with estimated 2P reserves of 450 MMbbl. The geological formations indicate favorable conditions for both oil and gas accumulation.",
    "The seismic data suggests a complex stratigraphic trap system in the offshore West Aceh region. I recommend focusing on the Miocene turbidite channels which show strong amplitude anomalies.",
    "Looking at the production history of nearby blocks, the average decline rate is approximately 8% annually. However, infill drilling and EOR techniques could potentially increase recovery factors by 15-20%.",
    "The fiscal terms for this PSC include a 5% royalty rate with cost recovery capped at 80%. Based on current oil prices, the project IRR is estimated at 22% with a payback period of 4.5 years.",
    "I've identified three high-potential prospects within the selected area: Alpha-12 (2.4 km³), Beta-08 (1.8 km³), and Gamma-15 (3.1 km³). All show favorable structural closure and reservoir quality.",
    "The infrastructure proximity analysis shows the nearest pipeline is 45 km away, which would require additional CAPEX of approximately $120M for tie-back development.",
    "Historical drilling data indicates a 42% technical success rate in this play type. The main risks are reservoir quality uncertainty and charge timing relative to trap formation.",
    "Based on analog fields in the region, I estimate a recovery factor of 35% for oil and 75% for gas. The development scenario assumes 8 production wells and 2 water injectors."
]

export function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your AI assistant for the Indonesia Virtual Data Room. I can help you analyze exploration blocks, understand geological data, evaluate fiscal terms, and answer questions about the energy sector. Try one of the suggested questions below, or ask me anything!",
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(true)
    const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, followUpSuggestions])

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
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
        setFollowUpSuggestions([]) // Clear follow-ups while loading

        // Simulate 1 second loading
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Check if we have a specific response for this question
        let responseText = QUESTION_RESPONSES[text]
        if (!responseText) {
            // Use random placeholder
            responseText = PLACEHOLDER_RESPONSES[Math.floor(Math.random() * PLACEHOLDER_RESPONSES.length)]
        }

        const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: responseText,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])
        setIsLoading(false)

        // Generate follow-up suggestions based on context (randomly picked from remaining suggestions for now)
        // In a real app, this would be context-aware
        const remainingSuggestions = SUGGESTED_QUESTIONS.filter(q => q !== text && !messages.some(m => m.content === q))
        const randomFollowUps = remainingSuggestions.sort(() => 0.5 - Math.random()).slice(0, 3)
        setFollowUpSuggestions(randomFollowUps)
    }

    const handleSuggestionClick = (question: string) => {
        handleSendMessage(question)
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
                <div className="h-12 flex-none flex items-center justify-between px-4 border-b border-gray-200 bg-gradient-to-r from-violet-500 to-purple-600">
                    <div className="flex items-center gap-2 text-white">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-sm font-bold">AI Assistant</span>
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
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === "user"
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
                                                table: ({ node, ...props }) => <table className="w-full border-collapse border border-slate-200 my-4 rounded-lg overflow-hidden" {...props} />,
                                                thead: ({ node, ...props }) => <thead className="bg-slate-50 border-b border-slate-200" {...props} />,
                                                th: ({ node, ...props }) => <th className="text-left p-3 text-xs font-semibold text-slate-700 border-r border-slate-200 last:border-r-0" {...props} />,
                                                td: ({ node, ...props }) => <td className="p-3 text-xs text-slate-600 border-r border-slate-200 last:border-r-0 border-b border-slate-100 last:border-b-0" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 mb-3 space-y-1" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 mb-3 space-y-1" {...props} />,
                                                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                )}
                                <p className={`text-[10px] mt-2 ${message.role === "user" ? "text-white/70" : "text-slate-400"
                                    }`}>
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Initial Suggested Questions - Show after welcome message */}
                    {showSuggestions && messages.length === 1 && !isLoading && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Suggested questions</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED_QUESTIONS.slice(0, 4).map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSuggestionClick(question)}
                                        className="text-left px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all shadow-sm hover:shadow group"
                                    >
                                        <span className="text-slate-600 group-hover:text-purple-700">{question}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED_QUESTIONS.slice(4).map((question, index) => (
                                    <button
                                        key={index + 4}
                                        onClick={() => handleSuggestionClick(question)}
                                        className="text-left px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all shadow-sm hover:shadow group"
                                    >
                                        <span className="text-slate-600 group-hover:text-purple-700">{question}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Follow-up Suggestions - Show after AI response */}
                    {followUpSuggestions.length > 0 && !isLoading && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 pl-2">
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Related questions</span>
                            </div>
                            <div className="flex flex-col gap-2 items-start">
                                {followUpSuggestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSuggestionClick(question)}
                                        className="text-left px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all shadow-sm hover:shadow group w-fit max-w-[90%]"
                                    >
                                        <span className="text-slate-600 group-hover:text-purple-700">{question}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white text-slate-700 border border-slate-200 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                    <span className="text-sm text-slate-500">Thinking...</span>
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
                            placeholder="Ask me anything about the data..."
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
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                        AI responses are placeholders for demonstration
                    </p>
                </div>
            </div>
        </div>
    )
}
