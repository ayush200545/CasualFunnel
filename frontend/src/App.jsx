import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SessionsView from './components/SessionsView';
import HeatmapView from './components/HeatmapView';
import FunnelView from './components/FunnelView';
import DemoStoreView from './components/DemoStoreView';
import OverviewStats from './components/OverviewStats';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'heatmap' | 'demostore' | 'overview'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check health and connectivity on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await api.checkHealth();
        setIsConnected(true);
      } catch (err) {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    try {
      await api.checkHealth();
      setIsConnected(true);
    } catch (err) {
      setIsConnected(false);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        isConnected={isConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'sessions' && (
          <SessionsView
            key={`sessions-${refreshKey}`}
            onOpenDemo={() => setActiveTab('demostore')}
          />
        )}

        {activeTab === 'heatmap' && (
          <HeatmapView
            key={`heatmap-${refreshKey}`}
            onOpenDemo={() => setActiveTab('demostore')}
          />
        )}

        {activeTab === 'funnel' && (
          <FunnelView
            key={`funnel-${refreshKey}`}
            onOpenDemo={() => setActiveTab('demostore')}
          />
        )}

        {activeTab === 'demostore' && (
          <DemoStoreView
            onNavigateToSessions={() => setActiveTab('sessions')}
            onNavigateToHeatmap={() => setActiveTab('heatmap')}
          />
        )}

        {activeTab === 'overview' && (
          <OverviewStats
            key={`overview-${refreshKey}`}
            onSelectPageForHeatmap={(url) => {
              setActiveTab('heatmap');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>CausalFunnel Full-Stack Analytics Assignment • Node.js, Express, MongoDB & React</p>
      </footer>
    </div>
  );
}
