import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8080/api",
  // XÓA DÒNG "Content-Type": "application/json" ở đây để Axios tự nhận diện
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
