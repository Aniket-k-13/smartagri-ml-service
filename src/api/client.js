import axios from "axios";
import { API_BASE_URL } from "./config";

const ACCESS_KEY = "smartagri_access";
const REFRESH_KEY = "smartagri_refresh";

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setTokens: ({ access, refresh }) => {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const access = tokenStore.getAccess();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Access tokens default to a 60 min lifetime (JWT_ACCESS_LIFETIME_MIN in the
// backend's .env). Refresh tokens rotate (ROTATE_REFRESH_TOKENS=True) and
// last 7 days by default. On a 401, try exactly once to refresh and replay
// the original request before giving up and forcing a re-login.
let refreshInFlight = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status !== 401 || original._retried || original.url?.includes("/accounts/login")) {
      return Promise.reject(error);
    }

    const refresh = tokenStore.getRefresh();
    if (!refresh) {
      tokenStore.clear();
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      refreshInFlight =
        refreshInFlight ||
        axios.post(`${API_BASE_URL}/accounts/login/refresh/`, { refresh }).finally(() => {
          refreshInFlight = null;
        });

      const { data } = await refreshInFlight;
      // ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION means the backend
      // issues a new refresh token too — always store both if present.
      tokenStore.setTokens({ access: data.access, refresh: data.refresh });

      original.headers.Authorization = `Bearer ${data.access}`;
      return apiClient(original);
    } catch (refreshError) {
      tokenStore.clear();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);
