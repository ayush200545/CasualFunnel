import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MousePointer, 
  Eye, 
  Clock, 
  Search, 
  ArrowRight, 
  ExternalLink, 
  Copy, 
  Check, 
  FileText,
  Filter,
  Sparkles
} from 'lucide-react';
import { api } from '../api';
import SessionJourneyModal from './SessionJourneyModal';

export default function SessionsView({ onOpenDemo }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('lastSeen');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSessions({ search, sortBy, sortOrder: 'desc' });
      setSessions(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [search, sortBy]);

  const copyToClipboard = (text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '< 1s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const remainingSecs = Math.round(seconds % 60);
    return `${mins}m ${remainingSecs}s`;
  };

  const formatTimeAgo = (dateString) => {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateString).toLocaleDateString();
  };

  // Aggregated summary numbers
  const totalSessionsCount = sessions.length;
  const totalEventsSum = sessions.reduce((acc, s) => acc + (s.totalEvents || 0), 0);
  const totalClicksSum = sessions.reduce((acc, s) => acc + (s.clicks || 0), 0);
  const totalPageViewsSum = sessions.reduce((acc, s) => acc + (s.pageViews || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sessions</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalSessionsCount}</p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Unique client sessions</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Events</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalEventsSum}</p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Recorded interactions</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Page Views</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Eye className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalPageViewsSum}</p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Webpage visits</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Clicks</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <MousePointer className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalClicksSum}</p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Interactions mapped</span>
        </div>
      </div>

      {/* Action / Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by session ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
          />
        </div>

        {/* Sort & Actions */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Filter className="h-4 w-4 text-slate-400" />
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="lastSeen">Most Recent Activity</option>
              <option value="totalEvents">Most Events</option>
              <option value="durationSeconds">Longest Duration</option>
              <option value="firstSeen">First Seen</option>
            </select>
          </div>

          <button
            onClick={onOpenDemo}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Live Events</span>
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-slate-800">Tracked User Sessions</h2>
            <span className="bg-slate-200 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {sessions.length}
            </span>
          </div>
          <span className="text-xs text-slate-500">Click any session row to inspect its full user journey</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
            <p className="text-sm">Loading sessions from MongoDB...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            <p className="font-semibold text-sm">Failed to fetch sessions</p>
            <p className="text-xs text-slate-600 mt-1">{error}</p>
            <button
              onClick={fetchSessions}
              className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-medium text-slate-700">No sessions tracked yet</p>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Interact with the Demo Store or integrate tracker.js into your website to begin recording user behavior.
            </p>
            <button
              onClick={onOpenDemo}
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              <span>Launch Live Demo Store</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Session ID</th>
                  <th scope="col" className="px-6 py-3.5">Total Events</th>
                  <th scope="col" className="px-6 py-3.5">Activity Breakdown</th>
                  <th scope="col" className="px-6 py-3.5">Session Duration</th>
                  <th scope="col" className="px-6 py-3.5">Last Seen</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sessions.map((session) => (
                  <tr
                    key={session.sessionId}
                    onClick={() => setSelectedSessionId(session.sessionId)}
                    className="hover:bg-sky-50/60 transition-colors cursor-pointer group"
                  >
                    {/* Session ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-medium text-slate-800 bg-slate-100 group-hover:bg-white group-hover:border-sky-300 border border-transparent px-2.5 py-1 rounded-md transition-all">
                          {session.sessionId.length > 28 ? session.sessionId.slice(0, 26) + '...' : session.sessionId}
                        </span>
                        <button
                          onClick={(e) => copyToClipboard(session.sessionId, e)}
                          title="Copy Session ID"
                          className="text-slate-400 hover:text-slate-600 p-1 rounded"
                        >
                          {copiedId === session.sessionId ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {session.pageCount || 1} distinct page{session.pageCount === 1 ? '' : 's'}
                      </div>
                    </td>

                    {/* Total Events */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                          {session.totalEvents} events
                        </span>
                      </div>
                    </td>

                    {/* Breakdown */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3 text-xs text-slate-600">
                        <span className="flex items-center space-x-1" title="Page Views">
                          <Eye className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{session.pageViews || 0} PV</span>
                        </span>
                        <span className="flex items-center space-x-1" title="Clicks">
                          <MousePointer className="h-3.5 w-3.5 text-amber-500" />
                          <span>{session.clicks || 0} Clicks</span>
                        </span>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDuration(session.durationSeconds)}</span>
                      </div>
                    </td>

                    {/* Last Seen */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      <span>{formatTimeAgo(session.lastSeen)}</span>
                      <div className="text-[10px] text-slate-400">
                        {new Date(session.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSessionId(session.sessionId);
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 group-hover:bg-sky-600 group-hover:text-white transition-all"
                      >
                        <span>View Journey</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Journey Modal */}
      {selectedSessionId && (
        <SessionJourneyModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}
