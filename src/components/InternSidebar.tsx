import React from 'react';
import { House, FileText, User, SignOut } from '@phosphor-icons/react';

interface InternSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  internData: any;
  user: any;
  missingCount: number;
  pendingCount?: number;
  reqDotColor?: string;
  onLogout: () => void;
}

export function InternSidebar({ activeTab, setActiveTab, internData, user, missingCount, pendingCount = 0, reqDotColor = '#F4B400', onLogout }: InternSidebarProps) {
  const isAccepted = internData?.status === 'نشط';
  const navItems = [
    { id: 'status', name: 'حالة الطلب', icon: <House size={24} /> },
    { id: 'profile', name: 'ملفي الشخصي', icon: <User size={24} /> },
  ];
  if (isAccepted) {
    navItems.splice(1, 0, { id: 'documents', name: 'المستندات', icon: <FileText size={24} />, badge: pendingCount > 0 });
  }

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
              {item.badge && <span className="badge-dot" style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: reqDotColor, display: 'inline-block' }}></span>}
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
