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

export default api;

