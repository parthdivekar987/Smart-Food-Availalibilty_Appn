import axios from "axios"

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1"
/** Backend origin (no /api/v1), used for sockets and uploaded files */
export const BACKEND_ORIGIN: string = API_BASE_URL.replace(/\/api\/v1\/?$/, "")

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
})

const clearAuth = () => {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("user")
}

// Attach the access token to every request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Unwrap response data; transparently refresh an expired access token once
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem("refreshToken")

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
          const { accessToken } = response.data

          localStorage.setItem("accessToken", accessToken)
          axiosClient.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`

          return axiosClient(originalRequest)
        } catch (refreshError) {
          console.error("Session expired:", refreshError)
          clearAuth()
          window.location.href = "/login"
        }
      } else {
        clearAuth()
      }
    }

    return Promise.reject(error)
  }
)

/** Extract a human-readable message from an API error */
export const getApiErrorMessage = (error: any, fallback = "Something went wrong. Please try again."): string => {
  if (!error?.response) return "Cannot reach the server. Please check your connection."
  return error.response.data?.message || error.response.data?.error || fallback
}

export default axiosClient
