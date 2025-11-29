"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { FileText, X } from "lucide-react"
import { useEffect, useState } from "react"
import { DataSourceModal } from "./data-source-modal"

interface UploadedFile {
  id: string
  name: string
  size: number
  internalData: boolean
  externalData: boolean
  status: "queued" | "processing" | "completed" | "error"
  progress: number
  dataSource?: string
  discipline?: string
  metadata?: {
    geometry: string
    coordinateSystem: string
    features: number
    dataUploaded: number
    dataQuarantine: number
  }
}

interface FileListProps {
  files: UploadedFile[]
  onRemoveFile: (id: string) => void
  onUpdateFile: (id: string, updates: Partial<UploadedFile>) => void
  onClearAll: () => void
  onStartProcessing: () => void
}

export function FileList({ files, onRemoveFile, onUpdateFile, onClearAll, onStartProcessing }: FileListProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    fileId: string
    type: "internal" | "external"
  }>({
    isOpen: false,
    fileId: "",
    type: "internal",
  })

  useEffect(() => {
    files.forEach((file) => {
      if (file.status === "processing" && file.progress < 100) {
        const timer = setTimeout(() => {
          if (file.progress < 100) {
            const newProgress = Math.min(file.progress + 20, 100)
            const updates: Partial<UploadedFile> = { progress: newProgress }

            if (newProgress === 100) {
              updates.status = "completed"
              updates.metadata = {
                geometry: "Line String",
                coordinateSystem: "EPSG:4326",
                features: 475,
                dataUploaded: 100,
                dataQuarantine: 0,
              }
            }

            onUpdateFile(file.id, updates)
          }
        }, 1000) // Update every second for 5 seconds total

        return () => clearTimeout(timer)
      }
    })
  }, [files, onUpdateFile])

  const handleDataTypeChange = (fileId: string, type: "internal" | "external", checked: boolean) => {
    if (checked) {
      setModalState({
        isOpen: true,
        fileId,
        type,
      })
    } else {
      onUpdateFile(fileId, {
        [type === "internal" ? "internalData" : "externalData"]: false,
        dataSource: undefined,
        discipline: undefined,
      })
    }
  }

  const handleModalSubmit = (dataSource: string, discipline: string) => {
    const { fileId, type } = modalState
    onUpdateFile(fileId, {
      [type === "internal" ? "internalData" : "externalData"]: true,
      dataSource,
      discipline,
    })
  }

  const handleModalClose = () => {
    setModalState({ isOpen: false, fileId: "", type: "internal" })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Processing Pipelines ({files.length})</h2>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClearAll}
            className="border-border text-muted-foreground hover:bg-muted bg-transparent"
          >
            Clear All
          </Button>
          <Button onClick={onStartProcessing} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Start Processing
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {files.map((file) => (
          <Card key={file.id} className="bg-card border border-border p-4 rounded-xl shadow-sm text-card-foreground">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-0 truncate pr-4">{file.name}</h3>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {file.discipline && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{file.discipline}</span>
                )}
                <span className="text-muted-foreground text-sm font-medium">{(file.size / 1024).toFixed(2)} kB</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFile(file.id)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-6 mb-2 pl-8">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`internal-${file.id}`}
                  checked={file.internalData}
                  onCheckedChange={(checked) => handleDataTypeChange(file.id, "internal", checked as boolean)}
                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor={`internal-${file.id}`} className="text-sm text-muted-foreground cursor-pointer font-medium">
                  Internal Data
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`external-${file.id}`}
                  checked={file.externalData}
                  onCheckedChange={(checked) => handleDataTypeChange(file.id, "external", checked as boolean)}
                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor={`external-${file.id}`} className="text-sm text-muted-foreground cursor-pointer font-medium">
                  External Data
                </label>
              </div>
            </div>

            {(file.status === "processing" || file.status === "completed") && (
              <div className="mb-3 pl-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-muted-foreground text-sm font-medium">
                    {file.status === "processing" && "Processing..."}
                    {file.status === "completed" && "Processing Complete"}
                  </p>
                  <span className="text-sm text-muted-foreground font-semibold">{file.progress}%</span>
                </div>
                <Progress value={file.progress} className="h-2 bg-muted [&>div]:bg-primary" />
              </div>
            )}

            {file.status === "queued" && (
              <div className="mb-3 pl-8">
                <p className="text-muted-foreground text-sm font-medium">Queued for Processing</p>
              </div>
            )}

            {file.metadata && (
              <div className="grid grid-cols-5 gap-4 pt-4 border-t border-border pl-8">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Geometry</p>
                  <p className="text-sm text-foreground font-semibold">{file.metadata.geometry}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Coordinate System</p>
                  <p className="text-sm text-foreground font-semibold">{file.metadata.coordinateSystem}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Features</p>
                  <p className="text-sm text-foreground font-semibold">{file.metadata.features}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Data Uploaded</p>
                  <p className="text-sm text-primary font-semibold">{file.metadata.dataUploaded}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Data Quarantine</p>
                  <p className="text-sm text-foreground font-semibold">{file.metadata.dataQuarantine}</p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <DataSourceModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        title="Source of Data"
      />
    </div>
  )
}
