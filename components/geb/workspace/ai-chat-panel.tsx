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
    "Which North Sea blocks are available for 2025 licensing?",
    "Which blocks have the highest 2P gas reserves?",
    "What are the fiscal terms for Netherlands license agreements?",
    "Compare shallow vs deep North Sea exploration risks",
    "Show me licenses expiring in the next 2 years",
    "What is the average IRR for active North Sea developments?",
    "Which operators have the most active Netherlands licenses?",
    "Analyze the Q1 block production history"
]

// Placeholder AI responses mapped to specific questions
const QUESTION_RESPONSES: Record<string, string> = {
    "Which North Sea blocks are available for 2025 licensing?": `Based on EBN and SodM's latest Netherlands licensing round, here are the key highlights:

**2025 Netherlands Licensing Round:**

**Available Areas:**
• **Southern North Sea (gas-prone):** 12 blocks (K, L, P quadrants)
• **Central North Sea:** 8 blocks (F, G, H quadrants)
• **Shallow Coastal Areas:** 5 blocks (Q quadrant)
• **Onshore Groningen periphery:** 3 exploration permits

**Top Recommended Blocks:**
1. **F16** - Rotliegend sandstone gas, ~60 bcm potential
2. **K8** - Near K5 Amstel infrastructure, low CAPEX tie-back
3. **L9** - Underexplored Carboniferous play, high upside
4. **P12** - CCS-ready structure with existing well data

The licensing window opens Q3 2025 under the Dutch Mining Act (Mijnbouwwet). Would you like detailed analysis on any specific block?`,

    "Which blocks have the highest 2P gas reserves?": `Here are the top blocks by 2P (Proven + Probable) gas reserves in the Netherlands North Sea:

**Top Blocks by Gas Reserves:**
1. **Q1** - ~120 bcm (Groningen-linked, NAM operated)
2. **L2** - ~45 bcm (Shell/ExxonMobil, Leeuwarden field)
3. **F3** - ~38 bcm (Neptune Energy, Anjea & Annabel fields)
4. **K5** - ~31 bcm (Wintershall Dea, Amstel complex)
5. **E18** - ~22 bcm (ONE-Dyas, Horizon discovery)

**Key Observations:**
• Netherlands North Sea is predominantly gas-prone
• Average 2P recovery factor: 72% for gas fields
• Remaining recoverable gas: ~500 bcm across active licenses
• Most fields connected to Den Helder processing hub

Q1 and L2 remain the most prolific producers, with F3 offering the most exploration upside.`,

    "What are the fiscal terms for Netherlands license agreements?": `**Netherlands North Sea Fiscal Terms (2024):**

**Royalties:**
• Gas: 0-8% (sliding scale based on production volume)
• Oil: 0-8% (same sliding scale)
• No royalty for fields < 500 MMcm/year

**State Participation:**
| Component | Rate |
|-----------|------|
| EBN Carry | 40% in all licenses |
| Corporate Tax | 25.8% |
| Hydrocarbons Levy | 35.18% effective |
| Total Government Take | ~68-72% |

**Key Features:**
• EBN (Energie Beheer Nederland) holds mandatory 40% in all blocks
• Cost uplift of 10% on capital expenditure
• Decommissioning costs 70% tax deductible
• SDE++ subsidy available for low-carbon projects

The Dutch system is stable and transparent, making it attractive for international operators compared to the UK's Energy Profits Levy.`,

    "Compare shallow vs deep North Sea exploration risks": `**Risk Comparison: Shallow vs Deep North Sea (Netherlands)**

**Technical Risks:**
| Factor | Shallow (<150m) | Deep (>150m) |
|--------|-----------------|-------------|
| Drilling Cost | €8-25M | €25-60M |
| Data Quality | Excellent 3D | Good 3D/4D |
| Well Complexity | Low-Moderate | Moderate-High |
| Avg Rig Rate | $150k/day | $250k/day |

**Commercial Risks:**
• **Shallow:** Smaller fields (5-30 bcm), but very low CAPEX via tie-backs
• **Deep:** Larger potential discoveries (>50 bcm), requires standalone infrastructure

**Success Rates (Netherlands 2014-2024):**
• Shallow North Sea: 52% technical success
• Deep/sub-salt: 28% technical success

**Recommendation:**
For new entrants, shallow tie-back opportunities near Den Helder hub offer best risk-adjusted returns. Established operators should target underexplored Carboniferous plays in deep water.`,
}

// Generic placeholder responses for unmapped questions
const PLACEHOLDER_RESPONSES = [
    "Based on my analysis of the Netherlands North Sea blocks in this region, the Q1 block shows strong Rotliegend sandstone gas potential with estimated 2P reserves of 120 bcm. The Permian geological formations indicate excellent reservoir quality with average porosity of 18-22%.",
    "The 3D seismic data suggests a four-way dip closure in the L2 area. I recommend focusing on the Slochteren Formation which shows strong amplitude-versus-offset anomalies consistent with gas saturation.",
    "Looking at the production history of nearby Netherlands North Sea blocks, the average decline rate is approximately 6% annually for Rotliegend gas fields. Infill drilling and reservoir pressure management could increase recovery factors from 72% to 80%+.",
    "The fiscal terms for this Netherlands license include EBN's mandatory 40% carry, the Hydrocarbons Levy at 35.18%, and standard corporate tax at 25.8%. Based on current Dutch TTF prices, the project IRR is estimated at 18% with a payback period of 5.2 years.",
    "I've identified three high-potential prospects within the selected block: Noord Prospect (4.2 bcm P50), West Flank extension (2.8 bcm P50), and Deep Carboniferous play (12+ bcm P90-upside). All show favorable structural closure on recent 3D seismic.",
    "The infrastructure proximity analysis shows the nearest NorFra pipeline tie-in is 28 km away, which would require approximately €45M for a subsea tie-back. This compares favorably with standalone development economics.",
    "Historical drilling data in the Southern Gas Basin indicates a 48% technical success rate for four-way dip closures in Rotliegend targets. The main risks are lateral reservoir continuity and top-seal integrity in the Zechstein evaporites.",
    "Based on analog Rotliegend fields in the Netherlands sector, I estimate a recovery factor of 74% for gas under primary depletion. The development scenario assumes 4 horizontal producers and potential tie-back to the P15-D platform."
]

export function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your AI assistant for the Netherlands National Data Room. I can help you analyze North Sea exploration blocks, understand Rotliegend geology, evaluate Dutch fiscal terms, and answer questions about the Netherlands energy sector. Try one of the suggested questions below, or ask me anything!",
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
