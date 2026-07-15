import React from 'react';
import { Users, FileText, CheckCircle } from '@phosphor-icons/react';

export function Dashboard() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
            <Users size={32} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>إجمالي المتدربين</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>124</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--success)' }}>
            <CheckCircle size={32} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>طلبات مقبولة</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>85</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: 'var(--warning)' }}>
            <FileText size={32} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>نماذج جديدة</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>12</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>أحدث المتدربين</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-color)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#CBD5E1' }}></div>
              <div>
                <div style={{ fontWeight: 'bold' }}>أحمد محمود</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ahmed@example.com</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--success)', fontWeight: 'bold' }}>
              نشط
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
