import { useState, useEffect } from 'react';
import { Brain, Play, Download, TrendingUp, Clock } from 'lucide-react';
import { getFederatedStatus, startFederatedRound, getFederatedHistory, downloadGlobalModel } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ModelManager() {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statusData, historyData] = await Promise.all([
        getFederatedStatus(),
        getFederatedHistory(20)
      ]);
      setStatus(statusData);
      setHistory(historyData.history || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleStartRound = async () => {
    setTraining(true);
    try {
      await startFederatedRound();
      await fetchData();
    } catch (error) {
      console.error('Error starting round:', error);
    } finally {
      setTraining(false);
    }
  };

  const handleDownloadModel = async () => {
    try {
      const model = await downloadGlobalModel();
      const blob = new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `global_model_v${model.model_version}.json`;
      a.click();
    } catch (error) {
      console.error('Error downloading model:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  const chartData = history.map(h => ({
    round: h.round,
    accuracy: h.metrics?.accuracy || 0,
    loss: h.metrics?.loss || 0
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Model Management</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadModel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Model
          </button>
          <button
            onClick={handleStartRound}
            disabled={training}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {training ? 'Training...' : 'Start Training Round'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Model Version</h3>
            <Brain className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{status?.model_version || 'N/A'}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Current Round</h3>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">{status?.current_round || 0}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Total Rounds</h3>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">{status?.total_rounds || 0}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Participants</h3>
            <Brain className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">{status?.active_organizations || 0}</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Training Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="round" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="accuracy" stroke="#3B82F6" strokeWidth={2} name="Accuracy" />
              <Line type="monotone" dataKey="loss" stroke="#EF4444" strokeWidth={2} name="Loss" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Training History</h3>
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Round</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Participants</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Accuracy</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Loss</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((round, idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="py-3 px-4 text-white font-semibold">#{round.round}</td>
                    <td className="py-3 px-4 text-gray-400">{round.participants || 0}</td>
                    <td className="py-3 px-4 text-green-400">{(round.metrics?.accuracy * 100 || 0).toFixed(2)}%</td>
                    <td className="py-3 px-4 text-red-400">{round.metrics?.loss?.toFixed(4) || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-400">{new Date(round.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No training history available</p>
        )}
      </div>
    </div>
  );
}
