import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { cacheOnlineResponse, cacheOnlineUser, getOfflineUser, offlineRequest } from "./offline";

const TOKEN_KEY = "hs_token";

const DEFAULT_BASE_URL = Platform.OS === "android"
  ? "http://10.0.2.2:8000"
  : "http://localhost:8000";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE_URL;

export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null) {
  if (Platform.OS === "web") {
    try {
      if (token) {
        window.localStorage.setItem(TOKEN_KEY, token);
      } else {
        window.localStorage.removeItem(TOKEN_KEY);
      }
      return;
    } catch {
      return;
    }
  }

  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export const api = axios.create({ baseURL: BASE_URL, timeout: 25000, adapter: async config => {
  const authorization = String(config.headers?.Authorization || config.headers?.authorization || "");
  if (authorization.includes("Bearer offline:")) return offlineRequest(config);
  try {
    const response = await axios.getUri(config);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const result = await fetch(response, {
      method: config.method?.toUpperCase(),
      headers: config.headers as Record<string, string>,
      body: config.data,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await result.json().catch(() => null);
    if (!result.ok) {
      throw { response: { status: result.status, data }, config };
    }
    if (config.url?.startsWith("/auth/") && data?.user) await cacheOnlineUser(data.user);
    if (config.url) await cacheOnlineResponse(config.url, String(config.method || "get").toLowerCase(), data);
    return { data, status: result.status, statusText: result.statusText, headers: {}, config, request: result };
  } catch (error: any) {
    if (error?.response) throw error;
    const cachedUser = await getOfflineUser();
    if (cachedUser && authorization.startsWith("Bearer ") && !authorization.includes("Bearer offline:")) {
      await setToken(`offline:${cachedUser.email}`);
      config.headers.Authorization = `Bearer offline:${cachedUser.email}`;
    }
    return offlineRequest(config);
  }
} });
api.interceptors.request.use(async config => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function startOffline(name: string) {
  return goOffline(name);
}

export async function createOffline(name: string) {
  const email = `offline-${Date.now()}@healthsphere.local`;
  const response = await offlineRequest({
    url: "/auth/register",
    method: "post",
    data: { name: name.trim() || "Wellness User", email, password: `local-${Date.now()}` },
    headers: {},
  });
  await setToken(response.data.access_token);
  return response.data.user;
}

export async function goOffline(name = "") {
  const cachedUser = await offlineRequest({ url: "/users/me", method: "get", data: {}, headers: { Authorization: "Bearer offline:" } }).catch(() => null);
  if (cachedUser?.data) {
    await setToken(`offline:${cachedUser.data.email}`);
    return cachedUser.data;
  }
  return createOffline(name);
}
