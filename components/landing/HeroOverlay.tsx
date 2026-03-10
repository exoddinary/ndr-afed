'use client';

import { useState, useEffect } from 'react';
import { ScrollAnimationController } from '@/lib/scroll-animation';
import { blockPromotionData } from '@/data/blockPromotion';
import { useRouter } from 'next/navigation';

interface HeroOverlayProps {
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
}

export default function HeroOverlay({
  scrollProgress,
  isInteractive,
  onLayerToggle,
  activeLayers,
  activeMode,
  altitude,
  onAltitudeChange,
  mouseCoords,
  selectedBlock,
  onBlockSelect,
  onSearch,
  isAltitudeSliderVisible,
  basemap,
  onBasemapChange,
  showBasins,
  onShowBasinsToggle,
  showBlocks,
  onShowBlocksToggle,
  isRotating,
  onToggleRotation,
}: HeroOverlayProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [intelTab, setIntelTab] = useState<'basin' | 'block'>('basin');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPromoBlock, setSelectedPromoBlock] = useState<any>(null);
  const [showBlockDetail, setShowBlockDetail] = useState(false);
  const [hoveredBasemapLabel, setHoveredBasemapLabel] = useState<string | null>(null);

  const stats = {
    running: blockPromotionData.filter(p => p.status === 'Running').length,
    pending: blockPromotionData.filter(p => p.status === 'Pending award').length,
    openapp: blockPromotionData.filter(p => p.status === 'Open applications').length,
  };

  const searchSuggestions = [
    { name: 'Santos Basin', type: 'Basin' },
    { name: 'Malay Basin', type: 'Basin' },
    { name: 'Block F17-A', type: 'Block' },
    { name: 'Block G/12', type: 'Block' },
    { name: 'North Sea', type: 'Basin' }
  ];

  useEffect(() => {
    if (selectedBlock) {
      if (selectedBlock.type === 'Exploration Block' || selectedBlock.type === 'licences' || selectedBlock.details?.isPromoted) {
        setIntelTab('block');
        setShowBlockDetail(true);
      } else {
        setIntelTab('basin');
      }
    }
  }, [selectedBlock]);

  const handleAltitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAltitudeChange(Number(e.target.value));
  };

  const opportunities = [
    {
      id: 1,
      name: 'North Sea F03-A',
      status: 'upcoming',
      bidDeadline: '2026-06-15',
      type: 'Oil/Gas',
      recovery: '450 MMBoe',
      risk: 'Medium',
      operator: 'Edafy Partners'
    },
    {
      id: 2,
      name: 'Malay Basin G-12',
      status: 'active',
      bidDeadline: '2026-04-20',
      type: 'Gas',
      recovery: '1.2 Tcf',
      risk: 'Low',
      operator: 'Petronas Global'
    },
    {
      id: 3,
      name: 'Santos Basin Pre-Salt',
      status: 'pending',
      bidDeadline: '2026-08-30',
      type: 'Deepwater Oil',
      recovery: '2.8 Bn BOE',
      risk: 'High',
      operator: 'Shell/Petrobras'
    },
    {
      id: 4,
      name: 'Baram Delta Block B',
      status: 'upcoming',
      bidDeadline: '2026-11-12',
      type: 'Oil',
      recovery: '320 MMBoe',
      risk: 'Low',
      operator: 'Brunei Energy'
    }
  ];

  const handleEnterWorkspace = () => {
    router.push('/workspace');
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col">
      <div className="absolute inset-0 bg-transparent transition-opacity duration-1000" style={{ zIndex: 5 }}></div>

      {/* Intro Reveal */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 md:px-8 text-center transition-all duration-700"
        style={{
          opacity: ScrollAnimationController.getHeroOpacity(scrollProgress),
          visibility: ScrollAnimationController.getPanelVisibility(scrollProgress) === 'visible' ? 'hidden' : 'visible',
          transform: `translateY(${scrollProgress * -100}px)`,
          backdropFilter: ScrollAnimationController.getBlurAmount(scrollProgress) > 0 ? `blur(${ScrollAnimationController.getBlurAmount(scrollProgress)}px)` : 'none',
          zIndex: 50
        }}
      >
        <div className="flex flex-col items-center transform transition-all duration-700 max-w-4xl" style={{ opacity: Math.max(0, 1 - scrollProgress * 3) }}>
          <h1 className="text-[61.5px] md:text-[97.5px] font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] mb-8 text-center leading-tight">
            EDAFY VIRTUAL DATA ROOM
          </h1>
          <div className="h-[2px] w-64 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-8"></div>
          <p className="text-[15.5px] md:text-[17.5px] tracking-[0.2em] text-white/70 font-light mb-16 text-center max-w-2xl leading-relaxed">
            EVALUATE OFFSHORE BLOCKS BEFORE YOU BID
          </p>

          {/* Enter Workspace Button - Only visible before scroll */}
          <button
            onClick={handleEnterWorkspace}
            className="pointer-events-auto group relative inline-flex items-center gap-3 px-8 py-3 overflow-hidden bg-cyan-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-full hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105"
          >
            <span className="relative text-[10px] tracking-[0.4em] uppercase text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300">
              Enter Workspace
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-cyan-400">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex flex-col items-center gap-6 animate-pulse opacity-60 mt-12">
            <span className="text-[11.5px] tracking-[0.8em] uppercase text-cyan-500 font-bold">Initiate Scan</span>
            <div className="w-[1px] h-16 bg-gradient-to-b from-cyan-500 via-cyan-500/50 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Top Header */}
      <div
        className="w-full h-24 flex items-center justify-between px-[4%] relative z-[60] transition-all duration-700"
        style={{ opacity: ScrollAnimationController.getPanelOpacity(scrollProgress), visibility: ScrollAnimationController.getPanelVisibility(scrollProgress) }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/vdr-logo.png" alt="VDR Logo" className="h-8 md:h-10 object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]" />
            <div className="flex flex-col">
              <span className="text-white font-bold text-[12.5px] md:text-[14.5px] tracking-[0.4em] uppercase">EDAFY VIRTUAL DATA ROOM</span>
              <span className="text-cyan-500/50 font-light text-[9.5px] tracking-[0.3em] uppercase">Data Intelligence</span>
            </div>
          </div>
        </div>

        {/* Search Bar - Absolutely Centered */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto group">
          <div className="flex items-center bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full px-5 py-2.5 w-[460px] shadow-2xl transition-all focus-within:border-white/20 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/40 mr-4"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input
              type="text"
              placeholder="Search Basin, Block, or Opportunity..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearch(searchQuery);
                  setShowSuggestions(false);
                }
              }}
              className="bg-transparent border-none outline-none text-[10.5px] text-white/80 tracking-[0.2em] uppercase w-full placeholder:text-white/10 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="ml-2 text-white/20 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {showSuggestions && searchQuery.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-[#050B14]/95 backdrop-blur-3xl border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-5 py-2.5 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <span className="text-[10.5px] text-white/40 uppercase tracking-widest font-bold">Search Results</span>
                <span className="text-[9.5px] text-cyan-500/60 uppercase font-mono">Press Enter to wide search</span>
              </div>
              <div className="max-h-[350px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-cyan-500/30">
                {[...searchSuggestions, ...opportunities.map(o => ({ name: o.name, type: 'Opportunity' }))]
                  .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearchQuery(s.name);
                        onSearch(s.name);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-cyan-500/10 transition-colors group/item border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${s.type === 'Basin' ? 'bg-orange-500' : s.type === 'Block' ? 'bg-cyan-500' : 'bg-pink-500'}`}></div>
                        <span className="text-[12.5px] text-white/70 uppercase tracking-widest group-hover/item:text-white transition-colors">{s.name}</span>
                      </div>
                      <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-white/5 text-white/30 uppercase tracking-widest group-hover/item:bg-cyan-500/20 group-hover/item:text-cyan-400 transition-all border border-white/5">{s.type}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Enter Workspace Button in Header */}
        <div className="flex items-center gap-6 pointer-events-auto">
          <button
            onClick={handleEnterWorkspace}
            className="flex items-center gap-2 px-5 py-2 bg-cyan-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-full hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300"
          >
            <span className="text-[10.5px] tracking-[0.2em] uppercase text-cyan-400 font-bold">Workspace</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-cyan-400">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          <div className="text-right">
            <div className="text-[10.5px] tracking-widest text-white/40 uppercase">Coordinates</div>
            <div className="text-[11.5px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
              {mouseCoords ? `${mouseCoords.lat.toFixed(4)}°N, ${mouseCoords.lon.toFixed(4)}°E` : '---'}
            </div>
          </div>
        </div>
      </div>

      {/* Main UI Container */}
      <div className="flex-1 relative w-full h-full transition-all duration-700"
        style={{ opacity: ScrollAnimationController.getPanelOpacity(scrollProgress), visibility: ScrollAnimationController.getPanelVisibility(scrollProgress), zIndex: 40 }}>

        {/* Return to Globe Button */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto transition-all duration-700 ${selectedBlock ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`} style={{ zIndex: 100 }}>
          <button onClick={() => { onBlockSelect(null); onSearch(''); }} className="flex items-center gap-2 px-8 py-3 bg-black/80 backdrop-blur-3xl border border-cyan-500/50 rounded-full text-cyan-400 text-[12.5px] font-extrabold tracking-[0.3em] uppercase hover:bg-cyan-500/20 hover:text-white transition-all shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:scale-105 active:scale-95">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Return to Globe View
          </button>
        </div>

        {/* VERTICAL ALTITUDE SLIDER */}
        <div className={`absolute left-[3%] top-[20px] bottom-[40px] pointer-events-auto flex flex-col items-center justify-between py-6 z-50 w-16 bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.05)] transition-all duration-500 ${isAltitudeSliderVisible ? 'translate-x-0 opacity-100' : '-translate-x-32 opacity-0'}`}>
          <span className="text-[9.5px] font-bold text-white/50 tracking-[0.2em] uppercase">Basin</span>
          <div className="relative flex-1 w-[2px] bg-white/5 my-4 flex justify-center">
            <input
              type="range"
              min="100000"
              max="24000000"
              step="100000"
              value={24100000 - altitude}
              onChange={(e) => onAltitudeChange(24100000 - Number(e.target.value))}
              className="absolute w-[100vh] h-10 opacity-0 cursor-pointer origin-center transform -rotate-90 z-20 top-1/2 -translate-y-1/2"
              style={{ WebkitAppearance: 'none' }}
            />
            <div className="absolute bottom-24 pointer-events-none w-full flex justify-center">
              <span className="text-[9.5px] font-bold text-white/20 uppercase tracking-[0.4em] transform -rotate-90 whitespace-nowrap origin-center">
                Altitude Slider
              </span>
            </div>
            <div className="absolute w-full pointer-events-none transition-all duration-300" style={{ bottom: 0, height: `${((altitude - 100000) / 23900000) * 100}%` }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] border border-cyan-200"></div>
            </div>
          </div>
          <span className="text-[9.5px] font-bold text-white/50 tracking-[0.2em] uppercase">Block</span>
        </div>

        {/* LEFT SIDE PANELS - Licensing (Top) & Intelligence (Bottom) */}
        <div className={`absolute top-[20px] bottom-[40px] pointer-events-none flex transition-all duration-700 ${isAltitudeSliderVisible ? 'left-[7.2%]' : 'left-[3%]'} ${leftCollapsed ? '-translate-x-[92%]' : 'translate-x-0'}`}>
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 pointer-events-auto z-50">
            <button onClick={() => setLeftCollapsed(!leftCollapsed)} className="w-6 h-32 bg-[#0A1622] border-y border-r border-cyan-500/30 rounded-r-xl flex items-center justify-center group hover:bg-[#112538] transition-all shadow-[4px_0_15px_rgba(0,0,0,0.5)]">
              <div className="w-1 h-12 rounded-full bg-cyan-500/60 group-hover:bg-cyan-400 transition-all"></div>
            </button>
          </div>

          <div className="flex flex-col gap-4 w-[340px] h-full">
            {/* 1. LICENSING STATUS PANEL - Compact Redesign */}
            <div className="w-full pointer-events-auto flex flex-col bg-[#080f1b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all h-fit">
              <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <h3 className="text-[11px] font-bold text-white tracking-[0.3em] uppercase">Licensing Status</h3>
                </div>
                <span className="text-[8.5px] font-bold text-cyan-500/50 uppercase tracking-tighter">LIVE</span>
              </div>
              <div className="p-1.5 flex gap-1.5">
                {[
                  { id: 'licences', color: 'bg-yellow-500', label: 'Running', count: stats.running },
                  { id: 'pending', color: 'bg-green-400', label: 'Pending', count: stats.pending },
                  { id: 'openapp', color: 'bg-red-500', label: 'Open', count: stats.openapp }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onLayerToggle(item.id)}
                    className={`flex-1 flex items-center justify-between p-2 rounded-xl border transition-all ${activeLayers.has(item.id) ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-transparent border-white/5 hover:bg-white/[0.02]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                      <span className="text-[10.5px] font-bold text-white/50 uppercase tracking-tighter">{item.label}</span>
                    </div>
                    <span className="text-[10.5px] font-bold text-white/30 font-mono">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. INTELLIGENCE PANEL - Bottom */}
            <div className="w-full pointer-events-auto bg-[#080f1b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all flex flex-col flex-1 min-h-0">
              <div className="px-5 py-4 border-b border-white/[0.08] flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]"></div>
                  <h3 className="text-[11px] font-bold text-white tracking-[0.3em] uppercase">Intelligence Panel</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIntelTab('basin')} className={`flex-1 py-1.5 text-[10.5px] font-bold uppercase tracking-widest rounded-lg border transition-all ${intelTab === 'basin' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5'}`}>Basin</button>
                  <button onClick={() => setIntelTab('block')} className={`flex-1 py-1.5 text-[10.5px] font-bold uppercase tracking-widest rounded-lg border transition-all ${intelTab === 'block' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5'}`}>Block</button>
                </div>
              </div>
              <div className="p-5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-cyan-600/50">
                {intelTab === 'basin' ? (
                  <div className="space-y-4">
                    <h4 className="text-[14.5px] font-bold text-white tracking-widest uppercase mb-4">{selectedBlock?.type === 'Basin' ? selectedBlock.name : (selectedBlock?.name || 'Central North Sea')}</h4>
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Cumulative Oil (MMbbl)</span>
                        <span className="text-[21.5px] font-bold text-cyan-400 tracking-tighter">{selectedBlock?.details?.CUM_OIL || (selectedBlock?.type === 'Basin' ? '425.8' : '1,240.5')}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Known Gas (Bcf)</span>
                        <span className="text-[15.5px] font-bold text-white">{selectedBlock?.details?.KWN_GAS || (selectedBlock?.type === 'Basin' ? '3,150.2' : '8,420.0')}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Cumulative Gas (Bcf)</span>
                        <span className="text-[15.5px] font-bold text-white tracking-widest">{selectedBlock?.details?.CUM_GAS || (selectedBlock?.type === 'Basin' ? '1,840.5' : '4,960.2')}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Undiscovered Oil (MMbbl)</span>
                        <span className="text-[15.5px] font-mono text-white tracking-widest">{selectedBlock?.details?.UNDS_OIL || (selectedBlock?.type === 'Basin' ? '850.0' : '2,100.5')}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Undiscovered Gas (Bcf)</span>
                        <span className="text-[15.5px] font-mono text-emerald-400">{selectedBlock?.details?.UNDS_GAS || (selectedBlock?.type === 'Basin' ? '5,400.0' : '12,850.0')}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-[14.5px] font-bold text-white tracking-widest uppercase mb-4">
                      {selectedBlock?.details?.isPromoted ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                          {selectedBlock.name}
                        </div>
                      ) : (
                        (selectedBlock?.type === 'Exploration Block' || selectedBlock?.type === 'licences') ? selectedBlock.name : 'No Block Selected'
                      )}
                    </h4>

                    {selectedBlock?.details?.isPromoted ? (
                      <div className="space-y-4">
                        <div className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/5">
                          <span className="text-[9.5px] text-cyan-400 uppercase tracking-widest mb-1.5 font-bold">Executive Snapshot</span>
                          <span className="text-[12.5px] text-white/90 leading-relaxed font-medium">{selectedBlock.details.promoDetails?.executiveSnapshot}</span>
                        </div>
                        <div className="space-y-3.5">
                          <div className="flex flex-col">
                            <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Geological Setting & Key Plays</span>
                            <span className="text-[11.5px] text-white/80 leading-relaxed italic">{selectedBlock.details.promoDetails?.geologicalSetting}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Nearby Discoveries (Analogs)</span>
                            <span className="text-[11.5px] text-cyan-300/80 font-medium">{selectedBlock.details.promoDetails?.nearbyDiscovery}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Nearest Facilities / Export</span>
                            <span className="text-[11.5px] text-white/70 leading-tight">{selectedBlock.details.promoDetails?.nearestFacilities}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Data Availability (Seismic/Wells)</span>
                            <span className="text-[11.5px] text-white/70">{selectedBlock.details.promoDetails?.dataAvailability}</span>
                          </div>
                          <div className="flex flex-col p-2.5 bg-red-500/5 rounded-lg border border-red-500/10">
                            <span className="text-[9px] text-red-400 uppercase tracking-[0.2em] mb-1 font-bold">Key Technical Risks</span>
                            <span className="text-[9.5px] text-white/60 leading-snug">{selectedBlock.details.promoDetails?.keyRisks}</span>
                          </div>
                          {selectedBlock.details.promoDetails?.suggestedWorkProgram && selectedBlock.details.promoDetails?.suggestedWorkProgram !== '-' && (
                            <div className="flex flex-col">
                              <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Suggested Work Program</span>
                              <span className="text-[11.5px] text-white/70">{selectedBlock.details.promoDetails?.suggestedWorkProgram}</span>
                            </div>
                          )}
                          {selectedBlock.details.promoDetails?.farmInAsk && selectedBlock.details.promoDetails?.farmInAsk !== '-' && (
                            <div className="flex flex-col">
                              <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Farm-in Ask (Illustrative)</span>
                              <span className="text-[11.5px] text-white/70">{selectedBlock.details.promoDetails?.farmInAsk}</span>
                            </div>
                          )}
                          {selectedBlock.details.promoDetails?.decisionCatalysts && selectedBlock.details.promoDetails?.decisionCatalysts !== '-' && (
                            <div className="flex flex-col">
                              <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Decision Catalysts</span>
                              <span className="text-[11.5px] text-white/70">{selectedBlock.details.promoDetails?.decisionCatalysts}</span>
                            </div>
                          )}
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={() => setSelectedPromoBlock(selectedBlock.details.promoDetails)}
                            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black text-[11.5px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_4px_20px_rgba(34,211,238,0.3)] hover:scale-[1.02] active:scale-[0.98]">
                            View Data Room
                          </button>
                        </div>
                      </div>
                    ) : (selectedBlock?.type === 'Exploration Block' || selectedBlock?.type === 'licences') ? (
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Prospectivity Index</span>
                          <span className="text-[15.5px] font-bold text-cyan-400">High</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Most Likely Play Type</span>
                          <span className="text-[15.5px] font-bold text-white">Stratigraphic Traps</span>
                        </div>
                        <div className="pt-2">
                          <button className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-500 text-cyan-100 text-[10.5px] font-bold uppercase tracking-[0.2em] rounded-lg transition-all border border-cyan-500/30">
                            Request Data Room
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-[11.5px] text-white/40 uppercase tracking-widest">Select an exploration block to view metrics</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE PANEL - Layer Control (Top) & Opportunities (Bottom) */}
        <div className={`absolute top-[20px] bottom-[40px] w-[350px] xl:w-[420px] pointer-events-none flex flex-col gap-4 transition-all duration-700 ${rightCollapsed ? 'translate-x-[92%]' : 'translate-x-0'}`} style={{ right: '4%' }}>
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 pointer-events-auto z-50">
            <button onClick={() => setRightCollapsed(!rightCollapsed)} className="w-6 h-32 bg-[#0A1622]/95 backdrop-blur-xl border-y border-l border-cyan-500/30 rounded-l-xl flex items-center justify-center group hover:bg-[#112538]/95 transition-all shadow-[-4px_0_15px_rgba(0,0,0,0.5)]">
              <div className="w-1 h-12 rounded-full bg-cyan-500/60 transition-all"></div>
            </button>
          </div>

          {/* LAYER CONTROL PANEL - Right Top */}
          <div className="w-full pointer-events-auto bg-[#080f1b] border border-white/[0.12] rounded-2xl p-3 flex flex-col gap-2.5 shadow-[0_4px_40px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]"></div>
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-[0.3em]">Global Layer Control</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onShowBasinsToggle}
                className={`flex-1 py-1.5 rounded-lg border text-[9.5px] font-bold tracking-widest uppercase transition-all ${showBasins ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-white/5 border-white/5 text-white/20'}`}
              >
                Basins {showBasins ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={onShowBlocksToggle}
                className={`flex-1 py-1.5 rounded-lg border text-[9.5px] font-bold tracking-widest uppercase transition-all ${showBlocks ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/5 text-white/20'}`}
              >
                Blocks {showBlocks ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="h-[1px] bg-white/5"></div>

            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <span className="text-[9.5px] font-bold text-white/30 uppercase tracking-[0.2em]">Appearance</span>
                <div className="h-3 flex items-center">
                  <span className={`text-[8.5px] font-bold text-cyan-400/80 uppercase tracking-widest transition-all duration-300 ${hoveredBasemapLabel ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
                    {hoveredBasemapLabel}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5">
                {[
                  { id: 'gray-vector', label: 'Light Mode', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg> },
                  { id: 'hybrid', label: 'Hybrid View', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg> },
                  { id: 'topo-vector', label: 'Terrain View', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> },
                  { id: 'satellite', label: 'Toggle Rotation', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a10 10 0 1010 10H12V2z" /><path d="M12 12L2.69 7.03A10 10 0 0112 2v10z" /><path d="M12 12v10a10 10 0 01-9.31-6.97L12 12z" /></svg> }
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      if (b.id === 'satellite') {
                        onToggleRotation();
                      } else {
                        onBasemapChange(b.id);
                      }
                    }}
                    onMouseEnter={() => setHoveredBasemapLabel(b.label)}
                    onMouseLeave={() => setHoveredBasemapLabel(null)}
                    className={`p-2 rounded-lg border transition-all flex items-center justify-center hover:scale-110 active:scale-95 ${b.id === 'satellite' ? (isRotating ? 'bg-cyan-500/30 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-white/5 border-white/5 text-white/30 hover:border-cyan-500/30 hover:text-cyan-400') : (basemap === b.id ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-white/30 hover:bg-white/5 hover:border-white/20 hover:text-white')}`}
                  >
                    {b.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ACTIVE OPPORTUNITIES - Right Bottom */}
          <div className="pointer-events-auto bg-[#080f1b] border border-white/[0.12] rounded-2xl flex flex-col shadow-[0_4px_40px_rgba(0,0,0,0.7)] transition-all flex-1 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]"></div>
                <h3 className="text-[11px] font-bold text-white tracking-[0.3em] uppercase">Active Opportunities</h3>
              </div>
              <p className="text-[10px] text-white/40 tracking-widest">Active Licensing Offers & Announcements</p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10">
              {showBlockDetail && selectedBlock && (selectedBlock.type === 'Exploration Block' || selectedBlock.type === 'licences' || selectedBlock.type === 'Basin' || selectedBlock.details?.isPromoted) ? (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <button
                    onClick={() => {
                      onBlockSelect(null);
                      setShowBlockDetail(false);
                    }}
                    className="flex items-center gap-2 text-[10.5px] text-cyan-400 uppercase tracking-widest font-bold hover:text-white transition-colors mb-4"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back to All Offers
                  </button>

                  <div className="p-6 border border-cyan-500/30 rounded-2xl bg-cyan-500/5 space-y-5">
                    <div className="flex justify-between items-start">
                      <h4 className="text-[19.5px] font-bold text-white tracking-widest uppercase leading-tight">{selectedBlock.name}</h4>
                      <span className="px-2 py-1 text-[9.5px] font-bold tracking-widest text-cyan-400 uppercase border border-cyan-500/40 rounded bg-cyan-500/20">{selectedBlock.details?.promoDetails?.status || 'Active'}</span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Location</span>
                        <span className="text-[12.5px] text-white/80">{selectedBlock.details?.promoDetails?.location}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Area</span>
                          <span className="text-[12.5px] text-white font-bold">{selectedBlock.details?.promoDetails?.area}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Depth</span>
                          <span className="text-[12.5px] text-white font-bold">{selectedBlock.details?.promoDetails?.waterDepth}</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9.5px] text-white/40 uppercase tracking-widest mb-1">Technical Highlight</span>
                        <span className="text-[12.5px] text-white/70 italic leading-relaxed pr-2">{selectedBlock.details?.promoDetails?.geologicalSetting}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPromoBlock(selectedBlock.details?.promoDetails)}
                      className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black text-[11.5px] uppercase font-black tracking-[0.2em] rounded-xl transition-all shadow-[0_5px_15px_rgba(34,211,238,0.3)]">
                      View Data Room
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-5 border border-white/10 rounded-2xl bg-white/[0.02] space-y-4 group transition-all">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[15.5px] font-bold text-white group-hover:text-cyan-400 transition-colors uppercase">North Sea F03-A</h4>
                      <span className="px-2 py-1 text-[9.5px] font-bold tracking-widest text-white/60 uppercase border border-white/20 rounded bg-white/5">Announcement</span>
                    </div>
                    <p className="text-[12.5px] text-white/50 leading-relaxed pt-1">High-potential exploration block in the central F-Quadrant with confirmed shallow gas signatures.</p>

                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5">
                      <div className="flex flex-col gap-1">
                        <span className="text-white/40 uppercase text-[9.5px] tracking-widest">Expected</span>
                        <span className="text-white font-mono text-[12.5px] tracking-widest">Q3 2026</span>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-white/40 uppercase text-[9.5px] tracking-widest">Status</span>
                        <span className="text-emerald-400 font-mono text-[12.5px] tracking-widest uppercase">Verified</span>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[11.5px] uppercase font-bold tracking-[0.2em] rounded-lg transition-all flex items-center justify-center gap-2">
                      View Opportunity
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </button>
                  </div>

                  {blockPromotionData.map((promo, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        onBlockSelect({ name: promo.name, details: { isPromoted: true, promoDetails: promo }, type: 'Exploration Block' });
                        setShowBlockDetail(true);
                      }}
                      className="p-5 border border-cyan-500/20 rounded-2xl bg-cyan-500/5 space-y-4 group transition-all hover:bg-cyan-500/10 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                          <h4 className="text-[14.5px] font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{promo.name}</h4>
                        </div>
                        <span className="px-2 py-0.5 text-[8.5px] font-bold tracking-widest text-cyan-400 uppercase border border-cyan-500/40 rounded bg-cyan-500/20">
                          {promo.status}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[11.5px] text-white/50 leading-relaxed italic border-l-2 border-cyan-500/30 pl-3">
                          {promo.geologicalSetting.substring(0, 100)}...
                        </p>

                        <div className="grid grid-cols-2 gap-3 py-2 border-y border-white/5 text-[10.5px]">
                          <div className="flex flex-col">
                            <span className="text-white/30 uppercase text-[8.5px] tracking-widest mb-0.5">Area & Depth</span>
                            <span className="text-white font-mono">{promo.area} / {promo.waterDepth}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-white/30 uppercase text-[8.5px] tracking-widest mb-0.5">Analogs</span>
                            <span className="text-cyan-400 font-mono text-right truncate w-full">{promo.nearbyDiscovery}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BLOCK DETAILS POPUP MODAL */}
      {
        selectedPromoBlock && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-auto bg-black/60 backdrop-blur-md transition-all duration-300">
            <div className="w-full max-w-2xl bg-[#0A1622]/95 border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.6)]"></div>
                  <div>
                    <h2 className="text-[21.5px] font-bold text-white tracking-widest uppercase">{selectedPromoBlock.name}</h2>
                    <span className="text-[11.5px] text-cyan-400 font-bold tracking-[0.3em] uppercase">{selectedPromoBlock.status}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPromoBlock(null)}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-cyan-500/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex flex-col">
                      <span className="text-[10.5px] text-white/40 uppercase tracking-[0.2em] mb-2 font-bold">Executive Snapshot</span>
                      <p className="text-white/80 leading-relaxed text-[15.5px]">{selectedPromoBlock.executiveSnapshot || selectedPromoBlock.location}</p>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10.5px] text-white/40 uppercase tracking-[0.2em] mb-2 font-bold">Nearest Facilities / Export</span>
                      <p className="text-white/80 leading-relaxed text-[15.5px]">{selectedPromoBlock.nearestFacilities}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col">
                      <span className="text-[10.5px] text-white/40 uppercase tracking-[0.2em] mb-2 font-bold">Nearby Discoveries (Analogs)</span>
                      <p className="text-cyan-400 text-[15.5px] italic font-medium leading-relaxed">{selectedPromoBlock.nearbyDiscovery}</p>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10.5px] text-white/40 uppercase tracking-[0.2em] mb-2 font-bold">Data Availability</span>
                      <p className="text-white/80 leading-relaxed text-[15.5px]">{selectedPromoBlock.dataAvailability}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
                  <span className="text-[10.5px] text-cyan-400 uppercase tracking-[0.2em] mb-3 font-bold">Geological Setting & Key Plays</span>
                  <p className="text-white/70 text-[15.5px] leading-relaxed italic border-l-2 border-cyan-500/40 pl-5">
                    &quot;{selectedPromoBlock.geologicalSetting}&quot;
                  </p>
                </div>

                <div className="flex flex-col p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
                  <span className="text-[10.5px] text-red-400 uppercase tracking-[0.2em] mb-2 font-bold">Key Risks (Tech & Commercial)</span>
                  <p className="text-white/70 text-[15.5px] leading-relaxed">
                    {selectedPromoBlock.keyRisks}
                  </p>
                </div>

                {(selectedPromoBlock.suggestedWorkProgram && selectedPromoBlock.suggestedWorkProgram !== '-') ||
                  (selectedPromoBlock.farmInAsk && selectedPromoBlock.farmInAsk !== '-') ||
                  (selectedPromoBlock.decisionCatalysts && selectedPromoBlock.decisionCatalysts !== '-') ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {selectedPromoBlock.suggestedWorkProgram && selectedPromoBlock.suggestedWorkProgram !== '-' && (
                      <div className="flex flex-col">
                        <span className="text-[10.5px] text-white/40 uppercase tracking-[0.2em] mb-2 font-bold">Suggested Work Program</span>
                        <p className="text-white/80 leading-relaxed text-[15.5px]">{selectedPromoBlock.suggestedWorkProgram}</p>
                      </div>
                    )}
                    {selectedPromoBlock.farmInAsk && selectedPromoBlock.farmInAsk !== '-' && (
                      <div className="flex flex-col">
                        <span className="text-[10.5px] text-white/40 uppercase tracking-[0.2em] mb-2 font-bold">Farm-in Ask</span>
                        <p className="text-white/80 leading-relaxed text-[15.5px]">{selectedPromoBlock.farmInAsk}</p>
                      </div>
                    )}
                    {selectedPromoBlock.decisionCatalysts && selectedPromoBlock.decisionCatalysts !== '-' && (
                      <div className="flex flex-col">
                        <span className="text-[10.5px] text-white/40 uppercase tracking-[0.2em] mb-2 font-bold">Decision Catalysts</span>
                        <p className="text-white/80 leading-relaxed text-[15.5px]">{selectedPromoBlock.decisionCatalysts}</p>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => router.push('/workspace')}
                    className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-400 text-black text-[13.5px] font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-[0_10px_30px_rgba(34,211,238,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Launch Virtual Data Room
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
