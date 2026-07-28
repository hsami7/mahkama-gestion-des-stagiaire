import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { api } from '../services/api';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      api.get('/notifications').then(setNotifications).catch(() => {});
      const interval = setInterval(() => {
        api.get('/notifications').then(setNotifications).catch(() => {});
      }, 15000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleReadNotification = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };
  
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'لوحة القيادة';
      case '/interns': return 'إدارة المتدربين';
      case '/form-builder': return 'منشئ النماذج';
      case '/settings': return 'الإعدادات';
      case '/attendance': return 'سجل الحضور اليومي';
      case '/timeline': return 'مخطط تغطية المتدربين';
      default: return 'نظام إدارة المتدربين';
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main">
        <Header title={getPageTitle(location.pathname)} notifications={notifications} onReadNotification={handleReadNotification} onNotificationClick={n => navigate(n.intern_id ? `/interns/${n.intern_id}` : '#')} />
        <div className="view on">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
