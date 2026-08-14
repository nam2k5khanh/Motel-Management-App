import axios from "axios";

// Ưu tiên lấy từ biến môi trường (Vite/React), nếu không có mới dùng URL mặc định của Railway
const BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ||
  process.env?.REACT_APP_API_URL ||
  "https://motel-management-app-production.up.railway.app/api";

const axiosClient = axios.create({
  baseURL: BASE_URL,
});

// Interceptor cho Request
axiosClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");

    // Nếu gửi FormData (File upload), XÓA Content-Type thủ công để Trình duyệt tự tạo boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    // Gắn Bearer Token nếu có
    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default axiosClient;
