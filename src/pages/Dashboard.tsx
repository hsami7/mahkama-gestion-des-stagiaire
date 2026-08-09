import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, WarningCircle, Plus, Eye, X, UserCirclePlus, ChartBar, Users } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import Avatar from '../components/Avatar';

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
    if (isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch { return iso; }
}

// Structured, profile-like rendering for synced submissions.
const SUB_FIELD_LABELS: Record<string, string> = {
  name: 'الإسم الكامل (بالعربية)',
  name_fr: 'الإسم الكامل (بالفرنسة)',
  email: 'البريد الإلكتروني',
  national_id: 'رقم البطاقة الوطنية',
  date_of_birth: 'تاريخ الميلاد',
  phone: 'رقم الهاتف',
  university: 'الجامعة / المؤسسة',
  specialty: 'التخصص',
  start_date: 'تاريخ بدء التدريب',
  end_date: 'تاريخ إنتهاء التدريب',
  address: 'العنوان',
  department: 'القسم / الدائرة',
};

const SUB_FIELD_ORDER = ['name', 'name_fr', 'email', 'national_id', 'date_of_birth', 'phone', 'university', 'specialty', 'start_date', 'end_date', 'address', 'department'];

function subNormalizeKey(k: string) {
  return String(k).toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/[()\s،_-]/g, '');
}

function buildSubmissionEntries(data: Record<string, any>): { label: string; value: any }[] {
  const normKeys: Record<string, { label: string; value: any }> = {};
  for (const [k, v] of Object.entries(data || {})) {
    if (k === '_source') continue;
    normKeys[subNormalizeKey(k)] = { label: k, value: v };
  }
  const entries: { label: string; value: any }[] = [];
  const used = new Set<string>();
  for (const field of SUB_FIELD_ORDER) {
    const match = normKeys[subNormalizeKey(field)];
    if (match) {
      entries.push({ label: SUB_FIELD_LABELS[field], value: match.value });
      used.add(subNormalizeKey(field));
    }
  }
  for (const [nk, entry] of Object.entries(normKeys)) {
    if (!used.has(nk)) entries.push(entry);
  }
  return entries;
}

function SubmissionDrawer({ sub, onClose, onApprove, onReject, isAdmin }: {
  sub: any, onClose: () => void,
  onApprove: (id: number) => void,
  onReject: (id: number, reason: string) => void,
  isAdmin?: boolean
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const entries = buildSubmissionEntries(sub.submitted_data || {});
  const applicantName = (() => {
    const d = sub.submitted_data || {};
    if (d.name) return d.name;
    if (d.Name) return d.Name;
    for (const [k, v] of Object.entries(d)) {
      const kl = subNormalizeKey(k);
      if (kl.includes('اسم') || kl.includes('name')) return String(v || '');
    }
    return sub.form_title || 'متدرب جديد';
  })();

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

        <div style={{ background: 'var(--gold)', borderRadius: 12, padding: '16px 18px', color: '#fff' }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{applicantName}</div>
          {entries.find(e => e.label === 'البريد الإلكتروني')?.value && (
            <div style={{ fontSize: '0.8rem', opacity: 0.9, direction: 'ltr', textAlign: 'right' }}>
              {entries.find(e => e.label === 'البريد الإلكتروني')?.value}
            </div>
          )}
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
            entries.map((entry, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate)', fontWeight: 600 }}>{entry.label}</div>
                {typeof entry.value === 'string' && entry.value.startsWith('/api/uploads/') ? (
                  <a href={entry.value} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--gold-dark)', textDecoration: 'underline' }}>
                    عرض الملف
                  </a>
                ) : (
                  <div style={{ fontSize: '0.9rem', color: 'var(--ink)', background: 'var(--paper)', padding: '6px 10px', borderRadius: 6 }}>
                    {String(entry.value) || '—'}
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

export function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const userStr = localStorage.getItem('user') || localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'Admin';

  const [interns, setInterns] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [photoError, setPhotoError] = useState<Record<number, boolean>>({});
  const [showCoverage, setShowCoverage] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState<{ src: string; name: string } | null>(null);

  const loadInterns = async () => {
    try { setInterns(await api.get('/interns')); } catch (e) { console.error(e); }
  };

  const loadSubmissions = async () => {
    try {
      const raw = await api.get('/submissions?status=pending');
      const parsed = raw.map((r: any) => {
        if (typeof r.submitted_data === 'string') {
          try { r.submitted_data = JSON.parse(r.submitted_data); } catch (e) { r.submitted_data = {}; }
        }
        return r;
      });
      setSubmissions(parsed);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadInterns();
    loadSubmissions();
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

  const pendingCount = pendingInterns.length;
  const missingCount = interns.filter(i => i.has_missing_documents).length;
  const activeCount = interns.filter(i => i.status === 'نشط').length;

  const getApplicantName = (sub: any) => {
    if (!sub || !sub.submitted_data) return sub?.form_title || 'متدرب جديد';
    const d = sub.submitted_data;
    if (d.name) return d.name;
    if (d.Name) return d.Name;
    
    for (const key of Object.keys(d)) {
      if (key === '_source') continue;
      const kl = String(key).toLowerCase().replace(/أ|إ|آ/g, 'ا').replace(/ة/g, 'ه');
      if (kl.includes('اسم') || kl.includes('name')) {
        return d[key];
      }
    }
    return sub?.form_title || 'متدرب جديد';
  };

  const recentInterns = [...interns].reverse().slice(0, 5);

  return (
    <div>
      <div className="section-head">
        <div>
          <h2 style={{ marginTop: 0 }}>لوحة التحكم</h2>
          <p>نظرة عامة على حالة المتدربين اليوم</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-gold" onClick={() => navigate('/interns')}>
            <Plus weight="bold" size={19} color="#000" /> متدرب جديد
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card" onClick={() => navigate('/interns')} style={{ cursor: 'pointer' }}>
          <div className="top">
            <div className="ic" style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
              <Users size={20} weight="fill" />
            </div>
          </div>
          <div className="num">{interns.length}</div>
          <div className="lbl">إجمالي المتدربين</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/interns')} style={{ cursor: 'pointer' }}>
          <div className="top">
            <div className="ic" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <WarningCircle size={20} weight="fill" />
            </div>
            {pendingCount > 0 && <div className="trend" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>عاجل</div>}
          </div>
          <div className="num">{pendingCount}</div>
          <div className="lbl">قيد المراجعة</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/interns')} style={{ cursor: 'pointer' }}>
          <div className="top">
            <div className="ic" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <FileText size={20} weight="fill" />
            </div>
          </div>
          <div className="num">{missingCount}</div>
          <div className="lbl">مستندات ناقصة</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/interns')} style={{ cursor: 'pointer' }}>
          <div className="top">
            <div className="ic" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
              <CheckCircle size={20} weight="fill" />
            </div>
          </div>
          <div className="num">{activeCount}</div>
          <div className="lbl">متدربون نشطون</div>
        </div>
      </div>

      {(submissions.length > 0 || pendingCount > 0) ? (
        <div className="card" style={{ padding: '24px', marginBottom: 20, borderTop: '3px solid var(--gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ background: (submissions.length + pendingCount) > 0 ? 'var(--warning-bg)' : 'var(--paper)', color: (submissions.length + pendingCount) > 0 ? 'var(--warning)' : 'var(--slate)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCirclePlus size={20} weight="fill" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>طلبات التسجيل المعلقة</h2>
            {(submissions.length + pendingCount) > 0 && (
              <span style={{ background: 'var(--warning)', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                {submissions.length + pendingCount}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                  {submissions.map((sub: any) => (
                    <tr key={`sub-${sub.id}`}>
                      <td>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                            {getApplicantName(sub).charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.9rem' }}>{getApplicantName(sub)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>
                        <span style={{ background: '#F0FDF4', color: '#166534', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem' }}>
                          {sub.source || 'نموذج جوجل'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--slate)', whiteSpace: 'nowrap' }}>{formatSubmittedAt(sub.submitted_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost sm" onClick={() => setSelectedSub(sub)}>
                            <Eye size={14} /> عرض
                          </button>
                          <button className="btn btn-ghost sm" onClick={() => navigate(`/timeline?selected=${sub.id}`)} title="مخطط تغطية المتدربين" style={{ fontSize: '0.7rem', padding: '4px 6px', color: 'var(--gold-dark)' }}>
                            <ChartBar size={14} /> تغطية
                          </button>
                          {isAdmin && (
                            <>
                              <button className="btn btn-gold sm" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => handleApproveUnified({ id: sub.id, type: 'submission' })}>
                                <CheckCircle size={14} weight="fill" /> قبول
                              </button>
                              <button className="btn btn-ghost sm" style={{ color: 'var(--danger)' }} onClick={() => setSelectedSub(sub)}>
                                <X size={14} /> رفض
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingInterns.map(intern => {
                    const showImg = intern.photo_path && !photoError[intern.id];
                    return (
                    <tr key={`intern-${intern.id}`}>
                      <td>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          {showImg ? (
                            <img
                              src={intern.photo_path}
                              alt=""
                              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }}
                              onClick={() => setZoomPhoto({ src: intern.photo_path, name: intern.name })}
                              onError={() => setPhotoError(p => ({...p, [intern.id]: true}))}
                            />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                              {intern.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.9rem' }}>{intern.name}</div>
                            {intern.email && <div style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>{intern.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>
                        <span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem' }}>
                          {intern.source || 'إضافة يدوية'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--slate)', whiteSpace: 'nowrap' }}>{formatSubmittedAt(intern.start_date)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost sm" onClick={() => navigate(`/interns/${intern.id}`)}>
                            <Eye size={14} /> عرض
                          </button>
                          <button className="btn btn-ghost sm" onClick={() => navigate(`/timeline?selected=${intern.id}`)} title="مخطط تغطية المتدربين" style={{ fontSize: '0.7rem', padding: '4px 6px', color: 'var(--gold-dark)' }}>
                            <ChartBar size={14} /> تغطية
                          </button>
                          {isAdmin && (
                            <>
                              <button className="btn btn-gold sm" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => handleApproveUnified({ id: intern.id, type: 'intern' })}>
                                <CheckCircle size={14} weight="fill" /> قبول
                              </button>
                              <button className="btn btn-ghost sm" style={{ color: 'var(--danger)' }} onClick={() => { const reason = window.prompt('سبب الرفض (اختياري):'); if (reason !== null) handleRejectUnifiedSubmit({ id: intern.id, type: 'intern' }, reason); }}>
                                <X size={14} /> رفض
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    );})}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '24px', marginBottom: 20, borderTop: '3px solid var(--gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ background: 'var(--paper)', color: 'var(--slate)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCirclePlus size={20} weight="fill" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>طلبات التسجيل المعلقة</h2>
          </div>
          <div style={{ textAlign: 'center', color: 'var(--slate)', padding: '28px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={32} weight="thin" color="var(--success)" />
              <span>لا توجد طلبات معلقة — كل شيء محدّث</span>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>أحدث المتدربين</h2>
          <button className="btn btn-ghost sm" onClick={() => navigate('/interns')} style={{ fontSize: '0.8rem' }}>
            عرض الكل →
          </button>
        </div>
        
        <div style={{ position: 'relative', overflow: 'visible' }}>
          <table>
            <thead>
              <tr>
                <th>المتدرب</th>
                <th>الحالة</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {recentInterns.map(intern => (
                <tr key={intern.id}>
                  <td>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div onClick={() => intern.photo_path && setZoomPhoto({ src: intern.photo_path, name: intern.name })} style={{ cursor: intern.photo_path ? 'pointer' : 'default' }}>
                        <Avatar src={intern.photo_path} name={intern.name} size={32} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--ink)', fontSize: '0.9rem' }}>{intern.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>{intern.email || 'لا يوجد بريد'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select value={intern.status} onChange={async e => {
                      const newStatus = e.target.value;
                      try {
                        await api.put(`/interns/${intern.id}`, { status: newStatus });
                        setInterns(prev => prev.map(i => i.id === intern.id ? {...i, status: newStatus} : i));
                      } catch { alert('فشل تغيير الحالة'); }
                    }} style={{
                      fontSize: 11, padding: '4px 8px', borderRadius: 6,
                      border: '1px solid var(--line)',
                      fontWeight: 600, cursor: 'pointer', outline: 'none',
                      color: intern.status === 'نشط' ? 'var(--ok)' :
                             intern.status === 'مستندات ناقصة' ? 'var(--bad)' :
                             intern.status === 'قيد المراجعة' ? '#B45A0C' :
                             intern.status === 'مرفوض' ? '#B3261E' :
                             'var(--slate)',
                      borderColor: intern.status === 'نشط' ? 'var(--ok)' :
                                   intern.status === 'مستندات ناقصة' ? '#F5C6C3' :
                                   intern.status === 'قيد المراجعة' ? '#F2D49B' :
                                   intern.status === 'مرفوض' ? '#F5C6C3' :
                                   'var(--line)',
                      background: intern.status === 'مرفوض' ? '#FCE8E6' :
                                  intern.status === 'مستندات ناقصة' ? '#FCE8E6' :
                                  intern.status === 'قيد المراجعة' ? '#FFF6E5' :
                                  intern.status === 'نشط' ? '#E6F7E6' :
                                  'var(--paper)',
                    }}>
                      <option value="قيد المراجعة">قيد المراجعة</option>
                      <option value="نشط">نشط</option>
                      <option value="مستندات ناقصة">مستندات ناقصة</option>
                      <option value="مرفوض">مرفوض</option>
                      <option value="منتهي">منتهي</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-ghost sm" onClick={() => navigate(`/interns/${intern.id}`)}>
                      <Eye size={14} /> عرض
                    </button>
                  </td>
                </tr>
              ))}
              {recentInterns.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--slate)', padding: '20px' }}>
                    لا يوجد متدربين حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      {zoomPhoto && (
        <div className="overlay on" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }} onClick={() => setZoomPhoto(null)}>
          <div style={{ position: 'relative', background: '#fff', padding: '8px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setZoomPhoto(null)} style={{ position: 'absolute', top: '-14px', left: '-14px', background: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} weight="bold" />
            </button>
            <img src={zoomPhoto.src} alt="Zoom" style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(90vh - 16px)', borderRadius: '16px', objectFit: 'contain' }} />
          </div>
        </div>
      )}

    </div>
  );
}
