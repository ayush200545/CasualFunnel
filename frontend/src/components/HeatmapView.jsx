import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  MousePointer, 
  Eye, 
  Grid, 
  Sliders, 
  Layers, 
  Info, 
  Sparkles,
  RefreshCw,
  Monitor,
  Layout,
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
  const [viewMode, setViewMode] = useState('thermal'); // 'thermal' | 'dots' | 'grid'
  const [backdropMode, setBackdropMode] = useState('demo-store'); // 'demo-store' | 'wireframe' | 'dark'
  const [dotRadius, setDotRadius] = useState(30);
  const [opacity, setOpacity] = useState(0.85);
  const [hoveredClick, setHoveredClick] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

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

  const clicks = clickData?.clicks || [];

  /**
   * High-Fidelity Canvas Thermal Heatmap Engine (Gaussian LUT Thermal Gradient)
   */
  useEffect(() => {
    if (viewMode !== 'thermal' || !canvasRef.current || clicks.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Step 1: Draw grayscale alpha radial gradients for every click point
    clicks.forEach((c) => {
      const normX = c.normalizedX != null ? c.normalizedX / 100 : c.x / (c.viewportWidth || 1440);
      const normY = c.normalizedY != null ? c.normalizedY / 100 : c.y / (c.viewportHeight || 900);
      const px = Math.min(width - 5, Math.max(5, normX * width));
      const py = Math.min(height - 5, Math.max(5, normY * height));

      const rad = dotRadius * 1.4;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, rad);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    });

    // Step 2: Build 256-color Thermal Gradient LUT (Blue -> Cyan -> Green -> Yellow -> Red)
    const lutCanvas = document.createElement('canvas');
    lutCanvas.width = 1;
    lutCanvas.height = 256;
    const lutCtx = lutCanvas.getContext('2d');
    const colorGradient = lutCtx.createLinearGradient(0, 0, 0, 256);
    colorGradient.addColorStop(0.0, 'rgba(0, 0, 255, 0)');
    colorGradient.addColorStop(0.2, 'rgba(0, 220, 255, 0.7)');
    colorGradient.addColorStop(0.45, 'rgba(0, 255, 120, 0.85)');
    colorGradient.addColorStop(0.7, 'rgba(255, 230, 0, 0.95)');
    colorGradient.addColorStop(1.0, 'rgba(255, 0, 0, 1.0)');

    lutCtx.fillStyle = colorGradient;
    lutCtx.fillRect(0, 0, 1, 256);
    const lutData = lutCtx.getImageData(0, 0, 1, 256).data;

    // Step 3: Map grayscale alpha pixels to thermal color palette
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    const alphaMultiplier = opacity;

    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3]; // Alpha channel contains intensity
      if (alpha > 0) {
        const lutOffset = alpha * 4;
        pixels[i] = lutData[lutOffset];         // R
        pixels[i + 1] = lutData[lutOffset + 1]; // G
        pixels[i + 2] = lutData[lutOffset + 2]; // B
        pixels[i + 3] = Math.round(lutData[lutOffset + 3] * alphaMultiplier); // Alpha
      }
    }

    ctx.putImageData(imgData, 0, 0);

  }, [clicks, viewMode, dotRadius, opacity]);

  const handleMouseEnterDot = (click, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredClick(click);
    setTooltipPos({
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 10,
    });
  };

  // 10x10 Grid Density distribution
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
              <span className="text-slate-400 font-normal">({pages.length} URLs indexed)</span>
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
                      {p.url} — {p.clicks} clicks, {p.pageViews} views ({p.uniqueSessionCount} visitors)
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
              Renderer:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
              <button
                onClick={() => setViewMode('thermal')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                  viewMode === 'thermal'
                    ? 'bg-white text-rose-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="h-3.5 w-3.5 text-rose-500" />
                <span>Thermal Glow</span>
              </button>

              <button
                onClick={() => setViewMode('dots')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                  viewMode === 'dots'
                    ? 'bg-white text-sky-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MousePointer className="h-3.5 w-3.5" />
                <span>Interactive Dots</span>
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                <span>10x10 Matrix</span>
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

        {/* Sliders & Backdrop Selector */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-6">
            
            {/* Backdrop Toggle */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-500">Backdrop:</span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                <button
                  onClick={() => setBackdropMode('demo-store')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    backdropMode === 'demo-store' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Store Layout
                </button>
                <button
                  onClick={() => setBackdropMode('wireframe')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    backdropMode === 'wireframe' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Wireframe
                </button>
                <button
                  onClick={() => setBackdropMode('dark')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    backdropMode === 'dark' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Dark Canvas
                </button>
              </div>
            </div>

            {/* Radius Slider */}
            <div className="flex items-center space-x-2">
              <span className="font-medium text-slate-500">Radius:</span>
              <input
                type="range"
                min="14"
                max="65"
                value={dotRadius}
                onChange={(e) => setDotRadius(Number(e.target.value))}
                className="w-24 accent-sky-600 cursor-pointer"
              />
              <span className="w-6 text-slate-700 font-mono">{dotRadius}px</span>
            </div>

            {/* Opacity Slider */}
            <div className="flex items-center space-x-2">
              <span className="font-medium text-slate-500">Intensity:</span>
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
            <div className="flex items-center space-x-4 font-medium text-slate-700">
              <span className="text-slate-900 font-bold">{clickData.totalClicks} Clicks Mapped</span>
              <span>•</span>
              <span>{clickData.totalPageViews} Views</span>
              <span>•</span>
              <span>{clickData.uniqueSessions} Visitors</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Heatmap Surface */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Canvas Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">Behavioral Heatmap Visualizer</span>
            <span className="bg-indigo-100 text-indigo-800 font-medium px-2 py-0.5 rounded text-[11px]">
              {viewMode === 'thermal' ? 'Thermal Gaussian LUT' : viewMode === 'dots' ? 'Individual Clicks' : 'Matrix'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-slate-500">
            <Info className="h-3.5 w-3.5" />
            <span>Responsive 1440x900 viewport normalization</span>
          </div>
        </div>

        {/* Viewport Frame */}
        <div
          ref={containerRef}
          className="p-6 bg-slate-900 flex justify-center items-center overflow-x-auto min-h-[580px]"
        >
          {loadingClicks ? (
            <div className="text-center text-slate-400 py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
              <p>Rendering high-fidelity heatmap...</p>
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
              className={`relative rounded-lg shadow-2xl border border-slate-700 overflow-hidden ${
                backdropMode === 'dark' ? 'bg-slate-950' : 'bg-white'
              }`}
              style={{
                width: '100%',
                maxWidth: '1020px',
                aspectRatio: '16 / 10',
                minHeight: '540px',
              }}
            >
              {/* BACKDROP 1: Realistic Demo Store layout */}
              {backdropMode === 'demo-store' && (
                <div className="absolute inset-0 select-none pointer-events-none p-5 flex flex-col justify-between opacity-50 bg-slate-50">
                  {/* Top bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">C</div>
                      <span className="font-bold text-slate-800 text-xs">CausalStore Demo</span>
                    </div>
                    <div className="h-6 w-48 bg-slate-200 rounded text-[10px] text-slate-500 flex items-center px-2">
                      🔍 Search products...
                    </div>
                    <div className="h-6 w-20 bg-indigo-100 rounded text-[10px] font-bold text-indigo-700 flex items-center justify-center">
                      Cart (3)
                    </div>
                  </div>

                  {/* Product Cards Grid */}
                  <div className="grid grid-cols-4 gap-4 my-auto">
                    {[
                      { name: 'Headphones', price: '$199' },
                      { name: 'Smart Watch', price: '$249' },
                      { name: 'Laptop Stand', price: '$49' },
                      { name: 'Keyboard', price: '$139' },
                    ].map((item, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                        <div className="h-20 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs font-semibold">
                          {item.name}
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span>{item.price}</span>
                          <span className="text-[10px] text-emerald-600">In Stock</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <div className="h-6 bg-slate-100 rounded text-[9px] font-bold text-slate-700 flex items-center justify-center">
                            Add to Cart
                          </div>
                          <div className="h-6 bg-indigo-600 rounded text-[9px] font-bold text-white flex items-center justify-center">
                            Buy Now
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t border-slate-200 text-center text-[10px] text-slate-400">
                    CausalStore Demo Webpage • User Interaction Tracked
                  </div>
                </div>
              )}

              {/* BACKDROP 2: Neutral Wireframe */}
              {backdropMode === 'wireframe' && (
                <div className="absolute inset-0 select-none pointer-events-none p-6 flex flex-col justify-between opacity-35 bg-gradient-to-b from-slate-50 to-white">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div className="h-6 w-32 bg-slate-300 rounded" />
                    <div className="flex space-x-3">
                      <div className="h-4 w-16 bg-slate-200 rounded" />
                      <div className="h-4 w-16 bg-slate-200 rounded" />
                      <div className="h-4 w-20 bg-slate-300 rounded" />
                    </div>
                  </div>
                  <div className="space-y-4 my-auto">
                    <div className="h-8 w-2/3 bg-slate-300 rounded mx-auto" />
                    <div className="h-4 w-1/2 bg-slate-200 rounded mx-auto" />
                    <div className="flex justify-center space-x-4 pt-4">
                      <div className="h-10 w-32 bg-sky-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-sky-800">
                        Add to Cart
                      </div>
                      <div className="h-10 w-32 bg-amber-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-amber-900">
                        Buy Now
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200 text-center">
                    <div className="h-3 w-48 bg-slate-200 rounded mx-auto" />
                  </div>
                </div>
              )}

              {/* 1. THERMAL CANVAS OVERLAY */}
              {viewMode === 'thermal' && (
                <canvas
                  ref={canvasRef}
                  width={1020}
                  height={638}
                  className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply"
                />
              )}

              {/* 2. INTERACTIVE DOTS OVERLAY */}
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
                        className="absolute rounded-full bg-rose-500 border-2 border-white shadow-lg hover:scale-150 hover:z-30 hover:opacity-100 transition-transform cursor-pointer"
                      />
                    );
                  })}
                </div>
              )}

              {/* 3. 10x10 GRID OVERLAY */}
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
                              ? `rgba(239, 68, 68, ${Math.max(0.18, ratio * 0.85)})`
                              : 'transparent',
                          }}
                          className="border border-slate-300/40 flex items-center justify-center text-[10px] font-bold text-slate-800 hover:bg-sky-200/50"
                          title={`Row ${rIdx + 1}, Col ${cIdx + 1}: ${cellCount} click(s)`}
                        >
                          {cellCount > 0 && (
                            <span className="bg-white/90 px-1 rounded shadow-xs font-mono">
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
            className="fixed z-50 pointer-events-none bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700 -translate-x-1/2 -translate-y-full mb-3 max-w-xs animate-in fade-in zoom-in-95"
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
              Session: {hoveredClick.sessionId?.slice(0, 18)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
