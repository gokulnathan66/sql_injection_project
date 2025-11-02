import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Database } from 'lucide-react';
import { getStatistics, getTimeline, getAttacks } from '../services/api';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttack, setSelectedAttack] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsData, timelineData, attacksData] = await Promise.all([
        getStatistics(),
        getTimeline(24),
        getAttacks(50),
      ]);
      setStats(statsData);
      setTimeline(timelineData);
      setAttacks(attacksData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Prepare data for charts
  const attackTypeData = stats?.attack_type_distribution
    ? Object.entries(stats.attack_type_distribution).map(([name, value]) => ({
        name: name.replace('_', ' ').toUpperCase(),
        value,
      }))
    : [];

  const statusData = [
    { name: 'Malicious', value: stats?.malicious_queries || 0 },
    { name: 'Benign', value: stats?.benign_queries || 0 },
  ];

  const timelineData = timeline.map((item) => ({
    time: new Date(item.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    total: item.count,
    malicious: item.malicious_count,
  }));

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Analytics & Insights</h2>
            <p className="text-primary-100">Comprehensive attack pattern analysis</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Attack Type Distribution - Pie Chart */}
        {attackTypeData.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Attack Type Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attackTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attackTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Malicious vs Benign - Pie Chart */}
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5" />
            Query Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#ef4444" />
                <Cell fill="#10b981" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Timeline - Line Chart */}
        {timelineData.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Detection Timeline (24 Hours)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Total Queries"
                />
                <Line
                  type="monotone"
                  dataKey="malicious"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Malicious"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Attack Frequency - Bar Chart */}
        {attackTypeData.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Attack Frequency by Type
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attackTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Attack History Table */}
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Attack History
        </h3>
        
        {attacks.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No attacks recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Confidence</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Query</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {attacks.map((attack) => (
                  <tr
                    key={attack.id}
                    className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm">
                      {new Date(attack.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          attack.is_malicious
                            ? 'bg-danger-900/30 text-danger-300'
                            : 'bg-green-900/30 text-green-300'
                        }`}
                      >
                        {attack.is_malicious ? 'MALICIOUS' : 'BENIGN'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm capitalize">
                      {attack.attack_type?.replace('_', ' ') || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {(attack.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-sm font-mono max-w-md truncate">
                      {attack.query}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedAttack(attack)}
                        className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attack Detail Modal */}
      {selectedAttack && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedAttack(null)}
        >
          <div
            className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">Attack Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded font-medium ${
                    selectedAttack.is_malicious
                      ? 'bg-danger-900/30 text-danger-300'
                      : 'bg-green-900/30 text-green-300'
                  }`}
                >
                  {selectedAttack.is_malicious ? 'MALICIOUS' : 'BENIGN'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Timestamp</label>
                <div className="text-sm">{new Date(selectedAttack.timestamp).toLocaleString()}</div>
              </div>

              {selectedAttack.attack_type && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Attack Type</label>
                  <div className="text-sm capitalize">{selectedAttack.attack_type.replace('_', ' ')}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Confidence</label>
                <div className="text-sm">{(selectedAttack.confidence * 100).toFixed(2)}%</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Original Query</label>
                <div className="p-3 bg-slate-900 rounded border border-slate-600 font-mono text-sm break-all">
                  {selectedAttack.query}
                </div>
              </div>

              {selectedAttack.normalized_query && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Normalized Query</label>
                  <div className="p-3 bg-slate-900 rounded border border-slate-600 font-mono text-sm break-all">
                    {selectedAttack.normalized_query}
                  </div>
                </div>
              )}

              {selectedAttack.response_time_ms && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Response Time</label>
                  <div className="text-sm">{selectedAttack.response_time_ms.toFixed(2)}ms</div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedAttack(null)}
              className="mt-6 w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

