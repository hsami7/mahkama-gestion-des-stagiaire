import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlass, Bell, Users, CalendarCheck, FolderUser } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

const GLOBAL_SEARCH_ITEMS = [
  { id: 'interns', title: 'إدارة المتدربين (ملفات المتدربين)', keywords: ['تقييم', 'متدربين', 'ملفات', 'إدارة', 'interns', 'evaluation'], path: '/interns', icon: <FolderUser size={16} /> },
  { id: 'attendance', title: 'الحضور والانصراف', keywords: ['حضور', 'انصراف', 'غياب', 'attendance', 'time'], path: '/attendance', icon: <CalendarCheck size={16} /> },
];

export function Header({ title, missingCount }: { title: string, missingCount?: number }) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = GLOBAL_SEARCH_ITEMS.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) || 
    item.keywords.some(k => k.includes(query.toLowerCase()))
  );

  return (
    <div className="topbar no-print">
      <div className="tb-title">
        <span className="crumb">سِجِلّ</span>
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
        
        <div className="bell">
          <Bell weight="bold" className="icon" />
          {missingCount ? <span style={{position: 'absolute', top: '2px', right: '4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', border: '1.5px solid var(--ink)'}}></span> : null}
        </div>
      </div>
    </div>
  );
}
