import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, FileText, SquaresFour, Gear, Archive, SignOut, ShieldCheck, House, CalendarCheck, ChartLine } from '@phosphor-icons/react';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  const isIntern = user?.role === 'Intern';
  const isAdmin = user?.role === 'Admin';
  
  let canViewAttendance = isAdmin;
  let canViewInterns = isAdmin;
  let canViewForms = isAdmin;
  let canViewVault = isAdmin;

  if (!isAdmin && user?.permissions) {
    try {
      const perms = JSON.parse(user.permissions);
      if (perms?.attendance?.view !== false) canViewAttendance = true; // default true for non-interns unless explicitly false
      if (perms?.interns?.view !== false) canViewInterns = true;
      if (perms?.forms?.view !== false) canViewForms = true;
      if (perms?.vault?.view !== false) canViewVault = true;
    } catch (e) {}
  }

  // If role is manager, give them access by default if permissions are not set
  if (user?.role === 'Manager') {
    if (!user?.permissions) {
      canViewAttendance = true;
      canViewInterns = true;
      canViewForms = true;
      canViewVault = true;
    } else {
      try {
        const perms = JSON.parse(user.permissions);
        canViewAttendance = perms?.attendance?.view === true;
        canViewInterns = perms?.interns?.view === true;
        canViewForms = perms?.forms?.view === true;
        canViewVault = perms?.vault?.view === true;
      } catch (e) {}
    }
  }

  const baseNavItems = [
    { name: 'لوحة القيادة', path: '/', icon: <SquaresFour size={24} />, show: !isIntern },
    { name: 'المتدربين', path: '/interns', icon: <Users size={24} />, show: !isIntern && canViewInterns },
    { name: 'منشئ النماذج', path: '/form-builder', icon: <FileText size={24} />, show: !isIntern && canViewForms },
    { name: 'خزنة المستندات', path: '/vault', icon: <Archive size={24} />, show: !isIntern && canViewVault },
    { name: 'سجل الحضور اليومي', path: '/attendance', icon: <CalendarCheck size={24} />, show: !isIntern && canViewAttendance },
    { name: 'مخطط التغطية', path: '/timeline', icon: <ChartLine size={24} />, show: !isIntern },
    { name: 'المستخدمين والصلاحيات', path: '/users', icon: <ShieldCheck size={24} />, show: isAdmin },
    { name: 'بوابة المتدرب', path: '/', icon: <House size={24} />, show: isIntern },
    { name: 'الإعدادات', path: '/settings', icon: <Gear size={24} />, show: true },
  ];

  const navItems = baseNavItems.filter(item => item.show);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.dispatchEvent(new Event('storage')); // Trigger update in App.tsx
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sb-brand" style={{ padding: '12px 8px 32px' }}>
        <div className="seal" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--gold-light)' }}>
          {user?.name ? user.name.substring(0, 2) : '..'}
        </div>
        <div>
          <b style={{ fontSize: '15px' }}>{user?.name || 'مستخدم'}</b>
          <small>{user?.role === 'Admin' ? 'مدير النظام' : user?.role === 'Intern' ? 'متدرب' : 'مستخدم'}</small>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="nav-foot">
        <button 
          onClick={handleLogout}
          className="nav-item logout-item"
          style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'right' }}
        >
          <SignOut size={19} color="var(--danger)" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
