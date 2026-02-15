import { createContext, useContext, useState, useEffect } from 'react';

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
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return Promise.reject(new Error('Not JSON'));
        return res.ok ? res.json() : Promise.reject();
      })
      .then((data) => {
        setUser(data);
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, [token]);

  const parseJsonResponse = async (res) => {
    const text = await res.text();
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (text.trimStart().startsWith('<')) {
        throw new Error('Server not reachable. Start the backend with: cd backend && npm start');
      }
      throw new Error('Invalid server response');
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Server not reachable. Start the backend with: cd backend && npm start');
    }
  };

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setToken(data.token, data.user);
    return data.user;
  };

  const register = async (email, password, name, phone, countryCode) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: name || undefined, phone, countryCode }),
    });
    const data = await parseJsonResponse(res);
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
