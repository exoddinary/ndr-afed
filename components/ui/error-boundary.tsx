'use client'

import React from 'react'

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }
            return (
                <div className="w-full h-full flex items-center justify-center bg-black text-white p-4 text-center">
                    <div>
                        <h3 className="text-xl font-bold mb-2">Component Error</h3>
                        <p className="text-sm text-gray-400">This component failed to load.</p>
                        <p className="text-xs text-gray-600 mt-2">{this.state.error?.message}</p>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
