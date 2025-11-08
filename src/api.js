import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://192.168.18.7:1337",
});

// Attach token if available
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
