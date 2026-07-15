import React from 'react';

export function Header({ title }: { title: string }) {
  return (
    <div className="header">
      <h1 className="header-title">{title}</h1>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ fontWeight: 600 }}>المسؤول (Admin)</div>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
          }}
        >
          A
        </div>
      </div>
    </div>
  );
}
