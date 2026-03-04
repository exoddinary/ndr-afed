"use client"

import { useState } from "react"
import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TimelineScrubber() {
  const [currentAge, setCurrentAge] = useState(90) // Ma (Turonian ~90 Ma)
  const [isPlaying, setIsPlaying] = useState(false)
  const minAge = 0
  const maxAge = 200

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentAge(Number(e.target.value))
  }

  const geologicalAges = [
    { age: 0, label: "0 Ma" },
    { age: 23, label: "Neogene" },
    { age: 66, label: "Paleogene" },
    { age: 90, label: "Turonian", highlight: true },
    { age: 145, label: "Jurassic" },
    { age: 200, label: "200 Ma" },
  ]

  return (
    <div className="h-[30px] bg-white border-t border-gray-200 flex items-center px-4 gap-3 relative z-20">
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-gray-100 text-gray-600"
        onClick={() => setIsPlaying(!isPlaying)}
        title={isPlaying ? "Pause" : "Play animation"}
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </Button>

      {/* Age Display */}
      <div className="text-xs font-mono font-bold text-slate-900 w-16 text-center">
        {currentAge} Ma
      </div>

      {/* Timeline Slider */}
      <div className="flex-1 relative group">
        {/* Background track with geological markers */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full">
          {geologicalAges.map((marker) => {
            const position = ((marker.age - minAge) / (maxAge - minAge)) * 100
            return (
              <div
                key={marker.age}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                <div className={`w-0.5 h-3 ${marker.highlight ? 'bg-primary' : 'bg-gray-400'}`} />
                <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className={`text-[9px] ${marker.highlight ? 'text-primary font-bold' : 'text-gray-500'}`}>
                    {marker.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Slider Input */}
        <input
          type="range"
          min={minAge}
          max={maxAge}
          value={currentAge}
          onChange={handleSliderChange}
          className="w-full h-1 appearance-none bg-transparent cursor-pointer relative z-10
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:w-3 
            [&::-webkit-slider-thumb]:h-3 
            [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:bg-primary
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:hover:bg-primary
            [&::-moz-range-thumb]:w-3 
            [&::-moz-range-thumb]:h-3 
            [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-primary
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:hover:bg-primary"
          title="Drag to animate paleogeography"
        />
      </div>

      {/* Quick Presets */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentAge(0)}
          className="px-2 py-0.5 text-[9px] rounded border border-gray-200 hover:bg-gray-100 text-gray-600"
        >
          Today
        </button>
        <button
          onClick={() => setCurrentAge(90)}
          className="px-2 py-0.5 text-[9px] rounded border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-bold"
        >
          Turonian
        </button>
      </div>
    </div>
  )
}
