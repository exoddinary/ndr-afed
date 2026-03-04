'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, X, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchBarProps {
    data: any[]
    onSearch: (item: any) => void
}

export default function SearchBar({ data, onSearch }: SearchBarProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Filter results based on query
    useEffect(() => {
        if (query.length > 1) {
            const filtered = data.filter(item =>
                item.namobj && item.namobj.toLowerCase().includes(query.toLowerCase())
            )
            setResults(filtered.slice(0, 5)) // Limit to 5 results
            setIsOpen(true)
        } else {
            setResults([])
            setIsOpen(false)
        }
    }, [query, data])

    // Handle outside click to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (item: any) => {
        setQuery(item.namobj)
        setIsOpen(false)
        onSearch(item)
    }

    const clearSearch = () => {
        setQuery('')
        setResults([])
        setIsOpen(false)
    }

    return (
        <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-white/60 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-12 py-2.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-sm text-white placeholder-white/40 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-black/80 transition-all outline-none shadow-2xl"
                    placeholder="Search blocks, basins, documents..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 1 && setIsOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && results.length > 0) {
                            handleSelect(results[0])
                        }
                    }}
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/60 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
                {!query && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-xs text-white/30 font-medium border border-white/10 rounded px-1.5 py-0.5">/</span>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isOpen && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute mt-2 w-full bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        <ul className="py-1">
                            {results.map((item, index) => (
                                <li key={index}>
                                    <button
                                        onClick={() => handleSelect(item)}
                                        className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors flex items-center gap-3 group"
                                    >
                                        <div className="p-2 rounded-lg bg-white/5 text-white/60 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                                                {item.namobj}
                                            </div>
                                            <div className="text-[10px] text-white/50 uppercase tracking-wider">
                                                {item.status || 'Unknown Status'}
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
