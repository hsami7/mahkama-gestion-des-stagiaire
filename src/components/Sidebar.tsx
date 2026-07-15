import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, FileText, SquaresFour, Settings } from '@phosphor-icons/react';

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: 'لوحة القيادة', path: '/', icon: <SquaresFour size={24} /> },
    { name: 'المتدربين', path: '/interns', icon: <Users size={24} /> },
    { name: 'منشئ النماذج', path: '/form-builder', icon: <FileText size={24} /> },
    { name: 'الإعدادات', path: '/settings', icon: <Settings size={24} /> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-title">نظام إدارة المتدربين</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
