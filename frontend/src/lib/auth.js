import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

const RAW_URL =
  (typeof import.meta !== "undefined" && (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_BACKEND_URL || import.meta.env?.REACT_APP_BACKEND_URL)) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_BACKEND_URL) ||
  "https://swatsbio-production.up.railway.app";

const BACKEND_URL = (RAW_URL && RAW_URL !== "undefined")
  ? RAW_URL.replace(/\/+$/, "")
  : "https://swatsbio-production.up.railway.app";

export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("swats_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export function fileUrl(path) {
  if (!path || path === "invisible" || path === "none") return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/api/")) return `${BACKEND_URL}${path}`;
  return `${API}/files/${path}`;
}

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (token) {
        localStorage.setItem("swats_token", token);
        params.delete("token");
        const newSearch = params.toString();
        window.history.replaceState({}, "", window.location.pathname + (newSearch ? `?${newSearch}` : ""));
      }
    }
    refresh();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.token || data.access_token) {
      localStorage.setItem("swats_token", data.token || data.access_token);
    }
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    if (data.token || data.access_token) {
      localStorage.setItem("swats_token", data.token || data.access_token);
    }
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("swats_token");
    }
    setUser(false);
  };


  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
