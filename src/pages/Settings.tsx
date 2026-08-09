import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { usePermissions } from '../context/PermissionContext';
import { PencilSimple, Trash } from '@phosphor-icons/react';

export function Settings() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  
  // Integration Settings
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [sheetLink, setSheetLink] = useState('');
  const [microsoftExcelLink, setMicrosoftExcelLink] = useState('');
  const [emailProvider, setEmailProvider] = useState('gmail');
  const [gmailAddress, setGmailAddress] = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [integrationMsg, setIntegrationMsg] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncingMs, setSyncingMs] = useState(false);

  const { isAdmin, can, ready } = usePermissions();
  const canViewSettings = isAdmin || can('system_settings', 'view');
  const canViewLogs = isAdmin || can('activity_logs', 'view');
  const canViewTemplates = isAdmin || can('doc_templates', 'view');

  useEffect(() => {
    if (!ready) return;
    const promises: Promise<any>[] = [];
    if (canViewLogs) promises.push(api.get('/logs'));
    if (canViewSettings) promises.push(api.get('/integration/settings'));
    if (promises.length === 0) { setLoading(false); return; }
    Promise.all(promises).then((results: any[]) => {
      const [logsData, settingsData] = results;
      if (logsData) setLogs(logsData);
      if (settingsData) {
        setSheetLink(settingsData.google_sheet_link || '');
        setMicrosoftExcelLink(settingsData.microsoft_excel_link || '');
        setGoogleClientId(settingsData.google_client_id || '');
        setGoogleClientSecret(settingsData.google_client_secret || '');
        setEmailProvider(settingsData.email_provider || 'gmail');
        setGmailAddress(settingsData.gmail_address || '');
        setGmailAppPassword(settingsData.gmail_app_password || '');
      }
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch data", err);
      setLoading(false);
    });
  }, [ready, canViewLogs, canViewSettings]);

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
        google_client_id: googleClientId,
        google_client_secret: googleClientSecret,
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

      {canViewSettings && (
        <div className="card" style={{ padding: '32px', marginBottom: '24px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>ربط النماذج (Google & Microsoft) والبريد التلقائي</h3>
          <p style={{ color: 'var(--slate)', fontSize: '0.85rem', marginBottom: '24px' }}>
            أدخل روابط النماذج لجلب الردود تلقائياً. للبريد التلقائي، اختر المزود وأدخل بيانات الدخول.
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
              <label>Google Client ID (لإنشاء النماذج تلقائياً)</label>
              <input 
                type="text"
                placeholder="...apps.googleusercontent.com"
                value={googleClientId}
                onChange={e => setGoogleClientId(e.target.value)}
                className="input"
                dir="ltr"
                style={{ textAlign: 'left' }}
              />
            </div>

            <div className="form-group">
              <label>Google Client Secret</label>
              <input 
                type="text"
                placeholder="GOCSPX-..."
                value={googleClientSecret}
                onChange={e => setGoogleClientSecret(e.target.value)}
                className="input"
                dir="ltr"
                style={{ textAlign: 'left' }}
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
                <label>كلمة مرور التطبيقات (App Password)</label>
                <input 
                  type="password"
                  value={gmailAppPassword}
                  onChange={e => setGmailAppPassword(e.target.value)}
                  className="input"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>
            
              <div className="form-group" style={{ marginTop: 20 }}>
                <button 
                  type="button"
                  className="btn btn-outline" 
                  onClick={async () => {
                    if (!googleClientId || !googleClientSecret) {
                      setIntegrationMsg('خطأ: الرجاء حفظ Client ID و Client Secret أولاً');
                      return;
                    }
                    try {
                      setIntegrationMsg('جاري فتح صفحة تسجيل الدخول لجوجل...');
                      const res = await api.get('/oauth/google/url');
                      try {
                        const electron = window.require ? window.require('electron') : require('electron');
                        electron.shell.openExternal(res.url);
                      } catch (e: any) {
                        setIntegrationMsg('محاولة بديلة... ' + e.message);
                        window.open(res.url, '_blank');
                      }
                      setIntegrationMsg('تم فتح نافذة الدخول بنجاح.');
                    } catch (err: any) {
                      setIntegrationMsg('خطأ: ' + (err.response?.data?.msg || err.message || String(err)));
                    }
                  }}
                  disabled={!googleClientId || !googleClientSecret}
                >
                  تسجيل الدخول إلى Google (لإنشاء النماذج)
                </button>
              </div>

            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button type="submit" className="btn btn-gold" style={{ padding: '12px 32px' }}>حفظ إعدادات الربط</button>
              {integrationMsg && <span style={{ fontWeight: 'bold', color: integrationMsg.includes('نجاح') ? 'var(--success)' : 'var(--danger)' }}>{integrationMsg}</span>}
            </div>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--line)', display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={async () => {
                setSyncing(true);
                try {
                  const res = await api.post('/forms/sync-google', {});
                  toast.success(res.added > 0 ? `تم جلب ${res.added} طلب جديد من نموذج جوجل` : 'لا توجد طلبات جديدة من جوجل');
                } catch (e: any) {
                  toast.error(e.message || 'حدث خطأ أثناء الاتصال بجوجل، تأكد من الإعدادات');
                } finally { setSyncing(false); }
              }} disabled={syncing}>
                {syncing ? 'جاري الجلب...' : 'مزامنة جوجل الآن'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={async () => {
                setSyncingMs(true);
                try {
                  const res = await api.post('/forms/sync-microsoft', {});
                  toast.success(res.added > 0 ? `تم جلب ${res.added} طلب جديد من مايكروسوفت` : 'لا توجد طلبات جديدة من مايكروسوفت');
                } catch (e: any) {
                  toast.error(e.message || 'حدث خطأ أثناء الاتصال بمايكروسوفت، تأكد من الرابط في الإعدادات');
                } finally { setSyncingMs(false); }
              }} disabled={syncingMs}>
                {syncingMs ? 'جاري الجلب...' : 'مزامنة مايكروسوفت الآن'}
              </button>
            </div>
          </form>
        </div>
      )}

      {canViewTemplates && (
        <DocumentTemplatesManager />
      )}

      {!canViewLogs && !canViewSettings ? (
        <div className="card" style={{ padding: '22px' }}>
          <p style={{ color: 'var(--slate)' }}>إعدادات النظام قيد التطوير. لا تملك صلاحية الوصول للسجلات.</p>
        </div>
      ) : canViewLogs ? (
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
      ) : null}
    </div>
  );
}

function DocumentTemplatesManager() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState<any | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const toast = useToast();

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/admin/document-templates');
      setTemplates(res);
    } catch { /* ignore */ }
  };

  const API_BASE = (window as any).API_BASE || 'http://localhost:5055';
  const token = localStorage.getItem('token');
  const authHeaders = (token ? { 'Authorization': `Bearer ${token}` } : {}) as HeadersInit;

  const addTemplate = async () => {
    if (!label.trim()) return toast.warning('الرجاء إدخال اسم المستند');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('label', label.trim());
      if (file) fd.append('file', file);
      const res = await fetch(`${API_BASE}/admin/document-templates`, {
        method: 'POST', headers: authHeaders, body: fd
      });
      if (!res.ok) throw new Error((await res.json()).msg || 'فشل الإضافة');
      toast.success('تمت الإضافة');
      setLabel('');
      setFile(null);
      fetchTemplates();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const saveEdit = async () => {
    if (!editModal || !editLabel.trim()) return;
    try {
      const fd = new FormData();
      fd.append('label', editLabel.trim());
      if (editFile) fd.append('file', editFile);
      const res = await fetch(`${API_BASE}/admin/document-templates/${editModal.id}`, {
        method: 'PUT', headers: authHeaders, body: fd
      });
      if (!res.ok) throw new Error((await res.json()).msg || 'فشل التحديث');
      toast.success('تم التحديث');
      setEditModal(null);
      setEditFile(null);
      fetchTemplates();
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleActive = async (t: any) => {
    try {
      await api.put(`/admin/document-templates/${t.id}`, { is_active: !t.is_active });
      fetchTemplates();
    } catch (e: any) { toast.error(e.message); }
  };

  const removeTemplate = async (id: number) => {
    try {
      await api.delete(`/admin/document-templates/${id}`);
      toast.success('تم الحذف');
      fetchTemplates();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="card" style={{ padding: '22px', marginBottom: '22px' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>قوالب المستندات المطلوبة</h3>
      <p style={{ fontSize: '13px', color: 'var(--slate)', marginBottom: '16px' }}>
        المستندات المدرجة هنا تُنشأ تلقائياً لكل متدرب عند إضافته أو عند تفعيل حالته.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="اسم المستند (مثال: عقد التدريب)"
          value={label}
          onChange={e => setLabel(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 6 }}
        />
        <input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.png"
          onChange={e => setFile(e.target.files?.[0] || null)}
          style={{ flex: 1, minWidth: 150, padding: '6px', border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }}
        />
        <button className="btn btn-gold" onClick={addTemplate} disabled={loading}>
          {loading ? '...' : 'إضافة'}
        </button>
      </div>

      {templates.length === 0 ? (
        <p style={{ color: 'var(--slate)', fontSize: '13px' }}>لا توجد قوالب بعد. أضف القالب الأول أعلاه.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--gold-light)' }}>
              <th style={{ padding: '10px 8px', color: 'var(--slate)', fontWeight: 'normal' }}>الاسم</th>
              <th style={{ padding: '10px 8px', color: 'var(--slate)', fontWeight: 'normal' }}>الحالة</th>
              <th style={{ padding: '10px 8px', color: 'var(--slate)', fontWeight: 'normal' }}>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--paper)' }}>
                <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{t.label}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span
                    onClick={() => toggleActive(t)}
                    style={{
                      cursor: 'pointer', padding: '3px 10px', borderRadius: 12, fontSize: '12px',
                      background: t.is_active ? '#d4edda' : '#f8d7da',
                      color: t.is_active ? '#155724' : '#721c24'
                    }}
                  >
                    {t.is_active ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button className="btn btn-ghost sm" title="تعديل" onClick={() => { setEditModal(t); setEditLabel(t.label); setEditFile(null); }} style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-dark)' }}>
                      <PencilSimple size={14} />
                    </button>
                    <button className="btn btn-ghost sm" title="حذف" onClick={() => removeTemplate(t.id)} style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                      <Trash size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal" style={{ maxWidth: 450 }}>
            <div className="modal-head">
              <h3>تعديل القالب</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setEditModal(null)}><span style={{fontSize:18}}>×</span></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>اسم المستند</label>
                <input value={editLabel} onChange={e => setEditLabel(e.target.value)} style={{ width:'100%', padding:'8px 12px', border:'1px solid var(--line)', borderRadius:6 }} />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>الملف (اختياري)</label>
                {editModal.file_path && (
                  <div style={{ fontSize:12, color:'var(--success)', marginBottom:6 }}>
                    ✓ الملف الحالي: <a href={`${API_BASE}${editModal.file_path}`} target="_blank" rel="noreferrer" style={{color:'var(--gold-dark)'}}>عرض</a>
                  </div>
                )}
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={e => setEditFile(e.target.files?.[0] || null)} style={{ width:'100%', padding:'6px', border:'1px solid var(--line)', borderRadius:6, fontSize:12 }} />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setEditModal(null)}>إلغاء</button>
              <button className="btn btn-gold" onClick={saveEdit}>حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
