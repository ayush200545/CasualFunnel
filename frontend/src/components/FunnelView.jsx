import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  ArrowDown, 
  TrendingDown, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  ShoppingBag, 
  ShoppingCart, 
  CreditCard,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../api';

export default function FunnelView({ onOpenDemo }) {
  const [funnelData, setFunnelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFunnel = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getFunnel();
      setFunnelData(res);
    } catch (err) {
      setError(err.message || 'Failed to load funnel analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnel();
  }, []);

  const getStageIcon = (id) => {
    switch (id) {
      case 'visit': return Users;
      case 'view_product': return ShoppingBag;
      case 'add_to_cart': return ShoppingCart;
      case 'checkout': return CreditCard;
      default: return Filter;
    }
  };

  const getStageColor = (index) => {
    const colors = [
      { bg: 'bg-sky-500', bar: 'bg-sky-500', text: 'text-sky-700', border: 'border-sky-200' },
      { bg: 'bg-indigo-500', bar: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-200' },
      { bg: 'bg-purple-500', bar: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-200' },
      { bg: 'bg-emerald-500', bar: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200' },
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-3" />
        <p className="text-sm">Analyzing e-commerce conversion funnel...</p>
      </div>
    );
  }

  if (error || !funnelData) {
    return (
      <div className="p-8 text-center text-rose-500 bg-white rounded-xl border border-slate-200">
        <p className="font-semibold">{error || 'Could not load funnel'}</p>
        <button
          onClick={fetchFunnel}
          className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { totalSessions, overallConversionRate, stages = [] } = funnelData;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900">E-Commerce Conversion Funnel</h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              CausalFunnel Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking user drop-off across the 4 key stages of the customer buying journey.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 block uppercase">Overall Conversion</span>
            <span className="text-2xl font-black text-emerald-600">{overallConversionRate}%</span>
          </div>
          <button
            onClick={fetchFunnel}
            title="Refresh Funnel"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
          <span>FUNNEL STAGE & DROP-OFF BREAKDOWN</span>
          <span>SESSIONS & CONVERSION %</span>
        </div>

        <div className="space-y-6">
          {stages.map((stage, idx) => {
            const Icon = getStageIcon(stage.id);
            const style = getStageColor(idx);
            const nextStage = stages[idx + 1];

            return (
              <div key={stage.id} className="space-y-3">
                {/* Stage Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg text-white ${style.bg} shadow-sm`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{stage.name}</h4>
                      <p className="text-xs text-slate-500">{stage.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-right">
                    <div>
                      <span className="text-base font-extrabold text-slate-900">{stage.count}</span>
                      <span className="text-xs text-slate-400 ml-1">sessions</span>
                    </div>
                    <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-md min-w-[55px] text-center">
                      {stage.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar with Funnel Width Scaling */}
                <div className="w-full bg-slate-100 h-5 rounded-lg overflow-hidden p-0.5 border border-slate-200/60 flex">
                  <div
                    className={`h-full rounded-md ${style.bar} transition-all duration-700 flex items-center justify-end pr-2 text-[10px] font-bold text-white shadow-xs`}
                    style={{ width: `${Math.max(8, stage.percentage)}%` }}
                  >
                    {stage.percentage > 15 ? `${stage.percentage}%` : ''}
                  </div>
                </div>

                {/* Drop-off indicator to next stage */}
                {nextStage && (
                  <div className="flex items-center justify-center space-x-2 py-1 text-xs">
                    <div className="flex items-center space-x-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-full border border-rose-200/70 font-semibold">
                      <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                      <span>{nextStage.dropoff}% Drop-off ({stage.count - nextStage.count} abandoned)</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Value Proposition Note */}
        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3 text-xs text-slate-600">
          <Info className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Causal Insight:</strong> By analyzing where users drop off between Product View and Cart Additions, e-commerce stores can optimize call-to-action placement and use targeted incentives (nudges, discount popups) before the session abandons.
          </p>
        </div>
      </div>
    </div>
  );
}
