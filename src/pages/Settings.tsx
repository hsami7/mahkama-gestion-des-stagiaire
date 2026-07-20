import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function Settings() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    if (isAdmin) {
      api.get('/logs')
        .then(data => {
          setLogs(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch logs", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMsg('يرجى ملء جميع الحقول');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg('كلمتا المرور غير متطابقتين');
      return;
    }
    try {
      const res = await api.put('/users/password', { old_password: oldPassword, new_password: newPassword });
      setMsg('تم تغيير كلمة المرور بنجاح');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMsg(err.response?.data?.msg || 'فشل في تغيير كلمة المرور');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>إعدادات النظام</h2>
      
      <div className="card" style={{ padding: '32px', marginBottom: '24px', maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--line)' }}>تغيير كلمة المرور</h3>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>كلمة المرور الحالية *</label>
            <input 
              type="password" 
              placeholder="أدخل كلمة المرور الحالية" 
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="input"
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>كلمة المرور الجديدة *</label>
              <input 
                type="password" 
                placeholder="أدخل كلمة المرور الجديدة" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input"
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>تأكيد كلمة المرور الجديدة *</label>
              <input 
                type="password" 
                placeholder="أعد إدخال كلمة المرور" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input"
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button type="submit" className="btn btn-gold" style={{ padding: '12px 32px' }}>حفظ التغييرات</button>
            {msg && <span style={{ fontWeight: 'bold', color: msg.includes('نجاح') ? 'var(--success)' : 'var(--danger)' }}>{msg}</span>}
          </div>
        </form>
      </div>

      {!isAdmin ? (
        <div className="card" style={{ padding: '22px' }}>
          <p style={{ color: 'var(--slate)' }}>إعدادات النظام قيد التطوير. لا تملك صلاحية الوصول للسجلات.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>سجل نشاطات النظام</h3>
          
          {loading ? (
            <p>جاري تحميل السجلات...</p>
          ) : logs.length === 0 ? (
            <p style={{ color: 'var(--slate)' }}>لا توجد نشاطات مسجلة بعد.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--gold-light)' }}>
                    <th style={{ padding: '12px 8px', color: 'var(--slate)', fontWeight: 'normal' }}>الوقت</th>
                    <th style={{ padding: '12px 8px', color: 'var(--slate)', fontWeight: 'normal' }}>المستخدم</th>
                    <th style={{ padding: '12px 8px', color: 'var(--slate)', fontWeight: 'normal' }}>النشاط</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--paper)' }}>
                      <td style={{ color: 'var(--slate)', fontSize: '13px' }}>
                        {(() => {
                          const d = new Date(log.timestamp);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          const time = d.toTimeString().split(' ')[0];
                          return `${day}/${month}/${year} ${time}`;
                        })()}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{log.user}</td>
                      <td style={{ padding: '12px 8px' }}>{log.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
