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
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      const fetchNotifs = () => {
        api.get('/notifications').then(newNotifs => {
          setNotifications(prev => {
            if (prev.length > 0) {
              const newUnread = newNotifs.filter((n: any) => !n.is_read && !prev.find((p: any) => p.id === n.id));
              newUnread.forEach((n: any) => {
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(n.title, { body: n.body });
                }
              });
            }
            return newNotifs;
          });
        }).catch(() => {});
      };
      
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 15000);
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
      case '/guide': return 'دليل الاستخدام والشروحات المصورة';
      default: return 'نظام إدارة المتدربين';
    }
  };

  return (
    <div className="app-container">
      <Sidebar hasUnread={notifications.some(n => !n.is_read)} />
      <div className="main-content">
        <Header title={getPageTitle(location.pathname)} notifications={notifications} onReadNotification={handleReadNotification} onNotificationClick={n => navigate(n.intern_id ? `/interns/${n.intern_id}` : '#')} />
        <div className="view on">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
