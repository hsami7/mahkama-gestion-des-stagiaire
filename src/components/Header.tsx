import React from 'react';
import { MagnifyingGlass, Bell } from '@phosphor-icons/react';

export function Header({ title, missingCount }: { title: string, missingCount?: number }) {
  return (
    <div className="topbar no-print">
      <div className="tb-title">
        <span className="crumb">سِجِلّ</span>
        <span id="pageTitle">{title}</span>
      </div>
      
      <div className="tb-right">
        <div className="tb-search">
          <MagnifyingGlass weight="bold" className="icon" />
          <input type="text" placeholder="بحث سريع…" style={{border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: '13px', color: 'var(--ink)'}} />
        </div>
        

        <div className="bell">
          <Bell weight="bold" className="icon" />
          {missingCount ? <span style={{position: 'absolute', top: '2px', right: '4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', border: '1.5px solid var(--ink)'}}></span> : null}
        </div>
      </div>
    </div>
  );
}
