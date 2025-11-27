import React, { useState, useEffect } from 'react';
import { Shield, Activity, BarChart3, Menu, X, Monitor, Building2, Brain } from 'lucide-react';
import Dashboard from './components/Dashboard';
import QueryTester from './components/QueryTester';
import Analytics from './components/Analytics';
import SystemMonitor from './components/SystemMonitor';
import OrganizationManager from './components/OrganizationManager';
import ModelManager from './components/ModelManager';
import { connectWebSocket, disconnectWebSocket, addWebSocketListener, removeWebSocketListener } from './services/websocket';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const handleMessage = (data) => {
      if (data.type === 'attack_detected') {
        setAlerts(prev => [data.data, ...prev].slice(0, 3));
      }
    };

    connectWebSocket();
    addWebSocketListener(handleMessage);
    
    return () => {
      removeWebSocketListener(handleMessage);
      disconnectWebSocket();
    };
  }, []);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: Activity },
    { id: 'tester', name: 'Query Tester', icon: Shield },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 },
    { id: 'monitor', name: 'System Monitor', icon: Monitor },
    { id: 'organizations', name: 'Organizations', icon: Building2 },
    { id: 'models', name: 'Model Manager', icon: Brain },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tester':
        return <QueryTester />;
      case 'analytics':
        return <Analytics />;
      case 'monitor':
        return <SystemMonitor />;
      case 'organizations':
        return <OrganizationManager />;
      case 'models':
        return <ModelManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                  SQL Injection Detection
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Real-time ML-powered security with Federated Learning
                </p>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/50'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{tab.name}</span>
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-slate-700 animate-slide-in">
              <nav className="flex flex-col gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-primary-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3 animate-pulse"
              >
                <Shield className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 font-semibold">Attack Detected!</p>
                  <p className="text-slate-300 text-sm mt-1">{alert.query}</p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    <span>Type: {alert.attack_type}</span>
                    <span>Confidence: {(alert.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {renderContent()}
      </main>

      <footer className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-400">
              SQL Injection Detection System - Final Year Project
            </div>
            <div className="flex gap-6 text-sm text-slate-400">
              <span>Gogulesh R (22BCS027)</span>
              <span>Gokulnathan B (22BCS029)</span>
              <span>Indrajit (22BCS036)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
