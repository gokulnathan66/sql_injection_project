import { useState, useEffect } from 'react';
import { Activity, Database, Shield, Cpu, AlertCircle, CheckCircle } from 'lucide-react';
import { getSystemHealth, getSystemInfo, getStats } from '../services/api';

export default function SystemMonitor() {
  const [systemInfo, setSystemInfo] = useState(null);
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      const [infoData, healthData, statsData] = await Promise.all([
        getSystemInfo(),
        getSystemHealth(),
        getStats()
      ]);
      setSystemInfo(infoData);
      setHealth(healthData);
      setStats(statsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching system data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">System Monitor</h2>
        <div className="flex items-center gap-2">
          {health?.status === 'healthy' ? (
            <><CheckCircle className="w-5 h-5 text-green-400" /><span className="text-green-400">Healthy</span></>
          ) : (
            <><AlertCircle className="w-5 h-5 text-red-400" /><span className="text-red-400">Unhealthy</span></>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Detection Engine</h3>
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{systemInfo?.services?.detection_engine || 'N/A'}</p>
          <p className="text-xs text-gray-500 mt-1">Status</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Proxy Service</h3>
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{systemInfo?.services?.proxy || 'N/A'}</p>
          <p className="text-xs text-gray-500 mt-1">Status</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Honeypot</h3>
            <AlertCircle className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">{systemInfo?.services?.honeypot || 'N/A'}</p>
          <p className="text-xs text-gray-500 mt-1">Status</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Federated Learning</h3>
            <Cpu className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{systemInfo?.services?.federated_learning || 'N/A'}</p>
          <p className="text-xs text-gray-500 mt-1">Status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Database Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Queries</span>
              <span className="text-white font-semibold">{stats?.total_queries || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Attacks Detected</span>
              <span className="text-red-400 font-semibold">{stats?.attacks_detected || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Detection Rate</span>
              <span className="text-green-400 font-semibold">{stats?.detection_rate?.toFixed(2) || 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Avg Confidence</span>
              <span className="text-blue-400 font-semibold">{stats?.avg_confidence?.toFixed(2) || 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">API Endpoints</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-400">Detection:</span>
              <code className="text-blue-400">{systemInfo?.endpoints?.detect}</code>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-400">WebSocket:</span>
              <code className="text-blue-400">{systemInfo?.endpoints?.websocket}</code>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-400">Honeypot:</span>
              <code className="text-blue-400">{systemInfo?.endpoints?.honeypot}</code>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-400">Federated:</span>
              <code className="text-blue-400">/api/federated/*</code>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Name</p>
            <p className="text-white font-semibold">{systemInfo?.name}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Version</p>
            <p className="text-white font-semibold">{systemInfo?.version}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Status</p>
            <p className="text-green-400 font-semibold">{systemInfo?.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
