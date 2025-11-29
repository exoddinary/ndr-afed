"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface DataSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dataSource: string, discipline: string) => void
  title: string
}

const dataSources = [
  "IHS Markit (S&P Global)",
  "Rystad Energy",
  "CGG GeoSolutions",
  "Schlumberger Data Services (DELFI / GAIA)",
  "Wood Mackenzie",
]

const disciplines = [
  "Geology",
  "Geophysics",
  "Reservoir Engineering",
  "Production Engineering",
  "Drilling",
  "Completions",
]

export function DataSourceModal({ isOpen, onClose, onSubmit, title }: DataSourceModalProps) {
  const [selectedSource, setSelectedSource] = useState("")
  const [selectedDiscipline, setSelectedDiscipline] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    if (selectedSource && selectedDiscipline) {
      onSubmit(selectedSource, selectedDiscipline)
      setSelectedSource("")
      setSelectedDiscipline("")
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-card border border-border w-full max-w-2xl text-card-foreground">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Choose Option</h3>
              <div className="space-y-3">
                {dataSources.map((source) => (
                  <div key={source} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id={source}
                      name="dataSource"
                      value={source}
                      checked={selectedSource === source}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className="w-4 h-4 accent-current text-primary bg-input border border-border focus:ring-ring focus:ring-2"
                    />
                    <label htmlFor={source} className="text-muted-foreground cursor-pointer">
                      {source}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Data Discipline</h3>
              <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select Discipline" />
                </SelectTrigger>
                <SelectContent>
                  {disciplines.map((discipline) => (
                    <SelectItem
                      key={discipline}
                      value={discipline}
                      className="text-foreground focus:bg-muted focus:text-foreground"
                    >
                      {discipline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={handleSubmit}
              disabled={!selectedSource || !selectedDiscipline}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            >
              Submit
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
