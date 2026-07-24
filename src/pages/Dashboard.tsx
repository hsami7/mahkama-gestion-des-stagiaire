import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, WarningCircle, Archive, Plus, Eye, Certificate, Bell, Clock, X, UserCirclePlus, ChartBar, Buildings, BookOpen } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { AttestationModal } from '../components/AttestationModal';

function formatDate(d: string | undefined | null): string {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch { return d || '—'; }
}

function formatSubmittedAt(iso: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ar-MA', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

// Mini bar chart using pure CSS/SVG
function CapacityChart({ interns }: { interns: any[] }) {
  const byDept: Record<string, number> = {};
  for (const i of interns) {
    const dept = i.department || 'غير محدد';
    byDept[dept] = (byDept[dept] || 0) + 1;
  }
  const entries = Object.entries(byDept).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...entries.map(e => e[1]), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
      {entries.length === 0 ? (
        <div style={{ color: 'var(--slate)', fontSize: '0.85rem', textAlign: 'center', padding: 16 }}>
          لا توجد بيانات كافية للعرض
        </div>
      ) : (
        entries.map(([dept, count]) => (
          <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 120, fontSize: '0.78rem', color: 'var(--slate)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={dept}>
              {dept}
            </div>
            <div style={{ flex: 1, background: 'var(--line)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(count / max) * 100}%`,
                background: count / max > 0.7 ? 'var(--danger)' : count / max > 0.4 ? '#F59E0B' : 'var(--success)',
                borderRadius: 4,
                transition: 'width 0.6s ease'
              }} />
            </div>
            <div style={{ width: 24, fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink)', textAlign: 'center' }}>{count}</div>
          </div>
        ))
      )}
    </div>
  );
}

// Submission detail drawer
function SubmissionDrawer({ sub, onClose, onApprove, onReject, isAdmin }: {
  sub: any, onClose: () => void,
  onApprove: (id: number) => void,
  onReject: (id: number, reason: string) => void,
  isAdmin?: boolean
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const entries = Object.entries(sub.submitted_data || {});

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.15s'
    }} onClick={onClose}>
      <div style={{
        width: 420, background: 'var(--card)', height: '100%', overflowY: 'auto',
        padding: '28px 24px', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column', gap: 20
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>تفاصيل الطلب #{sub.id}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ background: 'var(--paper)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate)', marginBottom: 4 }}>النموذج</div>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{sub.form_title || '—'}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate)', marginTop: 6 }}>
            تاريخ التقديم: {formatSubmittedAt(sub.submitted_at)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.88rem', borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
            البيانات المُدخلة
          </div>
          {entries.length === 0 ? (
            <div style={{ color: 'var(--slate)', fontSize: '0.85rem' }}>لا توجد بيانات</div>
          ) : (
            entries.map(([key, val]: [string, any]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate)', fontWeight: 600 }}>{key}</div>
                {typeof val === 'string' && val.startsWith('/api/uploads/') ? (
                  <a href={val} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--gold-dark)', textDecoration: 'underline' }}>
                    عرض الملف
                  </a>
                ) : (
                  <div style={{ fontSize: '0.9rem', color: 'var(--ink)', background: 'var(--paper)', padding: '6px 10px', borderRadius: 6 }}>
                    {String(val) || '—'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {isAdmin && (
          !rejecting ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <button className="btn btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onApprove(sub.id)}>
                <CheckCircle size={16} weight="fill" /> قبول وإنشاء ملف
              </button>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', color: 'var(--danger)' }} onClick={() => setRejecting(true)}>
                <X size={16} /> رفض
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>سبب الرفض (اختياري)</label>
              <textarea
                className="input"
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="اكتب سبب الرفض ليُرسل عبر البريد الإلكتروني..."
                style={{ resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ color: 'var(--danger)', flex: 1, justifyContent: 'center' }} onClick={() => onReject(sub.id, reason)}>
                  <X size={16} /> تأكيد الرفض
                </button>
                <button className="btn btn-ghost sm" onClick={() => setRejecting(false)}>إلغاء</button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'Admin';

  const [interns, setInterns] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [documentQueue, setDocumentQueue] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [attestationIntern, setAttestationIntern] = useState<any>(null);

  const [syncing, setSyncing] = useState(false);

  const loadInterns = async () => {
    try { setInterns(await api.get('/interns')); } catch (e) { console.error(e); }
  };

  const loadSubmissions = async () => {
    try { setSubmissions(await api.get('/submissions?status=pending')); } catch (e) { console.error(e); }
  };

  const loadDocumentQueue = async () => {
    try { setDocumentQueue(await api.getDocumentQueue()); } catch (e) { console.error(e); }
  };

  const syncGoogleFormsQuietly = async () => {
    try {
      const res = await api.post('/forms/sync-google', {});
      if (res.added > 0) {
        toast.success(`تم جلب ${res.added} طلب جديد من نموذج جوجل تلقائياً`);
        loadSubmissions();
      }
    } catch (e) {
      // Quietly fail for automatic background syncs
    }
  };

  useEffect(() => {
    loadInterns();
    loadSubmissions();
    loadDocumentQueue();

    // Auto-sync Google Forms every 2 minutes
    const intervalId = setInterval(() => {
      syncGoogleFormsQuietly();
    }, 120000);

    return () => clearInterval(intervalId);
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const res = await api.post(`/submissions/${id}/approve`, {});
      toast.success('تمت الموافقة على الطلب وإنشاء الملف الشخصي!');
      setSelectedSub(null);
      loadSubmissions();
      loadInterns();
      if (res.intern_id) navigate(`/interns/${res.intern_id}`);
    } catch (e) {
      toast.error('حدث خطأ أثناء الموافقة');
    }
  };

  // Old handleReject removed, handled below

  const handleSyncGoogle = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/forms/sync-google', {});
      if (res.added > 0) {
        toast.success(`تم جلب ${res.added} طلب جديد من نموذج جوجل`);
        loadSubmissions();
      } else {
        toast.info('لا توجد طلبات جديدة من جوجل');
      }
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ أثناء الاتصال بجوجل، تأكد من الإعدادات');
    } finally {
      setSyncing(false);
    }
  };

  const [syncingMs, setSyncingMs] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);

  const handleSyncMicrosoft = async () => {
    setSyncingMs(true);
    try {
      const res = await api.post('/forms/sync-microsoft', {});
      if (res.added > 0) {
        toast.success(`تم جلب ${res.added} طلب جديد من مايكروسوفت`);
        loadSubmissions();
      } else {
        toast.info('لا توجد طلبات جديدة من مايكروسوفت');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.msg || 'حدث خطأ أثناء الاتصال بمايكروسوفت، تأكد من الرابط في الإعدادات');
    } finally {
      setSyncingMs(false);
    }
  };

  const handleApproveDoc = async (internId: number, docId: number) => {
    try {
      await api.approveDocument(internId, docId);
      toast.success('تم قبول المستند بنجاح');
      loadDocumentQueue();
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ أثناء القبول');
    }
  };

  const handleRejectDoc = async (internId: number, docId: number) => {
    const reason = window.prompt('سبب الرفض (إلزامي لإشعار المتدرب):');
    if (reason !== null && reason.trim() !== '') {
      try {
        await api.rejectDocument(internId, docId, reason);
        toast.success('تم رفض المستند وإرسال إشعار للمتدرب');
        loadDocumentQueue();
      } catch (e: any) {
        toast.error(e.message || 'حدث خطأ أثناء الرفض');
      }
    } else if (reason !== null) {
      toast.warning('يجب كتابة سبب الرفض');
    }
  };

  // --- UNIFIED PENDING TABLE LOGIC ---
  const pendingInterns = interns.filter(i => i.status === 'قيد المراجعة');
  const unifiedPending = pendingInterns.map(i => ({
    id: i.id,
    type: 'intern',
    name: i.name,
    email: i.email,
    date: i.start_date || '',
    source: i.source || 'إضافة يدوية',
    raw: i
  }));

  const handleApproveUnified = async (item: any) => {
    try {
      if (item.type === 'submission') {
        await api.post(`/submissions/${item.id}/approve`, {});
        toast.success('تمت الموافقة وإنشاء ملف المتدرب');
      } else {
        await api.put(`/interns/${item.id}`, { status: 'نشط' });
        toast.success('تم تنشيط ملف المتدرب');
      }
      loadInterns();
      loadSubmissions();
    } catch (e) {
      toast.error('حدث خطأ أثناء القبول');
    }
  };

  const handleRejectUnifiedSubmit = async (item: any, reason: string) => {
    try {
      if (item.type === 'submission') {
        await api.post(`/submissions/${item.id}/reject`, { reason });
      } else {
        await api.put(`/interns/${item.id}`, { status: 'مرفوض' });
      }
      toast.success('تم رفض الطلب');
      setSelectedSub(null); 
      loadInterns();
      loadSubmissions();
    } catch (e) {
      toast.error('حدث خطأ أثناء الرفض');
    }
  };
  // -----------------------------------

  const pendingCount = pendingInterns.length;
  const missingCount = interns.filter(i => i.status === 'مستندات ناقصة').length;
  const activeCount = interns.filter(i => i.status === 'نشط').length;
  const totalCount = interns.length;

  const recentInterns = [...interns].reverse().slice(0, 5);

  const upcomingEnds = interns
    .filter(i => i.status === 'نشط')
    .filter(i => {
      if (!i.end_date) return false;
      const end = new Date(i.end_date + 'T00:00:00');
      if (isNaN(end.getTime())) return false;
      const now = new Date();
      return end.getMonth() === now.getMonth() && end.getFullYear() === now.getFullYear();
    })
    .sort((a, b) => new Date(a.end_date + 'T00:00:00').getTime() - new Date(b.end_date + 'T00:00:00').getTime())
    .slice(0, 5);

  // Decision helpers
  const activeByDept: Record<string, number> = {};
  for (const i of interns.filter(x => x.status === 'نشط')) {
    const d = i.department || 'غير محدد';
    activeByDept[d] = (activeByDept[d] || 0) + 1;
  }
  const leastLoadedDept = Object.entries(activeByDept).sort((a, b) => a[1] - b[1])[0];
  const endingThisMonthCount = upcomingEnds.length;
  const availableSlotsHint = endingThisMonthCount > 0
    ? `${endingThisMonthCount} متدرب${endingThisMonthCount > 1 ? 'ون' : ''} ينتهون هذا الشهر — يمكن استيعاب طلبات جديدة`
    : null;

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

      {/* ─── PENDING FORM SUBMISSIONS ─── */}
      {(submissions.length > 0 || true) && (
        <div className="card" style={{ padding: '24px', marginBottom: 20, borderTop: '3px solid var(--gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: submissions.length > 0 ? 'var(--warning-bg)' : 'var(--paper)', color: submissions.length > 0 ? 'var(--warning)' : 'var(--slate)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCirclePlus size={20} weight="fill" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>طلبات التسجيل المعلقة</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>نماذج جوجل والطلبات اليدوية قيد المراجعة</div>
              </div>
              {unifiedPending.length > 0 && (
                <span style={{ background: 'var(--warning)', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                  {unifiedPending.length}
                </span>
              )}
              <div style={{ display: 'flex', gap: '8px', marginRight: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setShowCoverage(true)} 
                  className="btn btn-ghost sm" 
                  style={{ fontSize: '0.8rem', border: '1px solid var(--line)' }}
                >
                  <ChartBar size={14} style={{ marginLeft: 4 }} />
                  مخطط التغطية
                </button>
                <button 
                  onClick={handleSyncGoogle} 
                  disabled={syncing}
                  className="btn btn-ghost sm" 
                  style={{ fontSize: '0.8rem' }}
                >
                  {syncing ? 'جاري الجلب...' : 'مزامنة جوجل'}
                </button>
                <button 
                  onClick={handleSyncMicrosoft} 
                  disabled={syncingMs}
                  className="btn btn-ghost sm" 
                  style={{ fontSize: '0.8rem' }}
                >
                  {syncingMs ? 'جاري الجلب...' : 'مزامنة مايكروسوفت'}
                </button>
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Submissions table */}
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>مقدم الطلب</th>
                    <th>المصدر</th>
                    <th>التاريخ</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {unifiedPending.map(item => (
                    <tr key={`${item.type}-${item.id}`}>
                      <td>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.9rem' }}>{item.name}</div>
                            {item.email && <div style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>{item.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>
                        <span style={{ background: item.type === 'submission' ? '#F0FDF4' : '#EFF6FF', color: item.type === 'submission' ? '#166534' : '#1E40AF', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem' }}>
                          {item.source}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--slate)', whiteSpace: 'nowrap' }}>{formatSubmittedAt(item.date)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost sm" onClick={() => {
                            if (item.type === 'submission') setSelectedSub(item.raw);
                            // For interns, open the edit profile modal
                            navigate('/interns/' + item.id);
                          }}>
                            <Eye size={14} /> عرض
                          </button>
                          {isAdmin && (
                            <>
                              <button className="btn btn-gold sm" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => handleApproveUnified(item)}>
                                <CheckCircle size={14} weight="fill" /> قبول
                              </button>
                              <button className="btn btn-ghost sm" style={{ color: 'var(--danger)' }} onClick={() => {
                                if (item.type === 'submission') {
                                  setSelectedSub(item.raw); // The modal will call handleRejectUnifiedSubmit
                                } else {
                                  const reason = window.prompt('سبب الرفض (اختياري):');
                                  if (reason !== null) {
                                    handleRejectUnifiedSubmit(item, reason);
                                  }
                                }
                              }}>
                                <X size={14} /> رفض
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {unifiedPending.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--slate)', padding: '28px 0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <CheckCircle size={32} weight="thin" color="var(--success)" />
                          <span>لا توجد طلبات معلقة — كل شيء محدّث</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── DOCUMENT QUEUE (Admin View) ─── */}
      {isAdmin && documentQueue.length > 0 && (
        <div className="card" style={{ padding: '24px', marginBottom: 20, borderTop: '3px solid #3B82F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: '#EFF6FF', color: '#3B82F6', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} weight="fill" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>طابور المستندات</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>مستندات بانتظار المراجعة أو معادة للتصحيح</div>
              </div>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>المتدرب</th>
                  <th>المستند</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {documentQueue.map((doc: any) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{doc.intern_name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem' }}>
                        {doc.custom_title || doc.document_type}
                      </div>
                    </td>
                    <td>
                      {doc.status === 'PENDING_REVIEW' && <span className="badge warn"><div className="dot"></div>بانتظار المراجعة</span>}
                      {doc.status === 'REVISION_REQUESTED' && <span className="badge bad"><div className="dot"></div>مرفوض — يتطلب تصحيحًا</span>}
                      {doc.status === 'APPROVED_AND_SIGNED' && <span className="badge ok"><div className="dot"></div>مكتمل</span>}
                      {doc.status === 'MISSING' && <span className="badge" style={{background: 'var(--paper)', color: 'var(--slate)'}}><div className="dot"></div>مفقود</span>}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>
                      {formatSubmittedAt(doc.uploaded_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {doc.file_path && (
                          <a href={doc.file_path} target="_blank" rel="noreferrer" className="btn btn-ghost sm">
                            <Eye size={14} /> عرض
                          </a>
                        )}
                        {doc.status === 'PENDING_REVIEW' && (
                          <>
                            <button className="btn btn-gold sm" onClick={() => handleApproveDoc(doc.intern_id, doc.id)}>
                              <CheckCircle size={14} /> قبول
                            </button>
                            <button className="btn btn-ghost sm" style={{ color: 'var(--danger)' }} onClick={() => handleRejectDoc(doc.intern_id, doc.id)}>
                              <X size={14} /> رفض
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Interns Table */}
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
                      <span style={{ color: 'var(--success)' }}>{formatDate(intern.start_date)}</span> 
                      <span style={{ color: 'var(--slate)', margin: '0 4px' }}>إلى</span> 
                      <span style={{ color: 'var(--danger)' }}>{formatDate(intern.end_date)}</span>
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

      {/* Upcoming End Dates Widget */}
      <div className="card" style={{ padding: '24px', marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={20} weight="bold" color="var(--gold-dark)" />
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>متدربون تنتهي فترة تدريبهم هذا الشهر</h2>
          </div>
        </div>

        <div style={{ position: 'relative', overflow: 'visible' }}>
          <table>
            <thead>
              <tr>
                <th>المتدرب</th>
                <th>تاريخ الانتهاء</th>
                <th>الأيام المتبقية</th>
                <th>التقرير النهائي</th>
                <th>إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody>
              {upcomingEnds.map(intern => {
                const end = new Date(intern.end_date + 'T00:00:00');
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
                const urgent = daysLeft <= 5;
                return (
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
                      <span style={{
                        fontWeight: 700, fontSize: '0.9rem',
                        color: urgent ? (daysLeft <= 0 ? 'var(--danger)' : '#D97706') : 'var(--ink)',
                        background: urgent ? (daysLeft <= 0 ? '#FCE8E6' : '#FEF3C7') : 'transparent',
                        padding: urgent ? '2px 8px' : 0, borderRadius: 6
                      }}>
                        {formatDate(intern.end_date)}
                      </span>
                    </td>
                    <td>
                      {daysLeft <= 0 ? (
                        <span style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.85rem' }}>اليوم</span>
                      ) : (
                        <span style={{ fontWeight: 600, color: urgent ? '#D97706' : 'var(--slate)', fontSize: '0.85rem' }}>
                          باقي {daysLeft} {daysLeft === 1 ? 'يوم' : 'أيام'}
                        </span>
                      )}
                    </td>
                    <td>
                      {intern.has_final_report ? (
                        <span className="badge ok"><div className="dot"></div>مرفوع</span>
                      ) : (
                        <span className="badge warn"><div className="dot"></div>غير مرفوع</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost sm" style={{ fontSize: 11 }} onClick={() => setAttestationIntern(intern)}>
                          <Certificate size={14} /> شهادة
                        </button>
                        {!intern.has_final_report && (
                          <button className="btn btn-ghost sm" style={{ fontSize: 11 }} onClick={() => { toast.success('تم إرسال تذكير للمتدرب'); }}>
                            <Bell size={14} /> تذكير
                          </button>
                        )}
                        <button className="btn btn-ghost sm" style={{ fontSize: 11 }} onClick={() => navigate(`/interns/${intern.id}`)}>
                          <Eye size={14} /> عرض
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {upcomingEnds.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--slate)', padding: '20px' }}>
                    لا يوجد متدربون ينتهون هذا الشهر
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {attestationIntern && (
        <AttestationModal
          isOpen={true}
          intern={attestationIntern}
          onClose={() => setAttestationIntern(null)}
        />
      )}

      {selectedSub && (
        <SubmissionDrawer
          sub={selectedSub}
          onClose={() => setSelectedSub(null)}
          onApprove={handleApprove}
          onReject={(id, reason) => {
            const item = unifiedPending.find(i => i.type === 'submission' && i.id === id);
            if (item) handleRejectUnifiedSubmit(item, reason);
          }}
          isAdmin={isAdmin}
        />
      )}
      {/* Coverage Modal */}
      {showCoverage && (
        <div className="modal-overlay" onClick={() => setShowCoverage(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ChartBar size={20} weight="fill" color="var(--gold-dark)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>مخطط تغطية المتدربين</h3>
              </div>
              <button className="btn btn-ghost" onClick={() => setShowCoverage(false)} style={{ padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--slate)', marginBottom: 20 }}>
              عدد المتدربين النشطين لكل قسم. يساعدك هذا المخطط في تحديد الأقسام التي تحتاج متدربين.
            </div>
            
            <CapacityChart interns={interns.filter(i => i.status === 'نشط')} />
            
            <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--paper)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--slate)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--success)' }} />
                طاقة منخفضة
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: '#F59E0B' }} />
                طاقة متوسطة
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--danger)' }} />
                مكتظ
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setShowCoverage(false)}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
