import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  MousePointer, 
  Eye, 
  FileText, 
  TrendingUp, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { api } from '../api';

export default function OverviewStats({ onSelectPageForHeatmap }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getStats();
      setStats(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
        <p className="text-sm">Calculating aggregated analytics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-rose-500 bg-white rounded-xl border border-slate-200">
        <p className="font-semibold">{error || 'Could not load statistics'}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const pvRatio = stats.totalEvents > 0 ? Math.round((stats.pageViews / stats.totalEvents) * 100) : 0;
  const clickRatio = stats.totalEvents > 0 ? Math.round((stats.clicks / stats.totalEvents) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Events</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalEvents}</p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Ingested across all sessions</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Sessions</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalSessions}</p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Distinct user sessions</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Events / Session</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.avgEventsPerSession}</p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Average engagement depth</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracked Pages</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats.totalPages}</p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Distinct URL destinations</span>
        </div>
      </div>

      {/* Breakdown Bar & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Event Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm">Event Type Distribution</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center space-x-1.5 text-emerald-700">
                  <Eye className="h-4 w-4 text-emerald-500" />
                  <span>Page Views ({stats.pageViews})</span>
                </span>
                <span className="text-slate-600">{pvRatio}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${pvRatio}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center space-x-1.5 text-amber-700">
                  <MousePointer className="h-4 w-4 text-amber-500" />
                  <span>User Clicks ({stats.clicks})</span>
                </span>
                <span className="text-slate-600">{clickRatio}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${clickRatio}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 block">Tracking Protocol</span>
              <span className="font-mono font-bold text-slate-800">navigator.sendBeacon</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 block">Session Expiry</span>
              <span className="font-mono font-bold text-slate-800">30 Min Inactivity</span>
            </div>
          </div>
        </div>

        {/* Top Pages */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">Top Tracked Pages</h3>
            <span className="text-xs text-slate-400">By total activity</span>
          </div>

          {stats.topPages && stats.topPages.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.topPages.map((page, index) => (
                <div key={page.url} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate max-w-sm">
                    <span className="font-bold text-slate-400">#{index + 1}</span>
                    <span className="font-mono text-slate-800 truncate" title={page.url}>
                      {page.url}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-slate-500">
                    <span className="text-emerald-600 font-medium">{page.pageViews} views</span>
                    <span className="text-amber-600 font-medium">{page.clicks} clicks</span>
                    <button
                      onClick={() => onSelectPageForHeatmap(page.url)}
                      className="text-sky-600 hover:text-sky-800 font-medium"
                      title="View Heatmap for this page"
                    >
                      Heatmap →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No pages tracked yet.</p>
          )}
        </div>

      </div>
    </div>
  );
}
