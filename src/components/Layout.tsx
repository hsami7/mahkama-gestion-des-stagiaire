import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
  const location = useLocation();
  
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
        <Header title={getPageTitle(location.pathname)} />
        <div className="view on">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
