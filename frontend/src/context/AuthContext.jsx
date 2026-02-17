import { createContext, useContext, useState, useEffect } from 'react';
import { getApiBase, safeJson } from '../utils/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'aitchbee-token';
const USER_KEY = 'aitchbee-user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  const setToken = (t, u) => {
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
      setTokenState(t);
      setUser(u ?? null);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setTokenState(null);
      setUser(null);
    }
  };

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    fetch(`${getApiBase()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) return Promise.reject();
        return safeJson(res);
      })
      .then((data) => {
        setUser(data);
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const base = getApiBase();
    const url = `${base}/api/auth/login`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email).trim(), password: String(password) }),
    });
    let data;
    try {
      data = await safeJson(res);
    } catch (parseErr) {
      if (res.status === 405) throw new Error('Login not available. Set BACKEND_URL in Vercel or deploy the backend.');
      if (res.status === 503) throw new Error('Backend not configured. Set BACKEND_URL in Vercel.');
      throw new Error(parseErr.message || 'Invalid response from server');
    }
    if (!res.ok) throw new Error(data?.error || 'Login failed');
    if (!data.token || !data.user) throw new Error('Invalid login response');
    setToken(data.token, data.user);
    return data.user;
  };

  const register = async (email, password, name, phone, countryCode) => {
    const res = await fetch(`${getApiBase()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: name || undefined, phone, countryCode }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setToken(data.token, data.user);
    return data.user;
  };

  const logout = () => setToken(null);

  const authHeader = () => (token ? { Authorization: `Bearer ${token}` } : {});

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authHeader, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
