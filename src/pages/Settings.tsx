import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function Settings() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Integration Settings
  const [sheetLink, setSheetLink] = useState('');
  const [microsoftExcelLink, setMicrosoftExcelLink] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [emailProvider, setEmailProvider] = useState('gmail');
  const [gmailAddress, setGmailAddress] = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [integrationMsg, setIntegrationMsg] = useState('');

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    if (isAdmin) {
      Promise.all([
        api.get('/logs'),
        api.get('/integration/settings')
      ]).then(([logsData, settingsData]) => {
        setLogs(logsData);
        setSheetLink(settingsData.google_sheet_link || '');
        setMicrosoftExcelLink(settingsData.microsoft_excel_link || '');
        setServiceAccountJson(settingsData.service_account_json || '');
        setEmailProvider(settingsData.email_provider || 'gmail');
        setGmailAddress(settingsData.gmail_address || '');
        setGmailAppPassword(settingsData.gmail_app_password || '');
        setLoading(false);
      }).catch(err => {
        console.error("Failed to fetch data", err);
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
  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/integration/settings', {
        google_sheet_link: sheetLink,
        microsoft_excel_link: microsoftExcelLink,
        service_account_json: serviceAccountJson,
        email_provider: emailProvider,
        gmail_address: gmailAddress,
        gmail_app_password: gmailAppPassword
      });
      setIntegrationMsg('تم حفظ الإعدادات بنجاح');
      setTimeout(() => setIntegrationMsg(''), 3000);
    } catch (err: any) {
      setIntegrationMsg('فشل في حفظ الإعدادات');
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
            <button type="submit" className="btn btn-gold" style={{ padding: '12px 32px' }}>تغيير كلمة المرور</button>
            {msg && <span style={{ fontWeight: 'bold', color: msg.includes('نجاح') ? 'var(--success)' : 'var(--danger)' }}>{msg}</span>}
          </div>
        </form>
      </div>

      {isAdmin && (
        <div className="card" style={{ padding: '32px', marginBottom: '24px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>ربط النماذج (Google & Microsoft) والبريد التلقائي</h3>
          <p style={{ color: 'var(--slate)', fontSize: '0.85rem', marginBottom: '24px' }}>
            أدخل روابط النماذج لجلب الردود تلقائياً. لإنشاء نماذج جوجل برمجياً، أضف محتوى Service Account JSON. للبريد التلقائي، اختر المزود وأدخل بيانات الدخول.
          </p>
          <form onSubmit={handleSaveIntegration}>
            <div className="form-group">
              <label>رابط Google Sheet (للردود اليدوية)</label>
              <input 
                type="text" 
                placeholder="https://docs.google.com/spreadsheets/d/..." 
                value={sheetLink}
                onChange={e => setSheetLink(e.target.value)}
                className="input"
                dir="ltr"
                style={{ textAlign: 'left' }}
              />
            </div>

            <div className="form-group">
              <label>رابط Microsoft Excel (من OneDrive)</label>
              <input 
                type="text" 
                placeholder="https://1drv.ms/x/c/..." 
                value={microsoftExcelLink}
                onChange={e => setMicrosoftExcelLink(e.target.value)}
                className="input"
                dir="ltr"
                style={{ textAlign: 'left' }}
              />
            </div>

            <div className="form-group">
              <label>محتوى ملف Service Account JSON (لجوجل)</label>
              <textarea 
                placeholder='{"type": "service_account", "project_id": "..."}'
                value={serviceAccountJson}
                onChange={e => setServiceAccountJson(e.target.value)}
                className="input"
                dir="ltr"
                style={{ textAlign: 'left', minHeight: '80px', fontFamily: 'monospace', fontSize: '12px' }}
              />
            </div>
            
            <div className="form-group">
              <label>مزود البريد الإلكتروني</label>
              <select 
                value={emailProvider} 
                onChange={e => setEmailProvider(e.target.value)}
                className="input"
              >
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook / Office 365</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>البريد الإلكتروني المرسِل</label>
                <input 
                  type="email" 
                  placeholder="example@gmail.com" 
                  value={gmailAddress}
                  onChange={e => setGmailAddress(e.target.value)}
                  className="input"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>كلمة المرور (أو App Password)</label>
                <input 
                  type="password" 
                  placeholder="كلمة المرور" 
                  value={gmailAppPassword}
                  onChange={e => setGmailAppPassword(e.target.value)}
                  className="input"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button type="submit" className="btn btn-gold" style={{ padding: '12px 32px' }}>حفظ إعدادات الربط</button>
              {integrationMsg && <span style={{ fontWeight: 'bold', color: integrationMsg.includes('نجاح') ? 'var(--success)' : 'var(--danger)' }}>{integrationMsg}</span>}
            </div>
          </form>
        </div>
      )}

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
