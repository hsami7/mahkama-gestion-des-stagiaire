import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlass, Bell, Users, CalendarCheck, FolderUser } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

const GLOBAL_SEARCH_ITEMS = [
  { id: 'interns', title: 'إدارة المتدربين (ملفات المتدربين)', keywords: ['تقييم', 'متدربين', 'ملفات', 'إدارة', 'interns', 'evaluation'], path: '/interns', icon: <FolderUser size={16} /> },
  { id: 'attendance', title: 'الحضور والانصراف', keywords: ['حضور', 'انصراف', 'غياب', 'attendance', 'time'], path: '/attendance', icon: <CalendarCheck size={16} /> },
];

export function Header({ title, missingCount, notifications = [], onReadNotification, onNotificationClick }: { title: string, missingCount?: number, notifications?: any[], onReadNotification?: (id: number) => void, onNotificationClick?: (n: any) => void }) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const [showBellDropdown, setShowBellDropdown] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowBellDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = GLOBAL_SEARCH_ITEMS.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) || 
    item.keywords.some(k => k.includes(query.toLowerCase()))
  );
  
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const totalBadgeCount = unreadCount;

  return (
    <div className="topbar no-print">
      <div className="tb-title">
        <span className="crumb">متدرب</span>
        <span id="pageTitle">{title}</span>
      </div>
      
      <div className="tb-right">
        <div className="tb-search" style={{ position: 'relative' }} ref={dropdownRef}>
          <MagnifyingGlass weight="bold" className="icon" />
          <input 
            type="text" 
            placeholder="بحث سريع…" 
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            style={{border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: '13px', color: 'var(--ink)'}} 
          />
          
          {showDropdown && query && results.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden' }}>
              {results.map(item => (
                <div 
                  key={item.id} 
                  style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid var(--line-soft)' }}
                  onClick={() => {
                    navigate(item.path);
                    setQuery('');
                    setShowDropdown(false);
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--line-soft)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: 'var(--gold)' }}>{item.icon}</span>
                  {item.title}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bell" ref={bellRef} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowBellDropdown(!showBellDropdown)}>
          <Bell weight="bold" className="icon" color="#14213D" />
          {totalBadgeCount > 0 ? <span style={{position: 'absolute', top: '2px', right: '4px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--danger)', border: '1.5px solid var(--ink)', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>{totalBadgeCount > 9 ? '9+' : totalBadgeCount}</span> : null}
          
          {showBellDropdown && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 'auto', marginTop: '8px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '280px', maxWidth: '90vw', width: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ padding: '12px', borderBottom: '1px solid var(--line)', fontWeight: 'bold', fontSize: '14px', color: 'var(--ink)' }}>الإشعارات</div>
              {notifications.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--slate)', fontSize: '13px' }}>لا توجد إشعارات</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} style={{ padding: '12px', borderBottom: '1px solid var(--line-soft)', background: n.is_read ? 'transparent' : '#FFF6E5', cursor: 'pointer' }} onClick={() => { 
                    if (!n.is_read && onReadNotification) onReadNotification(n.id);
                    setShowBellDropdown(false);
                    if (onNotificationClick) onNotificationClick(n);
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: n.is_read ? 'var(--ink)' : 'var(--gold-dark)' }}>{n.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--slate)', marginTop: '4px', lineHeight: '1.4' }}>{n.body}</div>
                    {n.created_at && <div style={{ fontSize: '10px', color: 'var(--slate-light)', marginTop: '6px' }}>{new Date(n.created_at).toLocaleString('ar-MA')}</div>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
