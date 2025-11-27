import { useState, useEffect } from 'react';
import { Building2, Plus, Users, CheckCircle, Clock } from 'lucide-react';
import { registerOrganization, getFederatedStatus } from '../services/api';

export default function OrganizationManager() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ orgId: '', orgName: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await getFederatedStatus();
      setStatus(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching status:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerOrganization(formData.orgId, formData.orgName, formData.address);
      setFormData({ orgId: '', orgName: '', address: '' });
      setShowForm(false);
      fetchStatus();
    } catch (error) {
      console.error('Error registering organization:', error);
    } finally {
      setSubmitting(false);
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
        <h2 className="text-2xl font-bold text-white">Organization Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Register Organization
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Register New Organization</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Organization ID</label>
              <input
                type="text"
                value={formData.orgId}
                onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="org-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Organization Name</label>
              <input
                type="text"
                value={formData.orgName}
                onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Organization Name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Address (Optional)</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="https://org.example.com"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Register'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Total Organizations</h3>
            <Building2 className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{status?.total_organizations || 0}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Active Organizations</h3>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">{status?.active_organizations || 0}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Current Round</h3>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">{status?.current_round || 0}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Registered Organizations
        </h3>
        {status?.organizations && status.organizations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Organization ID</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Address</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Last Update</th>
                </tr>
              </thead>
              <tbody>
                {status.organizations.map((org, idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="py-3 px-4 text-white">{org.org_id}</td>
                    <td className="py-3 px-4 text-gray-400">{org.address}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${org.status === 'active' ? 'bg-green-900 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{org.last_update || 'Never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No organizations registered yet</p>
        )}
      </div>
    </div>
  );
}
