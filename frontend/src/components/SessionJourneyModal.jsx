import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MousePointer, 
  Eye, 
  Clock, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Square, 
  Code,
  Filter,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { api } from '../api';

export default function SessionJourneyModal({ sessionId, onClose }) {
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'page_view' | 'click'
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Auto-play replay state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlayStep, setActivePlayStep] = useState(null);
  const playTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchJourney = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getSessionEvents(sessionId);
        if (isMounted) {
          setJourneyData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch session events');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchJourney();
    return () => { 
      isMounted = false;
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [sessionId]);

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format) => {
    const url = api.getSessionExportUrl(sessionId, format);
    window.open(url, '_blank');
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Replay Controller
  const handleTogglePlay = () => {
    if (isPlaying) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
      setIsPlaying(false);
      setActivePlayStep(null);
    } else {
      if (!journeyData || !journeyData.events || journeyData.events.length === 0) return;
      setIsPlaying(true);
      setActivePlayStep(1);

      let current = 1;
      const total = journeyData.events.length;

      playTimerRef.current = setInterval(() => {
        current += 1;
        if (current > total) {
          clearInterval(playTimerRef.current);
          playTimerRef.current = null;
          setIsPlaying(false);
          setActivePlayStep(null);
        } else {
          setActivePlayStep(current);
          // Auto scroll to element
          const el = document.getElementById(`step-card-${current}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1200);
    }
  };

  const filteredEvents = journeyData?.events?.filter((e) => {
    if (filterType === 'all') return true;
    return e.eventType === filterType;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800 text-lg">User Journey Timeline</span>
              <span className="bg-sky-100 text-sky-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {journeyData?.summary?.totalEvents || '...'} Events Recorded
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
              <span>Session: {sessionId}</span>
              <button
                onClick={copySessionId}
                className="hover:text-slate-800 transition-colors"
                title="Copy Session ID"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 inline" /> : <Copy className="h-3.5 w-3.5 inline" />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Export Buttons */}
            <button
              onClick={() => handleExport('csv')}
              title="Download CSV"
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => handleExport('json')}
              title="Download JSON"
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
              <p className="text-sm">Fetching user journey events...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-500">
              <p className="font-semibold">{error}</p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Journey Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Total Duration</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {journeyData.summary.totalDurationSeconds}s
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Page Views</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {journeyData.summary.pageViews}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Clicks</span>
                  <span className="font-bold text-amber-600 text-sm">
                    {journeyData.summary.clicks}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Pages Touched</span>
                  <span className="font-bold text-indigo-600 text-sm">
                    {journeyData.summary.pagesVisited?.length || 1}
                  </span>
                </div>
              </div>

              {/* Action Toolbar: Play Replay & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                {/* Replay Playback Button */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleTogglePlay}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                      isPlaying
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="h-3.5 w-3.5 fill-current" />
                        <span>Stop Replay</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Play Journey Steps</span>
                      </>
                    )}
                  </button>

                  {isPlaying && (
                    <span className="text-xs text-indigo-600 font-semibold animate-pulse">
                      Playing step {activePlayStep} of {journeyData.events.length}...
                    </span>
                  )}
                </div>

                {/* Filter buttons */}
                <div className="flex items-center space-x-1 text-xs">
                  <Filter className="h-3.5 w-3.5 text-slate-400 mr-1" />
                  {['all', 'page_view', 'click'].map((ft) => (
                    <button
                      key={ft}
                      onClick={() => setFilterType(ft)}
                      className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                        filterType === ft
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {ft === 'all' ? 'All' : ft === 'page_view' ? 'Page Views' : 'Clicks'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ordered Timeline */}
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-5">
                {filteredEvents.map((event, index) => {
                  const isPageView = event.eventType === 'page_view';
                  const isExpanded = expandedIndex === index;
                  const isCurrentlyPlaying = activePlayStep === event.stepNumber;

                  return (
                    <div
                      key={event._id || index}
                      id={`step-card-${event.stepNumber}`}
                      className="relative group transition-all duration-300"
                    >
                      {/* Timeline Dot / Icon */}
                      <div
                        className={`absolute -left-[35px] top-2 h-8 w-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-all ${
                          isCurrentlyPlaying
                            ? 'scale-125 ring-4 ring-indigo-400 bg-indigo-600 text-white z-20'
                            : isPageView
                            ? 'bg-emerald-500 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {isPageView ? <Eye className="h-4 w-4" /> : <MousePointer className="h-4 w-4" />}
                      </div>

                      {/* Event Card */}
                      <div
                        className={`bg-white rounded-xl p-4 border transition-all ${
                          isCurrentlyPlaying
                            ? 'border-indigo-500 shadow-md ring-2 ring-indigo-200 bg-indigo-50/20'
                            : 'border-slate-200/90 hover:border-sky-300 shadow-sm hover:shadow'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-400">#{event.stepNumber}</span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isPageView
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {event.eventType}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              {formatTime(event.timestamp)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 text-xs text-slate-400">
                            <span>+{event.elapsedSeconds}s from start</span>
                            {event.deltaSeconds > 0 && (
                              <span className="text-slate-500 font-medium">
                                (Δ {event.deltaSeconds}s)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Page URL */}
                        <div className="mt-2.5 flex items-center space-x-2 text-xs">
                          <span className="text-slate-400 font-medium">Page:</span>
                          <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 truncate max-w-lg">
                            {event.pageUrl}
                          </span>
                        </div>

                        {/* Click details */}
                        {!isPageView && (
                          <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-amber-900">
                                Target: <code className="text-xs bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-950">&lt;{event.targetTag || 'element'}&gt;</code>
                              </span>
                              <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-amber-200">
                                (X: {event.clickX}px, Y: {event.clickY}px)
                              </span>
                            </div>

                            {event.targetText && (
                              <p className="text-slate-700">
                                <span className="text-slate-400">Text:</span> "{event.targetText}"
                              </p>
                            )}

                            {(event.metadata?.selector || event.targetId || event.targetClass) && (
                              <div className="text-[11px] text-slate-500 font-mono truncate">
                                CSS: <code>{event.metadata?.selector || `#${event.targetId || ''} .${event.targetClass || ''}`}</code>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Raw JSON toggle */}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => setExpandedIndex(isExpanded ? null : index)}
                            className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center space-x-1"
                          >
                            <Code className="h-3 w-3" />
                            <span>{isExpanded ? 'Hide Raw JSON' : 'Inspect JSON'}</span>
                          </button>
                        </div>

                        {isExpanded && (
                          <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] overflow-x-auto font-mono">
                            {JSON.stringify(event, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>End of user journey</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
