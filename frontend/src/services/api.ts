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

export const fetchLoads = async () => {
  const response = await axios.get(`${API_URL}/loads`);
  return response.data;
};

export const toggleLoad = async (loadId: string) => {
  const response = await axios.post(`${API_URL}/loads/${loadId}/toggle`);
  return response.data;
};

export const shedSuggestedLoads = async () => {
  const response = await axios.post(`${API_URL}/loads/shed-suggested`);
  return response.data;
};

export const shedAllLoads = async () => {
  const response = await axios.post(`${API_URL}/loads/shed-all`);
  return response.data;
};

export const fetchSingleLoad = async (loadId: string) => {
  const response = await axios.get(`${API_URL}/loads/${loadId}`);
  return response.data;
};

export const postClassroomSensorData = async (payload: any) => {
  const response = await axios.post(`${API_URL}/classroom/II-ECE-B/sensor-data`, payload);
  return response.data;
};

export const simulateSensorConnection = async (enable: boolean) => {
  const response = await axios.post(`${API_URL}/classroom/II-ECE-B/simulate-sensor`, { enable });
  return response.data;
};

export const restoreAllLoads = async () => {
  const response = await axios.post(`${API_URL}/loads/restore-all`);
  return response.data;
};
