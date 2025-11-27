import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API methods
export const detectQuery = async (query, sourceIp = null, userAgent = null) => {
  try {
    const response = await api.post('/detect', {
      query,
      source_ip: sourceIp,
      user_agent: userAgent,
    });
    return response.data;
  } catch (error) {
    console.error('Detection error:', error);
    throw error;
  }
};

export const getAttacks = async (limit = 100) => {
  try {
    const response = await api.get(`/attacks?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Get attacks error:', error);
    throw error;
  }
};

export const getStatistics = async () => {
  try {
    const response = await api.get('/stats');
    return response.data;
  } catch (error) {
    console.error('Get statistics error:', error);
    throw error;
  }
};

// Alias for backward compatibility
export const getStats = getStatistics;

export const getTimeline = async (hours = 24) => {
  try {
    const response = await api.get(`/timeline?hours=${hours}`);
    return response.data;
  } catch (error) {
    console.error('Get timeline error:', error);
    throw error;
  }
};

export const getPatterns = async () => {
  try {
    const response = await api.get('/patterns');
    return response.data;
  } catch (error) {
    console.error('Get patterns error:', error);
    throw error;
  }
};

// Federated Learning APIs
export const registerOrganization = async (orgId, orgName, address) => {
  try {
    const response = await api.post('/federated/register', { org_id: orgId, org_name: orgName, address });
    return response.data;
  } catch (error) {
    console.error('Register organization error:', error);
    throw error;
  }
};

export const getFederatedStatus = async () => {
  try {
    const response = await api.get('/federated/status');
    return response.data;
  } catch (error) {
    console.error('Get federated status error:', error);
    throw error;
  }
};

export const startFederatedRound = async (roundNumber = null) => {
  try {
    const response = await api.post('/federated/start-round', { round_number: roundNumber });
    return response.data;
  } catch (error) {
    console.error('Start federated round error:', error);
    throw error;
  }
};

export const getFederatedHistory = async (limit = 10) => {
  try {
    const response = await api.get(`/federated/history?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Get federated history error:', error);
    throw error;
  }
};

export const downloadGlobalModel = async () => {
  try {
    const response = await api.get('/federated/download-model');
    return response.data;
  } catch (error) {
    console.error('Download model error:', error);
    throw error;
  }
};

// System Monitoring APIs
export const getSystemHealth = async () => {
  try {
    const response = await axios.get('http://localhost:8000/health');
    return response.data;
  } catch (error) {
    console.error('Get system health error:', error);
    throw error;
  }
};

export const getSystemInfo = async () => {
  try {
    const response = await axios.get('http://localhost:8000/');
    return response.data;
  } catch (error) {
    console.error('Get system info error:', error);
    throw error;
  }
};

export default api;

