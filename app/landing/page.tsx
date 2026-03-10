'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for client-side only components
const ArcGISGlobe = dynamic<{
  scrollProgress: number;
  isInteractive: boolean;
  activeLayers: Set<string>;
  activeMode: 'surveillance' | 'exploration' | 'strategic';
  altitude: number;
  onMouseMove?: (coords: { lon: number; lat: number } | null) => void;
  selectedBlock: any;
  onBlockSelect: (block: any) => void;
  searchQuery?: string;
  onHoverFeature?: (feature: { x: number, y: number, attributes: any } | null) => void;
  basemap: string;
  showBasins: boolean;
  showBlocks: boolean;
  isRotating: boolean;
}>(() => import('@/components/landing/ArcGISGlobe'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />
});

const HeroOverlay = dynamic<{
  scrollProgress: number;
  isInteractive: boolean;
  onLayerToggle: (layer: string) => void;
  activeLayers: Set<string>;
  activeMode: 'surveillance' | 'exploration' | 'strategic';
  onModeChange: (mode: 'surveillance' | 'exploration' | 'strategic') => void;
  altitude: number;
  onAltitudeChange: (altitude: number) => void;
  scrollToPhase?: (targetProgress: number) => void;
  mouseCoords: { lon: number; lat: number } | null;
  selectedBlock: any;
  onBlockSelect: (block: any) => void;
  onSearch: (query: string) => void;
  isAltitudeSliderVisible: boolean;
  basemap: string;
  onBasemapChange: (basemap: string) => void;
  showBasins: boolean;
  onShowBasinsToggle: () => void;
  showBlocks: boolean;
  onShowBlocksToggle: () => void;
  isRotating: boolean;
  onToggleRotation: () => void;
}>(() => import('@/components/landing/HeroOverlay'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />
});

const OrbitalLattice = dynamic<{
  scrollProgress: number;
  isRotating?: boolean;
  onToggleRotation?: () => void;
}>(() => import('@/components/landing/OrbitalLattice'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black" />
});

export default function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInteractive, setIsInteractive] = useState(false);
  const [activeMode, setActiveMode] = useState<'surveillance' | 'exploration' | 'strategic'>('surveillance');
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['wells', 'basins', 'licences', 'pending', 'openapp']));
  const [altitude, setAltitude] = useState(10000000);
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [mouseCoords, setMouseCoords] = useState<{ lon: number; lat: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredFeature, setHoveredFeature] = useState<{ x: number, y: number, attributes: any } | null>(null);
  const [isAltitudeSliderVisible, setIsAltitudeSliderVisible] = useState(true);
  const [basemap, setBasemap] = useState('satellite');
  const [showBasins, setShowBasins] = useState(true);
  const [showBlocks, setShowBlocks] = useState(true);
  const [isRotating, setIsRotating] = useState(true);
  const [heroVisible, setHeroVisible] = useState(true);
  const [scanInitiated, setScanInitiated] = useState(false);

  // Scroll handler — maps hero scroll to progress 0→1, then locks globe as interactive
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight; // hero takes 1 full screen, transition over next 0.5
      const transitionHeight = window.innerHeight * 0.8;

      if (scrollY <= 0) {
        setScrollProgress(0);
        setIsInteractive(false);
        setHeroVisible(true);
      } else if (scrollY < transitionHeight) {
        const prog = Math.min(1, scrollY / transitionHeight);
        setScrollProgress(prog);
        setIsInteractive(prog >= 0.85);
        setHeroVisible(prog < 0.95);
      } else {
        setScrollProgress(1);
        setIsInteractive(true);
        setHeroVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLayerToggle = (layer: string) => {
    setActiveLayers((prev) => {
      const newLayers = new Set(prev);
      if (newLayers.has(layer)) {
        newLayers.delete(layer);
      } else {
        newLayers.add(layer);
      }
      return newLayers;
    });
  };

  const scrollToGlobe = useCallback(() => {
    setScanInitiated(true);
    setTimeout(() => {
      window.scrollTo({
        top: window.innerHeight * 0.85,
        behavior: 'smooth',
      });
    }, 600);
  }, []);

  // Globe opacity: fades in from progress 0.4 → 1
  const globeOpacity = scrollProgress < 0.35 ? 0 : Math.min(1, (scrollProgress - 0.35) * 3);
  // Hero content opacity: fades out as user scrolls
  const heroContentOpacity = Math.max(0, 1 - scrollProgress * 2.5);
  // Lattice (stars/network) fades out as globe fades in
  const latticeOpacity = Math.max(0, 1 - scrollProgress * 1.8);

  return (
    <>
      {/* ── Scroll spacer: pushes the sticky area so scrolling is possible ── */}
      <div style={{ height: '180vh' }} aria-hidden="true" />

      {/* ── Sticky full-screen stage ── */}
      <div
        className="fixed inset-0 w-full h-screen bg-[#02040a] overflow-hidden"
        style={{ zIndex: 1 }}
      >
        {/* Atmospheric background gradients */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#06091a] via-[#02040a] to-[#040814]" />
          <div className="absolute bottom-0 left-0 right-0 h-[60vh] bg-gradient-to-t from-blue-900/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)]" />
          {/* Scanline overlay on hero */}
          {heroVisible && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
                opacity: heroContentOpacity * 0.5,
              }}
            />
          )}
        </div>

        {/* ── Orbital Lattice (star/network + satellite) — hero layer ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 25 }}
        >
          <OrbitalLattice
            scrollProgress={scrollProgress}
            isRotating={isRotating}
            onToggleRotation={() => setIsRotating(!isRotating)}
          />
        </div>

        {/* ── ArcGIS Globe — fades in as user scrolls ── */}
        <div
          className="absolute inset-0"
          style={{ opacity: globeOpacity, zIndex: 10, transition: 'opacity 0.15s linear', pointerEvents: isInteractive ? 'auto' : 'none' }}
        >
          <ArcGISGlobe
            scrollProgress={scrollProgress}
            isInteractive={isInteractive}
            activeLayers={activeLayers}
            activeMode={activeMode}
            altitude={altitude}
            onMouseMove={setMouseCoords}
            selectedBlock={selectedBlock}
            onBlockSelect={setSelectedBlock}
            searchQuery={searchQuery}
            onHoverFeature={setHoveredFeature}
            basemap={basemap}
            showBasins={showBasins}
            showBlocks={showBlocks}
            isRotating={isRotating}
          />
        </div>

        {/* ── Hero Overlay (panels, data layers UI) — visible only once globe is interactive ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: scrollProgress >= 0.85 ? Math.min(1, (scrollProgress - 0.85) * 6.67) : 0, zIndex: 40, transition: 'opacity 0.2s linear' }}
        >
          <HeroOverlay
            scrollProgress={scrollProgress}
            isInteractive={isInteractive}
            onLayerToggle={handleLayerToggle}
            activeLayers={activeLayers}
            activeMode={activeMode}
            onModeChange={setActiveMode}
            altitude={altitude}
            onAltitudeChange={setAltitude}
            scrollToPhase={() => { }}
            mouseCoords={mouseCoords}
            selectedBlock={selectedBlock}
            onBlockSelect={setSelectedBlock}
            onSearch={setSearchQuery}
            isAltitudeSliderVisible={isAltitudeSliderVisible}
            basemap={basemap}
            onBasemapChange={setBasemap}
            showBasins={showBasins}
            onShowBasinsToggle={() => setShowBasins(!showBasins)}
            showBlocks={showBlocks}
            onShowBlocksToggle={() => setShowBlocks(!showBlocks)}
            isRotating={isRotating}
            onToggleRotation={() => setIsRotating(!isRotating)}
          />
        </div>

        {/* ── Hero Content (title, CTA) ── */}
        {heroVisible && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ opacity: heroContentOpacity, zIndex: 30, pointerEvents: heroContentOpacity > 0.1 ? 'auto' : 'none' }}
          >
            {/* Horizontal scan line */}
            <div
              className="absolute left-0 right-0 h-px"
              style={{
                top: '50%',
                background: 'linear-gradient(to right, transparent, rgba(180,70,220,0.35) 20%, rgba(180,70,220,0.6) 50%, rgba(180,70,220,0.35) 80%, transparent)',
                boxShadow: '0 0 12px rgba(180,70,220,0.4)',
              }}
            />

            {/* Main title */}
            <div className="text-center px-6" style={{ transform: `translateY(${-scrollProgress * 40}px)` }}>
              {/* Logo mark */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-8 h-px bg-gradient-to-r from-transparent to-purple-400/60" />
                <span
                  className="text-[10px] tracking-[0.4em] text-purple-300/70 uppercase font-light"
                  style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.45em' }}
                >
                  EDAFY INTELLIGENCE
                </span>
                <div className="w-8 h-px bg-gradient-to-l from-transparent to-purple-400/60" />
              </div>

              <h1
                className="font-black uppercase leading-none mb-2"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(3rem, 9vw, 7.5rem)',
                  letterSpacing: '0.12em',
                  color: '#ffffff',
                  textShadow: '0 0 60px rgba(255,255,255,0.15), 0 0 120px rgba(120,80,255,0.1)',
                  lineHeight: 1.02,
                }}
              >
                EDAFY VIRTUAL
                <br />
                DATA ROOM
              </h1>

              <div className="mt-6 mb-10">
                <p
                  className="text-xs tracking-[0.35em] uppercase text-white/50"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  EVALUATE OFFSHORE BLOCKS BEFORE YOU BID
                </p>
              </div>

              {/* CTA Button */}
              <button
                onClick={scrollToGlobe}
                className="group relative inline-flex items-center gap-3 px-8 py-3 overflow-hidden"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {/* Button border lines */}
                <span className="absolute inset-0 border border-white/20 group-hover:border-purple-400/60 transition-colors duration-500" />
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(135deg, rgba(120,60,200,0.08), rgba(60,20,120,0.12))' }}
                />
                {/* Corner accents */}
                <span className="absolute top-0 left-0 w-2 h-px bg-purple-400/80 group-hover:w-6 transition-all duration-300" />
                <span className="absolute top-0 left-0 w-px h-2 bg-purple-400/80 group-hover:h-6 transition-all duration-300" />
                <span className="absolute bottom-0 right-0 w-2 h-px bg-purple-400/80 group-hover:w-6 transition-all duration-300" />
                <span className="absolute bottom-0 right-0 w-px h-2 bg-purple-400/80 group-hover:h-6 transition-all duration-300" />

                <span
                  className="relative text-[10px] tracking-[0.4em] uppercase text-white/60 group-hover:text-purple-300 transition-colors duration-300"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {scanInitiated ? 'SCANNING...' : 'INITIATE SCAN'}
                </span>

                {/* Animated dot */}
                <span
                  className="relative w-1 h-1 rounded-full bg-purple-400/70 group-hover:bg-purple-300"
                  style={{ animation: 'ctaDotPulse 2s ease-in-out infinite' }}
                />
              </button>
            </div>

            {/* Scroll indicator */}
            <div
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
              style={{ opacity: scrollProgress < 0.05 ? 1 : Math.max(0, 1 - scrollProgress * 8) }}
            >
              <span className="text-[9px] tracking-[0.35em] text-white/30 uppercase">SCROLL</span>
              <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" style={{ animation: 'scrollArrow 2s ease-in-out infinite' }} />
              <div className="w-1 h-1 rounded-full bg-white/20" style={{ animation: 'scrollArrow 2s ease-in-out infinite 1s' }} />
            </div>
          </div>
        )}

        {/* Global Hover Tooltip */}
        {hoveredFeature && (
          <div
            className="pointer-events-none fixed z-[9999] transform -translate-x-1/2 -translate-y-[120%]"
            style={{ left: hoveredFeature.x, top: hoveredFeature.y }}
          >
            <div className="bg-black/80 backdrop-blur-md border border-cyan-500/50 px-3 py-2 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.3)] flex flex-col items-center">
              <span className="text-[8px] text-cyan-400 font-bold uppercase tracking-widest">{hoveredFeature.attributes.type}</span>
              <span className="text-xs text-white break-words max-w-[200px] text-center">{hoveredFeature.attributes.name}</span>
              <div className="absolute -bottom-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-cyan-500/50" />
            </div>
          </div>
        )}
      </div>

      {/* Keyframe animations injected inline */}
      <style>{`
        @keyframes ctaDotPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.6); }
        }
        @keyframes scrollArrow {
          0%, 100% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 0.7; transform: translateY(4px); }
        }
      `}</style>
    </>
  );
}
