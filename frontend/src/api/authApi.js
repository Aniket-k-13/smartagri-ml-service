import { jwtDecode } from "jwt-decode";
import { apiClient, tokenStore } from "./client";

/**
 * All calls here hit the REAL Django backend — apps/accounts is fully
 * built (register/login/refresh/me/change-password), so there's no mock
 * fallback for auth. See api/config.js for why.
 */

export async function login({ email, password }) {
  const { data } = await apiClient.post("/accounts/login/", { email, password });
  tokenStore.setTokens({ access: data.access, refresh: data.refresh });
  return decodeUser(data.access);
}

export async function register({ email, password, first_name, last_name, phone_number, role }) {
  // RegisterSerializer only accepts role="farmer" or role="survey_officer" —
  // admin accounts are created via createsuperuser/Django admin only.
  const { data } = await apiClient.post("/accounts/register/", {
    email,
    password,
    first_name,
    last_name,
    phone_number,
    role,
  });
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get("/accounts/me/");
  return data;
}

export async function changePassword({ old_password, new_password }) {
  const { data } = await apiClient.post("/accounts/change-password/", {
    old_password,
    new_password,
  });
  return data;
}

export function logout() {
  tokenStore.clear();
}

export function decodeUser(accessToken) {
  const claims = jwtDecode(accessToken);
  // SmartAgriTokenObtainPairSerializer bakes email/role/full_name into the
  // token, so the UI can route by role without an extra /me/ round trip.
  return {
    id: claims.user_id,
    email: claims.email,
    role: claims.role,
    fullName: claims.full_name,
  };
}

export function getStoredUser() {
  const access = tokenStore.getAccess();
  if (!access) return null;
  try {
    const claims = jwtDecode(access);
    // exp is in seconds; Date.now() is in ms
    if (claims.exp * 1000 < Date.now()) return null;
    return decodeUser(access);
  } catch {
    return null;
  }
}
