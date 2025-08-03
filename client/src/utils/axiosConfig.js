import axios from "axios";

// Custom axios setup
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // This is required to maintain session
});

export default axiosInstance;