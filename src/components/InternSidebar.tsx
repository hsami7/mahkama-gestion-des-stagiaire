import React from 'react';
import { House, FileText, DownloadSimple, User, SignOut } from '@phosphor-icons/react';

interface InternSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  internData: any;
  user: any;
  missingCount: number;
  onLogout: () => void;
}

export function InternSidebar({ activeTab, setActiveTab, internData, user, missingCount, onLogout }: InternSidebarProps) {
  const navItems = [
    { id: 'status', name: 'حالة الطلب', icon: <House size={24} /> },
    { id: 'docs', name: 'مستنداتي', icon: <FileText size={24} />, badge: missingCount > 0 },
    { id: 'downloads', name: 'التنزيلات', icon: <DownloadSimple size={24} /> },
    { id: 'profile', name: 'ملفي الشخصي', icon: <User size={24} /> },
  ];

  return (
    <div className="sidebar">
      <div className="sb-brand" style={{ padding: '12px 8px 32px' }}>
        <div className="seal" style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--gold-light)' }}>
          س
        </div>
        <div>
          <b style={{ fontSize: '15px' }}>سِجِلّ</b>
          <small>بوابة المتدرب</small>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{ background: isActive ? '' : 'transparent', border: 'none', width: '100%', textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {item.icon}
                {item.name}
              </div>
              {item.badge && <span className="badge-dot" style={{ marginLeft: 'auto' }}></span>}
            </button>
          );
        })}
      </nav>
      
      <div className="nav-foot">
        <button 
          onClick={onLogout}
          className="nav-item logout-item"
          style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}
        >
          <SignOut size={24} />
          خروج
        </button>
      </div>
    </div>
  );
}
