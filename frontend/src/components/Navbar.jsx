import React from 'react';
import { Activity, BarChart3, Flame, ShoppingBag, RefreshCw } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onRefresh, isRefreshing, isConnected }) {
  const navItems = [
    { id: 'sessions', label: 'Sessions & Journeys', icon: Activity },
    { id: 'heatmap', label: 'Heatmap Visualizer', icon: Flame },
    { id: 'demostore', label: 'Live Demo Store', icon: ShoppingBag, badge: 'Interactive' },
    { id: 'overview', label: 'Overview Metrics', icon: BarChart3 },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('sessions')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Activity className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">CausalFunnel</span>
                <span className="bg-sky-100 text-sky-800 text-xs font-semibold px-2 py-0.5 rounded-full">Analytics</span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">User Session Tracking & Behavioral Heatmaps</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-sm border border-sky-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-sky-600' : 'text-slate-500'}`} />
                  <span className="hidden md:inline">{item.label}</span>
                  {item.badge && (
                    <span className="hidden lg:inline bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Status & Refresh */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 bg-slate-100 rounded-full text-xs text-slate-600">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isConnected ? 'API Connected' : 'Connecting...'}</span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh Data"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
