import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, tokenStorage } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al recargar se revalida el token: si la cuenta fue desactivada, la sesión cae.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!tokenStorage.get()) {
        setLoading(false);
        return;
      }
      try {
        const { user: current } = await api.me();
        if (!cancelled) setUser(current);
      } catch {
        tokenStorage.clear();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: logged } = await api.login(email, password);
    tokenStorage.set(token);
    setUser(logged);
    return logged;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // La sesión es un JWT sin estado: basta con descartarlo en el cliente.
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  /**
   * Cierra la sesión si el token ya no vale (401) o si la cuenta fue desactivada.
   * Un 403 por falta de permisos de administrador no debe expulsar al usuario.
   */
  const handleAuthError = useCallback((error) => {
    if (!(error instanceof ApiError)) return false;
    const deactivated = error.status === 403 && /desactivada/i.test(error.message);
    if (error.status === 401 || deactivated) {
      tokenStorage.clear();
      setUser(null);
      return true;
    }
    return false;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, handleAuthError, isAdmin: user?.role === 'admin' }),
    [user, loading, login, logout, handleAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
