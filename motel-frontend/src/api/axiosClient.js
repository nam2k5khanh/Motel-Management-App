import axios from "axios";

// Đảm bảo loại bỏ dấu slash / ở cuối nếu lỡ nhập thừa trên Vercel
const rawBaseUrl =
  import.meta.env?.VITE_API_BASE_URL ||
  "https://motel-management-app.onrender.com/api";
const BASE_URL = rawBaseUrl.endsWith("/")
  ? rawBaseUrl.slice(0, -1)
  : rawBaseUrl;

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor cho Request
axiosClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");

    // Nếu gửi FormData, để browser tự thêm boundary
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
  (error) => Promise.reject(error),
);

export const uploadImageApi = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  // Vì baseURL đã có /api, ở đây chỉ cần gọi /upload/image
  const response = await axiosClient.post("/upload/image", formData);
  return response.data;
};

export default axiosClient;
