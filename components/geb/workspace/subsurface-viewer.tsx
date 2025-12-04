"use client"

import { Card } from "@/components/ui/card"

export function SubsurfaceViewer() {
    return (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 p-6">
            <Card className="w-full max-w-3xl h-[600px] flex flex-col items-center justify-center bg-slate-800 border-slate-700 text-slate-100 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                <div className="z-10 text-center space-y-6">
                    <div className="w-24 h-24 mx-auto bg-teal-500/20 rounded-full flex items-center justify-center border border-teal-500/50 animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400">
                            <path d="M2 12h20"></path>
                            <path d="M2 12l5 5"></path>
                            <path d="M22 12l-5 5"></path>
                            <path d="M12 2v20"></path>
                            <path d="M12 2l5 5"></path>
                            <path d="M12 22l-5-5"></path>
                        </svg>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Paleoscan Viewer</h2>
                        <p className="text-slate-400 max-w-md mx-auto">
                            Advanced subsurface visualization and interpretation module.
                        </p>
                    </div>

                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 max-w-lg mx-auto">
                        <p className="text-sm text-slate-300">
                            <span className="font-semibold text-teal-400">Status:</span> Waiting for Paleoscan integration link.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
