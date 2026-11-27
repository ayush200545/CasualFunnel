import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  MousePointer, 
  Eye, 
  Layers, 
  Grid, 
  Sliders, 
  ExternalLink, 
  Info, 
  Sparkles,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { api } from '../api';

export default function HeatmapView({ onOpenDemo }) {
  const [pages, setPages] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [clickData, setClickData] = useState(null);
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingClicks, setLoadingClicks] = useState(false);
  const [error, setError] = useState(null);

  // Visualization settings
  const [viewMode, setViewMode] = useState('dots'); // 'dots' | 'density' | 'grid'
  const [dotRadius, setDotRadius] = useState(24);
  const [opacity, setOpacity] = useState(0.75);
  const [hoveredClick, setHoveredClick] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  // Load available pages on mount
  const fetchPages = async () => {
    try {
      setLoadingPages(true);
      setError(null);
      const res = await api.getHeatmapPages();
      const pageList = res.data || [];
      setPages(pageList);

      if (pageList.length > 0 && !selectedUrl) {
        setSelectedUrl(pageList[0].url);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch tracked pages');
    } finally {
      setLoadingPages(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  // Fetch click data whenever selected URL changes
  useEffect(() => {
    if (!selectedUrl) return;

    const fetchClicks = async () => {
      try {
        setLoadingClicks(true);
        setError(null);
        const res = await api.getHeatmapClicks(selectedUrl);
        setClickData(res);
      } catch (err) {
        setError(err.message || 'Failed to fetch heatmap data');
        setClickData(null);
      } finally {
        setLoadingClicks(false);
      }
    };

    fetchClicks();
  }, [selectedUrl]);

  // Handle hover tooltip for individual dots
  const handleMouseEnterDot = (click, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredClick(click);
    setTooltipPos({
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 10,
    });
  };

  const clicks = clickData?.clicks || [];

  // Calculate 10x10 Grid Density distribution
  const gridCells = Array(10).fill(0).map(() => Array(10).fill(0));
  let maxCellClicks = 1;
  if (clicks.length > 0) {
    clicks.forEach((c) => {
      const normX = c.normalizedX != null ? c.normalizedX : (c.x / (c.viewportWidth || 1440)) * 100;
      const normY = c.normalizedY != null ? c.normalizedY : (c.y / (c.viewportHeight || 900)) * 100;
      const col = Math.min(9, Math.max(0, Math.floor(normX / 10)));
      const row = Math.min(9, Math.max(0, Math.floor(normY / 10)));
      gridCells[row][col] += 1;
      if (gridCells[row][col] > maxCellClicks) {
        maxCellClicks = gridCells[row][col];
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Page URL Selector */}
          <div className="flex-1 max-w-2xl space-y-1">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Select Tracked Page URL</span>
              <span className="text-slate-400 font-normal">({pages.length} pages recorded)</span>
            </label>
            <div className="relative">
              <select
                value={selectedUrl}
                onChange={(e) => setSelectedUrl(e.target.value)}
                disabled={loadingPages}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
              >
                {pages.length === 0 ? (
                  <option value="">No tracked pages found</option>
                ) : (
                  pages.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.url} — {p.clicks} clicks, {p.pageViews} views ({p.uniqueSessionCount} sessions)
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
              Mode:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
              <button
                onClick={() => setViewMode('dots')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                  viewMode === 'dots'
                    ? 'bg-white text-sky-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MousePointer className="h-3.5 w-3.5" />
                <span>Dot Map</span>
              </button>

              <button
                onClick={() => setViewMode('density')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                  viewMode === 'density'
                    ? 'bg-white text-rose-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="h-3.5 w-3.5 text-rose-500" />
                <span>Glow Density</span>
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                <span>10x10 Grid</span>
              </button>
            </div>

            <button
              onClick={fetchPages}
              title="Refresh Page List"
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sliders / Fine Tuning */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-slate-500">Dot Radius:</span>
              <input
                type="range"
                min="12"
                max="60"
                value={dotRadius}
                onChange={(e) => setDotRadius(Number(e.target.value))}
                className="w-24 accent-sky-600 cursor-pointer"
              />
              <span className="w-6 text-slate-700 font-mono">{dotRadius}px</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-medium text-slate-500">Opacity:</span>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-24 accent-sky-600 cursor-pointer"
              />
              <span className="w-8 text-slate-700 font-mono">{Math.round(opacity * 100)}%</span>
            </div>
          </div>

          {clickData && (
            <div className="flex items-center space-x-4 font-medium text-slate-600">
              <span className="text-slate-900 font-bold">{clickData.totalClicks} Total Clicks</span>
              <span>•</span>
              <span>{clickData.totalPageViews} Views</span>
              <span>•</span>
              <span>{clickData.uniqueSessions} Unique Visitors</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Heatmap Canvas Visualizer */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Canvas Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Visual Click Surface</span>
            <span className="bg-sky-100 text-sky-800 font-medium px-2 py-0.5 rounded">
              Standard Viewport (1440 × 900)
            </span>
          </div>
          <div className="flex items-center space-x-2 text-slate-500">
            <Info className="h-3.5 w-3.5" />
            <span>Hover on dots to inspect click targets & coordinates</span>
          </div>
        </div>

        {/* Canvas Viewport Frame */}
        <div className="p-6 bg-slate-900 flex justify-center items-center overflow-x-auto min-h-[580px]">
          {loadingClicks ? (
            <div className="text-center text-slate-400 py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
              <p>Rendering click heatmap overlay...</p>
            </div>
          ) : clicks.length === 0 ? (
            <div className="text-center text-slate-400 py-20">
              <MousePointer className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No clicks recorded for this page URL yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Open the Live Demo Store to generate user clicks on this page.
              </p>
              <button
                onClick={onOpenDemo}
                className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Go to Demo Store</span>
              </button>
            </div>
          ) : (
            <div
              className="relative bg-white rounded-lg shadow-2xl border border-slate-700 overflow-hidden"
              style={{
                width: '100%',
                maxWidth: '1000px',
                aspectRatio: '16 / 10',
                minHeight: '520px',
              }}
            >
              {/* Background Mock Wireframe simulating webpage layout */}
              <div className="absolute inset-0 select-none pointer-events-none p-6 flex flex-col justify-between opacity-35 bg-gradient-to-b from-slate-50 to-white">
                {/* Header mock */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="h-6 w-32 bg-slate-300 rounded" />
                  <div className="flex space-x-3">
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                    <div className="h-4 w-20 bg-slate-300 rounded" />
                  </div>
                </div>

                {/* Hero / Content mock */}
                <div className="space-y-4 my-auto">
                  <div className="h-8 w-2/3 bg-slate-300 rounded mx-auto" />
                  <div className="h-4 w-1/2 bg-slate-200 rounded mx-auto" />
                  
                  {/* Button mocks */}
                  <div className="flex justify-center space-x-4 pt-4">
                    <div className="h-10 w-32 bg-sky-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-sky-800">
                      Add to Cart
                    </div>
                    <div className="h-10 w-32 bg-amber-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-amber-900">
                      Buy Now
                    </div>
                  </div>
                </div>

                {/* Footer mock */}
                <div className="pt-4 border-t border-slate-200 text-center">
                  <div className="h-3 w-48 bg-slate-200 rounded mx-auto" />
                </div>
              </div>

              {/* 1. Dot Map Overlay */}
              {viewMode === 'dots' && (
                <div className="absolute inset-0">
                  {clicks.map((click, idx) => {
                    const leftPercent = click.normalizedX != null ? click.normalizedX : (click.x / (click.viewportWidth || 1440)) * 100;
                    const topPercent = click.normalizedY != null ? click.normalizedY : (click.y / (click.viewportHeight || 900)) * 100;

                    return (
                      <div
                        key={click.id || idx}
                        onMouseEnter={(e) => handleMouseEnterDot(click, e)}
                        onMouseLeave={() => setHoveredClick(null)}
                        style={{
                          left: `${Math.min(98, Math.max(2, leftPercent))}%`,
                          top: `${Math.min(98, Math.max(2, topPercent))}%`,
                          width: `${dotRadius}px`,
                          height: `${dotRadius}px`,
                          opacity: opacity,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute rounded-full bg-rose-500 border-2 border-white shadow-md hover:scale-150 hover:z-30 hover:opacity-100 transition-transform cursor-pointer"
                      />
                    );
                  })}
                </div>
              )}

              {/* 2. Glow / Density Heatmap Overlay */}
              {viewMode === 'density' && (
                <div className="absolute inset-0 pointer-events-none mix-blend-multiply">
                  {clicks.map((click, idx) => {
                    const leftPercent = click.normalizedX != null ? click.normalizedX : (click.x / (click.viewportWidth || 1440)) * 100;
                    const topPercent = click.normalizedY != null ? click.normalizedY : (click.y / (click.viewportHeight || 900)) * 100;
                    const size = dotRadius * 2.2;

                    return (
                      <div
                        key={click.id || idx}
                        style={{
                          left: `${Math.min(98, Math.max(2, leftPercent))}%`,
                          top: `${Math.min(98, Math.max(2, topPercent))}%`,
                          width: `${size}px`,
                          height: `${size}px`,
                          opacity: opacity,
                          transform: 'translate(-50%, -50%)',
                          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.8) 0%, rgba(245, 158, 11, 0.5) 45%, rgba(59, 130, 246, 0.25) 75%, transparent 100%)',
                          filter: 'blur(3px)',
                        }}
                        className="absolute rounded-full"
                      />
                    );
                  })}
                </div>
              )}

              {/* 3. Grid Density Map (10x10 Matrix) */}
              {viewMode === 'grid' && (
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 border border-slate-300">
                  {gridCells.map((row, rIdx) =>
                    row.map((cellCount, cIdx) => {
                      const ratio = cellCount / maxCellClicks;
                      const hasClicks = cellCount > 0;
                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          style={{
                            backgroundColor: hasClicks
                              ? `rgba(239, 68, 68, ${Math.max(0.15, ratio * 0.85)})`
                              : 'transparent',
                          }}
                          className="border border-slate-200/50 flex items-center justify-center text-[10px] font-bold text-slate-800 transition-colors hover:bg-sky-200/50"
                          title={`Row ${rIdx + 1}, Col ${cIdx + 1}: ${cellCount} click(s)`}
                        >
                          {cellCount > 0 && (
                            <span className="bg-white/80 px-1 rounded shadow-xs font-mono">
                              {cellCount}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hover Tooltip */}
        {hoveredClick && (
          <div
            className="fixed z-50 pointer-events-none bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-slate-700 -translate-x-1/2 -translate-y-full mb-2 max-w-xs animate-in fade-in zoom-in-95"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
            }}
          >
            <div className="font-semibold text-sky-300 flex items-center justify-between gap-3">
              <span>Target: &lt;{hoveredClick.targetTag || 'element'}&gt;</span>
              <span className="font-mono text-[10px] text-slate-400">
                ({hoveredClick.x}px, {hoveredClick.y}px)
              </span>
            </div>
            {hoveredClick.targetText && (
              <p className="text-slate-200 mt-1 italic">"{hoveredClick.targetText}"</p>
            )}
            <div className="text-[10px] text-slate-400 mt-1">
              Session: {hoveredClick.sessionId?.slice(0, 16)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
