import React, { useState, useEffect } from 'react';
import { 
  X, 
  MousePointer, 
  Eye, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  ArrowDown, 
  Sparkles,
  ChevronRight,
  Code
} from 'lucide-react';
import { api } from '../api';

export default function SessionJourneyModal({ sessionId, onClose }) {
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

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
    return () => { isMounted = false; };
  }, [sessionId]);

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-800 text-lg">User Journey Timeline</span>
              <span className="bg-sky-100 text-sky-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {journeyData?.summary?.totalEvents || '...'} Events
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

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
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

              {/* Ordered Timeline */}
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                {journeyData.events.map((event, index) => {
                  const isPageView = event.eventType === 'page_view';
                  const isExpanded = expandedIndex === index;

                  return (
                    <div key={event._id || index} className="relative group">
                      {/* Timeline Dot / Icon */}
                      <div
                        className={`absolute -left-[35px] top-1.5 h-8 w-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                          isPageView
                            ? 'bg-emerald-500 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {isPageView ? <Eye className="h-4 w-4" /> : <MousePointer className="h-4 w-4" />}
                      </div>

                      {/* Event Card */}
                      <div className="bg-white border border-slate-200/90 hover:border-sky-300 rounded-xl p-4 shadow-sm hover:shadow transition-all">
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
                                Click Target: <code className="text-xs bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-950">&lt;{event.targetTag || 'element'}&gt;</code>
                              </span>
                              <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-amber-200">
                                (X: {event.clickX}px, Y: {event.clickY}px)
                              </span>
                            </div>

                            {event.targetText && (
                              <p className="text-slate-700">
                                <span className="text-slate-400">Inner Text:</span> "{event.targetText}"
                              </p>
                            )}

                            {(event.targetId || event.targetClass) && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                {event.targetId && <span>id="#{event.targetId}" </span>}
                                {event.targetClass && <span>class=".{event.targetClass}"</span>}
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
