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
      default: return 'نظام إدارة المتدربين';
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header title={getPageTitle(location.pathname)} />
        <Outlet />
      </main>
    </div>
  );
}
