import React, { useState, useEffect } from 'react';
import { Activity, Shield, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { getStatistics, getAttacks } from '../services/api';
import { wsService } from '../services/websocket';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentAttacks, setRecentAttacks] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Connect WebSocket
    wsService.connect();
    wsService.addListener(handleWebSocketMessage);

    // Refresh data every 10 seconds
    const interval = setInterval(loadData, 10000);

    return () => {
      clearInterval(interval);
      wsService.removeListener(handleWebSocketMessage);
    };
  }, []);

  const loadData = async () => {
    try {
      const [statsData, attacksData] = await Promise.all([
        getStatistics(),
        getAttacks(10),
      ]);
      setStats(statsData);
      setRecentAttacks(attacksData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWebSocketMessage = (data) => {
    if (data.type === 'attack_detected') {
      setLiveAlerts((prev) => [
        { ...data.data, id: Date.now() },
        ...prev.slice(0, 9),
      ]);
      // Refresh stats
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Real-time Dashboard</h2>
            <p className="text-primary-100">Live monitoring of SQL injection detection</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          title="Total Queries"
          value={stats?.total_queries || 0}
          color="blue"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          title="Attacks Detected"
          value={stats?.malicious_queries || 0}
          color="red"
        />
        <StatCard
          icon={<Shield className="w-6 h-6" />}
          title="Detection Rate"
          value={`${(stats?.detection_rate || 0).toFixed(1)}%`}
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Avg Confidence"
          value={`${((stats?.average_confidence || 0) * 100).toFixed(1)}%`}
          color="purple"
        />
      </div>

      {/* Live Alerts */}
      {liveAlerts.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-danger-500">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-danger-400 animate-pulse" />
            Live Attack Alerts
          </h3>
          <div className="space-y-2">
            {liveAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 bg-danger-900/20 border border-danger-500/50 rounded-lg animate-slide-in"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-mono text-sm break-all">{alert.query}</div>
                    <div className="flex gap-4 mt-2 text-sm text-slate-400">
                      <span>Type: {alert.attack_type?.replace('_', ' ').toUpperCase()}</span>
                      <span>Confidence: {(alert.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(alert.timestamp * 1000).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Recent Activity
        </h3>
        
        {recentAttacks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No activity yet. Test some queries to see results here.
          </div>
        ) : (
          <div className="space-y-2">
            {recentAttacks.map((attack) => (
              <div
                key={attack.id}
                className={`p-4 rounded-lg border ${
                  attack.is_malicious
                    ? 'bg-danger-900/10 border-danger-500/30'
                    : 'bg-green-900/10 border-green-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {attack.is_malicious ? (
                        <AlertTriangle className="w-4 h-4 text-danger-400" />
                      ) : (
                        <Shield className="w-4 h-4 text-green-400" />
                      )}
                      <span className="font-semibold">
                        {attack.is_malicious ? 'MALICIOUS' : 'BENIGN'}
                      </span>
                      {attack.attack_type && (
                        <span className="text-sm text-slate-400">
                          ({attack.attack_type.replace('_', ' ')})
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-sm text-slate-300 break-all">
                      {attack.query.length > 100
                        ? attack.query.substring(0, 100) + '...'
                        : attack.query}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span>Confidence: {(attack.confidence * 100).toFixed(1)}%</span>
                      {attack.response_time_ms && (
                        <span>Response: {attack.response_time_ms.toFixed(2)}ms</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(attack.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attack Type Distribution */}
      {stats?.attack_type_distribution && Object.keys(stats.attack_type_distribution).length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
          <h3 className="text-xl font-semibold mb-4">Attack Type Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.attack_type_distribution).map(([type, count]) => {
              const percentage = (count / stats.malicious_queries) * 100;
              return (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                    <span>{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value, color }) => {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-700',
    red: 'from-danger-600 to-danger-700',
    green: 'from-green-600 to-green-700',
    purple: 'from-purple-600 to-purple-700',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-6 shadow-xl`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
    </div>
  );
};

export default Dashboard;

