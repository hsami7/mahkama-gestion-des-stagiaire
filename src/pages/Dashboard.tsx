import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, WarningCircle, Archive, Plus, Eye } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function Dashboard() {
  const navigate = useNavigate();
  const [interns, setInterns] = useState<any[]>([]);

  useEffect(() => {
    const fetchInterns = async () => {
      try {
        const data = await api.get('/interns');
        setInterns(data);
      } catch (err) {
        console.error("Error fetching interns", err);
      }
    };
    fetchInterns();
  }, []);

  const pendingCount = interns.filter(i => i.status === 'قيد المراجعة').length;
  const missingCount = interns.filter(i => i.status === 'مستندات ناقصة').length;
  const activeCount = interns.filter(i => i.status === 'نشط').length;
  const totalCount = interns.length;

  const recentInterns = [...interns].reverse().slice(0, 5); // Show latest 5

  return (
    <div>
      <div className="section-head">
        <div>
          <h2 style={{ marginTop: 0 }}>لوحة التحكم</h2>
          <p>نظرة عامة على حالة المتدربين اليوم</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/vault')}>
            <Archive weight="bold" size={19} color="#000" /> خزنة الوثائق
          </button>
          <button className="btn btn-gold" onClick={() => navigate('/interns')}>
            <Plus weight="bold" size={19} color="#000" /> متدرب جديد
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="top">
            <div className="ic" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <WarningCircle size={20} weight="fill" />
            </div>
            {pendingCount > 0 && <div className="trend" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>عاجل</div>}
          </div>
          <div className="num">{pendingCount}</div>
          <div className="lbl">قيد المراجعة</div>
        </div>

        <div className="stat-card">
          <div className="top">
            <div className="ic" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <FileText size={20} weight="fill" />
            </div>
          </div>
          <div className="num">{missingCount}</div>
          <div className="lbl">مستندات ناقصة</div>
        </div>

        <div className="stat-card">
          <div className="top">
            <div className="ic" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
              <CheckCircle size={20} weight="fill" />
            </div>
          </div>
          <div className="num">{activeCount}</div>
          <div className="lbl">متدربون نشطون</div>
        </div>

        <div className="stat-card">
          <div className="top">
            <div className="ic" style={{ backgroundColor: 'rgba(20, 33, 61, 0.1)', color: 'var(--ink)' }}>
              <Users size={20} weight="fill" />
            </div>
          </div>
          <div className="num">{totalCount}</div>
          <div className="lbl">إجمالي المتدربين</div>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.25rem' }}>أحدث المتدربين</h2>
        
        <div style={{ position: 'relative', overflow: 'visible' }}>
          <table>
            <thead>
              <tr>
                <th>المتدرب</th>
                <th>تاريخ البدء والانتهاء</th>
                <th>الحالة</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {recentInterns.map(intern => (
                <tr key={intern.id}>
                  <td>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <img src={intern.photo_path || `https://i.pravatar.cc/150?u=${intern.id}`} alt={intern.name} className="avatar-zoom" />
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--ink)' }}>{intern.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>{intern.email || 'لا يوجد بريد'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--success)' }}>{intern.start_date || '—'}</span> 
                      <span style={{ color: 'var(--slate)', margin: '0 4px' }}>إلى</span> 
                      <span style={{ color: 'var(--danger)' }}>{intern.end_date || '—'}</span>
                    </div>
                  </td>
                  <td>
                    {intern.status === 'نشط' && <span className="badge ok"><div className="dot"></div>نشط</span>}
                    {intern.status === 'مستندات ناقصة' && <span className="badge bad"><div className="dot"></div>مستندات ناقصة</span>}
                    {intern.status === 'قيد المراجعة' && <span className="badge warn"><div className="dot"></div>قيد المراجعة</span>}
                    {intern.status === 'منتهي' && <span className="badge" style={{background: 'var(--paper)', color: 'var(--slate)'}}><div className="dot"></div>منتهي</span>}
                    {intern.status === 'مرفوض' && <span className="badge" style={{background: '#FCE8E6', color: '#B3261E', border: '1px solid #F5C6C3'}}><div className="dot" style={{background: '#B3261E'}}></div>مرفوض</span>}
                  </td>
                  <td>
                    <button className="btn btn-ghost sm" onClick={() => navigate(`/interns/${intern.id}`)}>
                      <Eye size={16} /> عرض الملف
                    </button>
                  </td>
                </tr>
              ))}
              {recentInterns.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--slate)', padding: '20px' }}>
                    لا يوجد متدربين حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
