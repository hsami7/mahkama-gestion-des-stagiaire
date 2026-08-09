import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import {
  mergePermissions,
  ADMIN_PERMISSIONS,
} from '../permissions';
import type { PermissionAction, PermissionMap } from '../permissions';

interface PermissionContextValue {
  role: string | null;
  isAdmin: boolean;
  permissions: PermissionMap | null;
  ready: boolean;
  can: (module: string, action: PermissionAction) => boolean;
  refresh: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue>({
  role: null,
  isAdmin: false,
  permissions: null,
  ready: false,
  can: () => false,
  refresh: async () => {},
});

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap | null>(null);
  const [ready, setReady] = useState(false);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const isAdmin = role === 'Admin';

  const refresh = useMemo(() => async () => {
    const userStr = localStorage.getItem('user');
    const cached = userStr ? JSON.parse(userStr) : null;
    if (cached?.role === 'Intern') {
      setRole('Intern');
      setPermissions(null);
      setReady(true);
      return;
    }
    if (!localStorage.getItem('token')) {
      setRole(null);
      setPermissions(null);
      setReady(false);
      return;
    }
    try {
      const me = await api.get('/auth/me');
      setRole(me.role);
      setPermissions(me.role === 'Admin' ? ADMIN_PERMISSIONS : mergePermissions(me.permissions));
      setReady(true);
    } catch {
      // Keep last known state; token/logout handling lives in api.ts.
    }
  }, []);

  refreshRef.current = refresh;

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Revalidate on navigation and window focus so a revoked permission
  // takes effect immediately (client side) — the backend also enforces it.
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  // Periodic revalidation to catch permission changes while idle.
  useEffect(() => {
    const interval = setInterval(() => refreshRef.current(), 60000);
    return () => clearInterval(interval);
  }, []);

  const value = useMemo<PermissionContextValue>(() => ({
    role,
    isAdmin,
    permissions,
    ready,
    can: (module, action) => {
      if (role === 'Admin') return true;
      if (!permissions) return false;
      return Boolean(permissions[module]?.[action]);
    },
    refresh,
  }), [role, isAdmin, permissions, ready, refresh]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions() {
  return useContext(PermissionContext);
}
