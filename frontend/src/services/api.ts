import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const fetchCurrentData = async () => {
  const response = await axios.get(`${API_URL}/current-data`);
  return response.data;
};

export const fetchPrediction = async () => {
  const response = await axios.get(`${API_URL}/prediction`);
  return response.data;
};

export const fetchHistoricalData = async (days = 7) => {
  const response = await axios.get(`${API_URL}/historical-data?days=${days}`);
  return response.data;
};

export const fetchEnergyBreakdown = async () => {
  const response = await axios.get(`${API_URL}/energy-breakdown`);
  return response.data;
};
