"use client"

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    p5: any
  }
}

export function TopologyBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<any>(null)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    // Check if p5.js is already loaded
    if (window.p5 && !p5InstanceRef.current) {
      initializeSketch()
      return
    }

    // Only load script if not already loaded
    if (!scriptLoadedRef.current) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js'
      script.onload = () => {
        scriptLoadedRef.current = true
        if (containerRef.current && window.p5 && !p5InstanceRef.current) {
          initializeSketch()
        }
      }
      document.head.appendChild(script)
    }

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove()
        p5InstanceRef.current = null
      }
    }
  }, [])

  const initializeSketch = () => {
    const sketch = (p: any) => {
      let time = 0
      let elevationLevels = 25  // Slightly denser primary contour levels
      let terrainScale = 0.015
      let flowSpeed = 0.8
      let resolution = 8   // Higher detail (smaller cell size) than 12
      let contourLines: any[] = []
      let heightMap: number[][] = []
      let mapWidth: number, mapHeight: number

      // Compute colors per frame based on current theme
      const getColors = () => {
        const isDark = document.documentElement.classList.contains('dark')
        if (isDark) {
          // Light lines on dark background
          return {
            bg: null as null | [number, number, number], // null -> transparent canvas
            lines: [
              [255, 255, 255],
              [245, 245, 245],
              [235, 235, 235],
              [225, 225, 225],
            ] as [number, number, number][]
          }
        }
        // Light mode: gentle grey lines
        return {
          bg: null as null | [number, number, number], // transparent canvas, body shows white
          lines: [
            [180, 180, 180],
            [200, 200, 200],
            [160, 160, 160],
            [140, 140, 140],
          ] as [number, number, number][]
        }
      }

      p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight)
        canvas.parent(containerRef.current)
        
        // Limit frame rate for better performance
        p.frameRate(30)
        // Cap pixel density for crispness without heavy cost
        try { p.pixelDensity(Math.min(window.devicePixelRatio || 1, 1.5)) } catch {}
        
        mapWidth = Math.floor(p.width / resolution)
        mapHeight = Math.floor(p.height / resolution)
        
        initializeHeightMap()
      }

      const initializeHeightMap = () => {
        heightMap = []
        for (let y = 0; y < mapHeight; y++) {
          heightMap[y] = []
          for (let x = 0; x < mapWidth; x++) {
            heightMap[y][x] = 0
          }
        }
      }

      const updateHeightMap = () => {
        for (let y = 0; y < mapHeight; y++) {
          for (let x = 0; x < mapWidth; x++) {
            let height = 0
            
            // Reduced to 2 octaves (from 4) for better performance
            height += p.noise(x * terrainScale, y * terrainScale, time * 0.02) * 1.0
            height += p.noise(x * terrainScale * 2, y * terrainScale * 2, time * 0.03) * 0.5
            
            // Add flowing motion
            height += p.sin(x * 0.1 + time * 0.1) * p.cos(y * 0.08 + time * 0.12) * 0.2
            
            heightMap[y][x] = height
          }
        }
      }

      const generateContourLines = () => {
        contourLines = []
        
        // Primary levels
        for (let level = 0; level < elevationLevels; level++) {
          let elevation = p.map(level, 0, elevationLevels - 1, -0.8, 2.0)
          let contours = findContourPaths(elevation)
          
          contourLines.push({
            elevation,
            paths: contours,
            colorIndex: level % 4,
          })
        }
        
        // Sparse intermediate levels (every 3rd gap) for richer look
        for (let level = 0; level < elevationLevels - 1; level += 3) {
          const elevation = p.map(level + 0.5, 0, elevationLevels - 1, -0.8, 2.0)
          const contours = findContourPaths(elevation)
          contourLines.push({
            elevation,
            paths: contours,
            colorIndex: (level + 2) % 4,
            isIntermediate: true,
          })
        }
      }

      const findContourPaths = (targetElevation: number) => {
        let paths: any[] = []
        
        for (let y = 0; y < mapHeight - 1; y++) {
          for (let x = 0; x < mapWidth - 1; x++) {
            let corners = [
              heightMap[y][x],
              heightMap[y][x + 1],
              heightMap[y + 1][x + 1],
              heightMap[y + 1][x]
            ]
            
            let intersections: any[] = []
            
            for (let i = 0; i < 4; i++) {
              let j = (i + 1) % 4
              if ((corners[i] <= targetElevation && corners[j] >= targetElevation) ||
                  (corners[i] >= targetElevation && corners[j] <= targetElevation)) {
                
                let t = (targetElevation - corners[i]) / (corners[j] - corners[i])
                let px: number, py: number
                
                if (i === 0) { // Top edge
                  px = x + t
                  py = y
                } else if (i === 1) { // Right edge
                  px = x + 1
                  py = y + t
                } else if (i === 2) { // Bottom edge
                  px = x + 1 - t
                  py = y + 1
                } else { // Left edge
                  px = x
                  py = y + 1 - t
                }
                
                intersections.push({
                  x: px * resolution,
                  y: py * resolution
                })
              }
            }
            
            if (intersections.length >= 2) {
              paths.push({
                start: intersections[0],
                end: intersections[1]
              })
            }
          }
        }
        
        return paths
      }

      const drawContourLines = () => {
        p.strokeWeight(0.8)
        
        const { lines } = getColors()
        const isDark = document.documentElement.classList.contains('dark')
        for (let contour of contourLines) {
          let color = lines[contour.colorIndex]

          // Style per mode and intermediate flag
          if (isDark) {
            if (contour.isIntermediate) {
              p.stroke(color[0], color[1], color[2], 80)
              p.strokeWeight(0.7)
            } else {
              p.stroke(color[0], color[1], color[2], 110)
              p.strokeWeight(0.95)
            }
          } else {
            if (contour.isIntermediate) {
              p.stroke(color[0], color[1], color[2], 140)
              p.strokeWeight(0.9)
            } else {
              p.stroke(color[0], color[1], color[2], 180)
              p.strokeWeight(1.1)
            }
          }
          
          // Thin intermediate paths: draw every 2nd segment
          const step = contour.isIntermediate ? 2 : 1
          for (let i = 0; i < contour.paths.length; i += step) {
            const path = contour.paths[i]
            p.line(path.start.x, path.start.y, path.end.x, path.end.y)
          }
        }
      }

      p.draw = () => {
        time += flowSpeed * 0.01
        // Transparent canvas so site background (light/dark) shows through
        p.clear()

        // Only update heavy computations on intervals to keep 30fps smooth
        if (p.frameCount % 2 === 0) {
          updateHeightMap()  // every 2nd frame
        }
        if (p.frameCount % 3 === 0) {
          generateContourLines() // every 3rd frame
        }

        // Always draw the latest contours each frame
        drawContourLines()
      }

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight)
        mapWidth = Math.floor(p.width / resolution)
        mapHeight = Math.floor(p.height / resolution)
        initializeHeightMap()
      }
    }

    p5InstanceRef.current = new window.p5(sketch)
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 -z-10 opacity-30"
      style={{ pointerEvents: 'none' }}
    />
  )
}
