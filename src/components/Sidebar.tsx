import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, FileText, SquaresFour, Gear, Archive, SignOut, ShieldCheck, House } from '@phosphor-icons/react';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  const isIntern = user?.role === 'Intern';
  const isAdmin = user?.role === 'Admin';

  const baseNavItems = [
    { name: 'لوحة القيادة', path: '/', icon: <SquaresFour size={24} />, show: !isIntern },
    { name: 'المتدربين', path: '/interns', icon: <Users size={24} />, show: !isIntern },
    { name: 'منشئ النماذج', path: '/form-builder', icon: <FileText size={24} />, show: !isIntern },
    { name: 'خزنة المستندات', path: '/vault', icon: <Archive size={24} />, show: !isIntern },
    { name: 'المستخدمين والصلاحيات', path: '/users', icon: <ShieldCheck size={24} />, show: isAdmin },
    { name: 'بوابة المتدرب', path: '/', icon: <House size={24} />, show: isIntern },
    { name: 'الإعدادات', path: '/settings', icon: <Gear size={24} />, show: true },
  ];

  const navItems = baseNavItems.filter(item => item.show);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage')); // Trigger update in App.tsx
    navigate('/login');
  };

  return (
    <div className="w-64 bg-white border-l border-gray-100 h-[calc(100vh-64px)] p-4 flex flex-col justify-between">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className={`${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {item.icon}
              </div>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <button 
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-600 hover:bg-red-50 mt-auto w-full"
      >
        <SignOut size={24} />
        <span>تسجيل الخروج</span>
      </button>
    </div>
  );
}
