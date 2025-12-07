
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5001/api",
});

// Add token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // we will save token here
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;