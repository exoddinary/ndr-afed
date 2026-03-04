"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"

interface UploadAreaProps {
  onFilesUploaded: (files: File[]) => void
}

export function UploadArea({ onFilesUploaded }: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length > 0) {
        setIsUploading(true)

        // Mock upload delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        setIsUploading(false)
        onFilesUploaded(droppedFiles)
      }
    },
    [onFilesUploaded],
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files)
        if (selectedFiles.length > 0) {
          setIsUploading(true)

          // Mock upload delay
          await new Promise((resolve) => setTimeout(resolve, 1500))

          setIsUploading(false)
          onFilesUploaded(selectedFiles)
        }
      }
    },
    [onFilesUploaded],
  )

  return (
    <Card className="mb-12 p-8 bg-slate-800/50 border-slate-700">
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragOver ? "border-blue-400 bg-blue-400/5" : "border-slate-600 hover:border-slate-500"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-slate-700/50">
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-slate-400" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">
              {isUploading ? "Uploading Files..." : "Drag & Drop Shapefiles Here"}
            </h3>
            {!isUploading && <p className="text-slate-400">or</p>}
          </div>

          {!isUploading && (
            <div className="relative">
              <input
                type="file"
                multiple
                accept=".shp,.dbf,.shx,.prj"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button className="bg-primary hover:bg-primary/90 text-white px-8">Browse Files</Button>
            </div>
          )}

          <div className="text-sm text-slate-500 space-y-1">
            <p>Supported: .shp, .dbf, .shx, .prj</p>
            <p>Max size: 100 MB per file</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
