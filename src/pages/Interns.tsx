import React, { useState, useEffect } from 'react';
import { DownloadSimple, UploadSimple, PencilSimple, UserPlus } from '@phosphor-icons/react';

export function Interns() {
  const [interns, setInterns] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/interns')
      .then(res => res.json())
      .then(data => setInterns(data))
      .catch(err => console.error("Error fetching interns:", err));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem' }}>قائمة المتدربين</h2>
        <button className="btn">
          <UserPlus size={20} /> إضافة متدرب يدوياً
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        {/* Intern List */}
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px' }}>الصورة</th>
                <th style={{ padding: '12px' }}>الاسم</th>
                <th style={{ padding: '12px' }}>البريد الإلكتروني</th>
                <th style={{ padding: '12px' }}>الحالة</th>
                <th style={{ padding: '12px' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {interns.map((intern) => (
                <tr key={intern.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#CBD5E1' }}></div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{intern.name}</td>
                  <td style={{ padding: '12px' }}>{intern.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      backgroundColor: intern.status === 'نشط' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: intern.status === 'نشط' ? 'var(--success)' : 'var(--warning)',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {intern.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button className="btn btn-secondary" style={{ padding: '6px' }}><PencilSimple size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Intern Profile / Documents */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#CBD5E1', margin: '0 auto 12px' }}></div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>أحمد محمود</h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>قسم تكنولوجيا المعلومات</div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          <div>
            <h4 style={{ marginBottom: '12px' }}>المستندات المطلوبة</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <span>نسخة البطاقة</span>
                <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><DownloadSimple size={20} /></button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <span>طلب التدريب</span>
                <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><UploadSimple size={20} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
