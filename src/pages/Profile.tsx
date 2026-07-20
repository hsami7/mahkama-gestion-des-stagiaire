import React, { useState, useEffect } from 'react';
import { ArrowRight, PencilSimple, Trash, FileText, CheckCircle, WarningCircle, DownloadSimple, Certificate, CalendarCheck, MicrosoftExcelLogo, FilePdf, User, IdentificationCard, Phone, Envelope, MapPin, GraduationCap, Briefcase, Calendar, Clock, Star, ChatText, Note, PaperPlaneTilt, X } from '@phosphor-icons/react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, API_BASE } from '../services/api';
import { useToast } from '../components/Toast';
import { Messaging } from '../components/Messaging';

const EVAL_CRITERIA = [
  { key: 'discipline', label: 'الانضباط والالتزام بالمواعيد' },
  { key: 'skills', label: 'المهارات والكفاءة المهنية' },
  { key: 'teamwork', label: 'العمل الجماعي والتواصل' },
  { key: 'initiative', label: 'المبادرة والاجتهاد' },
  { key: 'quality', label: 'جودة العمل المنجز' },
];
const EVAL_MAX_PER = 4;
const EVAL_TOTAL_MAX = EVAL_CRITERIA.length * EVAL_MAX_PER;

const NF = new Intl.NumberFormat('en-US');
const num = (n: number | string) => (typeof n === 'number' ? NF.format(n) : n);

function toIso(value?: string): string {
  if (!value || value.trim() === '') return '';
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) { const [, d, mo, y] = m; return `${y}-${mo}-${d}`; }
  return '';
}
function fmtDate(value?: string): string {
  const iso = toIso(value);
  if (!iso) return '—';
  const dt = new Date(iso + 'T00:00:00');
  if (isNaN(dt.getTime())) return value || '—';
  return dt.toLocaleDateString('en-CA'); // YYYY-MM-DD Western
}
function parseD(value?: string): Date | null {
  const iso = toIso(value);
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}
function statusBadge(status?: string) {
  const s = status || 'قيد المراجعة';
  const map: Record<string, { bg: string; fg: string }> = {
    'نشط': { bg: '#E7F8EE', fg: '#15803D' },
    'قيد المراجعة': { bg: '#FEF3C7', fg: '#B45309' },
    'مستندات ناقصة': { bg: '#FEF3C7', fg: '#B45309' },
    'مرفوض': { bg: '#FCE8E6', fg: '#B91C1C' },
    'منتهي': { bg: '#EEF1F5', fg: '#64748B' },
  };
  const c = map[s] || map['قيد المراجعة'];
  return { s, ...c };
}
function durationText(start?: string, end?: string): string {
  const s = parseD(start), e = parseD(end);
  if (!s || !e) return '—';
  const days = Math.max(0, Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1);
  const months = Math.floor(days / 30);
  const rem = days % 30;
  let str = '';
  if (months > 0) str += `${num(months)} شهر `;
  if (rem > 0 || months === 0) str += `${num(rem)} يوم`;
  return str;
}
function progressInfo(start?: string, end?: string) {
  const s = parseD(start), e = parseD(end);
  if (!s || !e) return null;
  const total = Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1;
  if (total <= 0) return null;
  const now = new Date();
  let elapsed = Math.floor((now.getTime() - s.getTime()) / 86400000) + 1;
  elapsed = Math.max(0, Math.min(total, elapsed));
  const pct = Math.round((elapsed / total) * 100);
  return { elapsed: num(elapsed), total: num(total), pct };
}

export function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [intern, setIntern] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  const [editingEncadrant, setEditingEncadrant] = useState(false);
  const [encadrantInput, setEncadrantInput] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [requestDocType, setRequestDocType] = useState('other');
  const [requestFile, setRequestFile] = useState<File | null>(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveStartDate, setApproveStartDate] = useState('');
  const [approveEndDate, setApproveEndDate] = useState('');
  const [durationStr, setDurationStr] = useState('');

  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [evalComments, setEvalComments] = useState('');
  const [savingEval, setSavingEval] = useState(false);

  useEffect(() => {
    if (approveStartDate && approveEndDate) {
      const start = parseD(approveStartDate), end = parseD(approveEndDate);
      if (!start || !end) { setDurationStr(''); return; }
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
      if (end < start) setDurationStr('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      else setDurationStr(durationText(approveStartDate, approveEndDate));
    } else setDurationStr('');
  }, [approveStartDate, approveEndDate]);

  const openRequestModal = (docType: string, title: string) => {
    setRequestDocType(docType); setRequestTitle(title); setRequestNote(''); setRequestFile(null); setShowRequestModal(true);
  };

  const handleRequestDocument = async (docType: string, customTitle?: string) => {
    try {
      const formData = new FormData();
      formData.append('document_type', docType);
      formData.append('custom_title', customTitle || '');
      formData.append('note', requestNote || '');
      if (requestFile) formData.append('file', requestFile);
      await api.post(`/interns/${id}/requests`, formData);
      toast.success('تم إرسال الطلب بنجاح للمتدرب!');
      setShowRequestModal(false); setRequestTitle(''); setRequestNote(''); setRequestFile(null);
    } catch (err) { toast.error('حدث خطأ أثناء إرسال الطلب'); }
  };

  const fetchInternAndAttendance = async () => {
    try {
      const data = await api.get(`/interns/${id}`);
      setIntern(data);
      const attData = await api.get(`/interns/${id}/attendance`);
      setAttendance(attData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'Admin';
  let canAssignEncadrant = isAdmin, canApproveInterns = isAdmin, canEvaluateInterns = isAdmin;
  if (!isAdmin && user?.permissions) {
    try {
      const perms = JSON.parse(user.permissions);
      if (perms?.assign_encadrant?.edit) canAssignEncadrant = true;
      if (perms?.approve_interns?.edit) canApproveInterns = true;
      if (perms?.evaluate_interns?.edit) canEvaluateInterns = true;
    } catch (e) {}
  }

  const saveEncadrant = async () => {
    try {
      await api.put(`/interns/${id}`, { ...intern, encadrant: encadrantInput });
      setIntern({ ...intern, encadrant: encadrantInput });
      setEditingEncadrant(false);
    } catch (err) { toast.error('فشل في حفظ المؤطر'); }
  };

  useEffect(() => { if (id) fetchInternAndAttendance(); }, [id]);

  const markAttendance = async (status: string) => {
    const today = new Date().toISOString().split('T')[0];
    try { await api.post(`/interns/${id}/attendance`, { date: today, status }); fetchInternAndAttendance(); }
    catch (err) { toast.error('فشل في تسجيل الحضور'); }
  };

  if (loading) return <div style={{ padding: '24px', color: 'var(--slate)' }}>جاري التحميل...</div>;
  if (!intern) return <div style={{ padding: '24px', color: 'var(--slate)' }}>لم يتم العثور على المتدرب</div>;

  const docNames: Record<string, string> = {
    id: 'بطاقة التعريف الوطنية',
    convention: 'اتفاقية التدريب (Convention de stage)',
    demande: 'طلب التدريب (Demande de stage)',
    insurance: 'تأمين (Insurance)',
    resume: 'السيرة الذاتية (Resume)'
  };
  const handleDownload = (filename: string) => {
    if (!filename) return;
    const name = filename.replace(/^\/api\/uploads\//, '').replace(/^\//, '');
    window.open(`${API_BASE}/documents/${name}`, '_blank');
  };
  const handleEdit = () => navigate('/interns', { state: { editIntern: intern } });
  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا المتدرب؟')) {
      try { await api.delete(`/interns/${intern.id}`); navigate('/interns'); }
      catch (err) { console.error(err); toast.error('فشل الحذف'); }
    }
  };
  const handleApproveClick = () => {
    const missingDocs = Object.keys(docNames).filter(key => !intern.documents?.[key]);
    if (missingDocs.length > 0) { toast.warning('لا يمكن قبول المتدرب. يرجى التأكد من رفع جميع المستندات المطلوبة أولاً.'); return; }
    if (!intern.encadrant || intern.encadrant.trim() === '') { toast.warning('لا يمكن قبول المتدرب. يرجى تعيين المؤطر (المشرف) أولاً.'); return; }
    setApproveStartDate(toIso(intern.start_date) || new Date().toISOString().split('T')[0]);
    setApproveEndDate(toIso(intern.end_date));
    setShowApproveModal(true);
  };
  const confirmApprove = async () => {
    if (!approveStartDate || !approveEndDate) { toast.warning('يرجى تحديد تاريخ البداية والنهاية.'); return; }
    const end = parseD(approveEndDate), start = parseD(approveStartDate);
    if (!start || !end || end < start) { toast.warning('تاريخ النهاية يجب أن يكون بعد تاريخ البداية.'); return; }
    try {
      await api.put(`/interns/${id}`, { ...intern, status: 'نشط', start_date: approveStartDate, end_date: approveEndDate });
      setShowApproveModal(false); fetchInternAndAttendance(); toast.success('تم قبول المتدرب وتنشيط حسابه بنجاح!');
    } catch (err) { toast.error('فشل القبول'); }
  };
  const openEvalModal = () => {
    const existing = intern?.evaluation?.criteria || {};
    const scores: Record<string, number> = {};
    EVAL_CRITERIA.forEach(c => { scores[c.key] = existing[c.key] ?? 0; });
    setEvalScores(scores); setEvalComments(intern?.evaluation?.comments || ''); setShowEvalModal(true);
  };
  const evalTotal = EVAL_CRITERIA.reduce((sum, c) => sum + (evalScores[c.key] || 0), 0);
  const saveEvaluation = async () => {
    setSavingEval(true);
    try {
      const res = await api.post(`/interns/${id}/evaluation`, { criteria: evalScores, comments: evalComments, total: evalTotal, max: EVAL_TOTAL_MAX });
      setIntern({ ...intern, evaluation: res.evaluation }); setShowEvalModal(false); toast.success('تم حفظ تقييم المتدرب بنجاح!');
    } catch (err) { toast.error('فشل حفظ التقييم'); }
    finally { setSavingEval(false); }
  };
  const handleReject = async () => {
    if (window.confirm('هل أنت متأكد من رفض هذا المتدرب؟')) {
      try { await api.put(`/interns/${id}`, { ...intern, status: 'مرفوض' }); fetchInternAndAttendance(); }
      catch (err) { toast.error('فشل الرفض'); }
    }
  };

  const sb = statusBadge(intern.status);
  const prog = progressInfo(intern.start_date, intern.end_date);
  const tabs = [
    { id: 'info', label: 'المعلومات العامة', icon: <User size={18} /> },
    { id: 'docs', label: 'المستندات والوثائق', icon: <FileText size={18} /> },
    { id: 'perf', label: 'السجل والتقييم', icon: <Star size={18} /> },
    { id: 'comm', label: 'المراسلات والملاحظات', icon: <ChatText size={18} /> },
  ];

  const InfoCell = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) => (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Tajawal', sans-serif", background: '#F1F5F9', minHeight: '100%', padding: '20px 22px 40px' }}>
      {/* Back */}
      <button onClick={() => navigate('/interns')} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, marginBottom: 16, fontFamily: 'inherit' }}>
        <ArrowRight size={18} /> عودة للقائمة
      </button>

      {/* HERO HEADER */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 3px rgba(15,23,42,.06)', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
        {/* Avatar + identity (right side in RTL) */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative' }}>
            <img src={intern.photo_path || `https://i.pravatar.cc/150?u=${intern.id}`} alt="" style={{ width: 88, height: 88, borderRadius: 18, objectFit: 'cover', border: '2px solid #E2E8F0' }} />
            <span style={{ position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: intern.status === 'نشط' ? '#22C55E' : '#F59E0B', border: '3px solid #fff' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontFamily: "'Cairo', sans-serif", margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{intern.name}</h2>
            {intern.name_fr && <div style={{ fontSize: 13.5, color: '#475569', marginTop: 2, fontFamily: 'sans-serif', direction: 'ltr', textAlign: 'left' }}>{intern.name_fr}</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: '#EEF2FF', color: '#4338CA' }}>{intern.department || 'غير محدد'}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: '#F1F5F9', color: '#475569' }}>متدرب</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: sb.bg, color: sb.fg }}>{sb.s}</span>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: 12, flex: 2, minWidth: 300 }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#64748B' }}>رقم التسجيل</div>
            <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 16, fontWeight: 800, color: '#0F172A' }}>INT-{num(String(intern.id).padStart(4, '0'))}</div>
          </div>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#64748B' }}>رقم الهوية (CIN)</div>
            <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{intern.national_id || '—'}</div>
          </div>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#64748B' }}>المؤطر</div>
            <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{intern.encadrant || '—'}</div>
          </div>
          <div style={{ gridColumn: '1 / -1', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#475569', marginBottom: 6 }}>
              <span>تقدم التدريب</span>
              <span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700, color: '#0F172A' }}>{prog ? `يوم ${prog.elapsed} من ${prog.total} — ${num(prog.pct)}%` : 'غير محدد'}</span>
            </div>
            <div style={{ height: 8, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${prog?.pct ?? 0}%`, background: 'linear-gradient(90deg,#1E5631,#2F9E44)', borderRadius: 999 }} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
          <button onClick={handleEdit} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#334155', fontFamily: 'inherit' }}>
            <PencilSimple size={16} /> تعديل البيانات
          </button>
          <button onClick={() => window.open(api.exportInternPdf(intern.id), '_blank')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: 'none', background: '#1E5631', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#fff', fontFamily: 'inherit' }}>
            <FilePdf size={16} /> تصدير PDF
          </button>
          <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#DC2626', fontFamily: 'inherit' }}>
            <Trash size={16} /> إيقاف التدريب
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 6, marginTop: 18, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 6, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13.5,
            border: 'none', background: activeTab === t.id ? '#1E5631' : 'transparent', color: activeTab === t.id ? '#fff' : '#475569'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        {/* TAB 1: INFO */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontFamily: "'Cairo', sans-serif", margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#0F172A' }}>المعلومات الشخصية والاتصال</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <InfoCell icon={<IdentificationCard size={18} />} label="رقم الهوية الوطنية" value={intern.national_id} />
                <InfoCell icon={<Phone size={18} />} label="رقم الهاتف" value={intern.phone} />
                <InfoCell icon={<Envelope size={18} />} label="البريد الإلكتروني" value={intern.email} />
                <InfoCell icon={<MapPin size={18} />} label="العنوان" value={intern.address} />
                <InfoCell icon={<Calendar size={18} />} label="تاريخ الازدياد" value={fmtDate(intern.date_of_birth)} />
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontFamily: "'Cairo', sans-serif", margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#0F172A' }}>التفاصيل الأكاديمية والمهنية</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <InfoCell icon={<GraduationCap size={18} />} label="الجامعة أو المعهد" value={intern.university} />
                <InfoCell icon={<Briefcase size={18} />} label="القسم" value={intern.department} />
                <InfoCell icon={<User size={18} />} label="المؤطر (المشرف)" value={
                  canAssignEncadrant ? (
                    editingEncadrant ? (
                      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input value={encadrantInput} onChange={e => setEncadrantInput(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #CBD5E1', borderRadius: 6, outline: 'none', fontSize: 13 }} />
                        <button onClick={saveEncadrant} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}>حفظ</button>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {intern.encadrant || '—'}
                        <button onClick={() => { setEncadrantInput(intern.encadrant || ''); setEditingEncadrant(true); }} style={{ background: 'none', border: 'none', color: '#C9A227', cursor: 'pointer' }}><PencilSimple size={15} /></button>
                      </span>
                    )
                  ) : (intern.encadrant || '—')
                } />
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontFamily: "'Cairo', sans-serif", margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#0F172A' }}>مدة التدريب</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <InfoCell icon={<Calendar size={18} />} label="تاريخ البدء" value={fmtDate(intern.start_date)} />
                <InfoCell icon={<Calendar size={18} />} label="تاريخ الانتهاء" value={fmtDate(intern.end_date)} />
                <InfoCell icon={<Clock size={18} />} label="المدة الإجمالية" value={durationText(intern.start_date, intern.end_date)} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCUMENTS */}
        {activeTab === 'docs' && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ fontFamily: "'Cairo', sans-serif", margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>المستندات والوثائق</h3>
              <button onClick={() => openRequestModal('other', '')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: 'none', background: '#C9A227', color: '#2A2005', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>
                + طلب مستند جديد
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {Object.keys(docNames).map(key => {
                const file = intern.documents?.[key];
                return (
                  <div key={key} style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: file ? '#E7F8EE' : '#FEF3C7', color: file ? '#15803D' : '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {file ? <CheckCircle weight="fill" size={20} /> : <WarningCircle weight="fill" size={20} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{docNames[key]}</div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: file ? '#15803D' : '#B45309' }}>{file ? 'مرفق متوفر' : 'غير مرفق'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button disabled={!file} onClick={() => handleDownload(file)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, border: '1px solid #E2E8F0', background: file ? '#fff' : '#F8FAFC', color: file ? '#334155' : '#94A3B8', cursor: file ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 12.5, fontFamily: 'inherit' }}><DownloadSimple size={15} /> معاينة</button>
                      <button onClick={() => openRequestModal(key, docNames[key])} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, border: '1px solid #FCD34D', background: '#FFFBEB', color: '#B45309', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, fontFamily: 'inherit' }}><PencilSimple size={15} /> تحديث</button>
                    </div>
                  </div>
                );
              })}
              {intern.documents?.others?.map((other: any, idx: number) => {
                if (!other.file) return null;
                return (
                  <div key={`other-${idx}`} style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E7F8EE', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle weight="fill" size={20} /></div>
                      <div><div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{other.name || 'مستند إضافي'}</div><span style={{ fontSize: 11, fontWeight: 700, color: '#15803D' }}>مرفق متوفر</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleDownload(other.file)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', color: '#334155', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, fontFamily: 'inherit' }}><DownloadSimple size={15} /> معاينة</button>
                      <button onClick={() => openRequestModal('other', other.name)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, border: '1px solid #FCD34D', background: '#FFFBEB', color: '#B45309', cursor: 'pointer', fontWeight: 600, fontSize: 12.5, fontFamily: 'inherit' }}><PencilSimple size={15} /> تحديث</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PERFORMANCE */}
        {activeTab === 'perf' && (
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <h3 style={{ fontFamily: "'Cairo', sans-serif", margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>السجل والتقييم</h3>
                {canEvaluateInterns && <button onClick={openEvalModal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: 'none', background: '#1E5631', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>{intern.evaluation ? 'تعديل التقييم' : '★ تقييم المتدرب'}</button>}
              </div>
              {intern.evaluation ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 30, fontWeight: 800, color: '#15803D' }}>{intern.evaluation.total}/{intern.evaluation.max}</div>
                    <div style={{ fontSize: 12.5, color: '#64748B' }}>بواسطة {intern.evaluation.evaluator} · {intern.evaluation.date}</div>
                  </div>
                  {EVAL_CRITERIA.map(c => {
                    const score = intern.evaluation.criteria?.[c.key] ?? 0;
                    return (
                      <div key={c.key} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#334155', marginBottom: 6 }}>
                          <span>{c.label}</span><span style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700, color: '#0F172A' }}>{score} / {EVAL_MAX_PER}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {Array.from({ length: EVAL_MAX_PER }).map((_, i) => (
                            <Star key={i} size={18} weight={i < score ? 'fill' : 'regular'} color={i < score ? '#F59E0B' : '#CBD5E1'} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {intern.evaluation.comments && (
                    <div style={{ marginTop: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, fontSize: 13.5, color: '#334155', lineHeight: 1.8 }}>{intern.evaluation.comments}</div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '24px 0', fontSize: 14 }}>لا يوجد تقييم بعد.</div>
              )}
            </div>
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontFamily: "'Cairo', sans-serif", margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#0F172A' }}>سجل الحضور</h3>
              {attendance.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', padding: '20px 0', fontSize: 14 }}>لا يوجد سجل حضور.</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {attendance.map((a: any) => (
                    <span key={a.id} style={{ fontSize: 12.5, fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: a.status === 'present' ? '#E7F8EE' : '#FEE2E2', color: a.status === 'present' ? '#15803D' : '#B91C1C' }}>
                      {fmtDate(a.date)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: COMMUNICATION */}
        {activeTab === 'comm' && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontFamily: "'Cairo', sans-serif", margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#0F172A' }}>المراسلات والملاحظات</h3>
            {intern.status === 'نشط' ? (
              <Messaging internId={intern.id} mode="admin" />
            ) : (
              <div style={{ textAlign: 'center', color: '#64748B', padding: '30px 0', fontSize: 14 }}>المراسلات متاحة فقط بعد قبول المتدرب.</div>
            )}
          </div>
        )}
      </div>

      {/* Decision actions for not-yet-accepted */}
      {canApproveInterns && intern.status !== 'نشط' && intern.status !== 'مرفوض' && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderTop: '4px solid #C9A227', borderRadius: 16, padding: '20px 22px', marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h3 style={{ fontFamily: "'Cairo', sans-serif", margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#0F172A' }}>القرار النهائي للملف</h3>
            <p style={{ margin: 0, color: '#64748B', fontSize: 13.5 }}>بناءً على مراجعة المستندات والمقابلة، يرجى اتخاذ القرار النهائي.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleReject} style={{ padding: '11px 22px', borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>✕ رفض الطلب</button>
            <button onClick={handleApproveClick} style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: '#1E5631', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>✓ قبول الطلب وتنشيط الحساب</button>
          </div>
        </div>
      )}

      {/* EVAL MODAL */}
      {showEvalModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-head"><h3>تقييم المتدرب</h3><button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowEvalModal(false)}>✕</button></div>
            <div className="modal-body">
              {EVAL_CRITERIA.map(c => (
                <div key={c.key} className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}><span>{c.label}</span><span style={{ color: 'var(--gold-dark)', fontWeight: 'bold' }}>{evalScores[c.key] ?? 0} / {EVAL_MAX_PER}</span></label>
                  <input type="range" min={0} max={EVAL_MAX_PER} step={1} value={evalScores[c.key] ?? 0} onChange={e => setEvalScores({ ...evalScores, [c.key]: Number(e.target.value) })} style={{ width: '100%' }} />
                </div>
              ))}
              <div style={{ background: 'var(--paper)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', margin: '8px 0 16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--slate)' }}>المجموع الكلي:</span>
                <div style={{ fontWeight: 'bold', color: 'var(--gold-dark)', marginTop: '4px', fontSize: '1.2rem' }}>{evalTotal} / {EVAL_TOTAL_MAX}</div>
              </div>
              <div className="form-group">
                <label>ملاحظات (اختياري)</label>
                <textarea className="input" rows={4} value={evalComments} onChange={e => setEvalComments(e.target.value)} placeholder="أضف ملاحظاتك حول أداء المتدرب..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowEvalModal(false)}>إلغاء</button>
              <button className="btn btn-success" style={{ background: 'var(--success)', color: '#fff', border: 'none' }} onClick={saveEvaluation} disabled={savingEval}>{savingEval ? 'جاري الحفظ...' : 'حفظ التقييم'}</button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST MODAL */}
      {showRequestModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-head"><h3>{requestDocType === 'other' ? 'طلب مستند جديد' : 'طلب إعادة رفع مستند'}</h3><button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowRequestModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label>اسم المستند المطلوب</label>
                <input type="text" className="input" placeholder="مثال: شهادة طبية" value={requestTitle} onChange={e => setRequestTitle(e.target.value)} disabled={requestDocType !== 'other'} style={requestDocType !== 'other' ? { background: 'var(--paper-2)', color: 'var(--slate)', border: 'none', fontWeight: 'bold' } : {}} />
              </div>
              <div className="form-group">
                <label>ملاحظة للمتدرب (اختياري)</label>
                <textarea className="input" style={{ width: '100%', padding: '11px 13px', border: '1px solid var(--line)', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13.5px', background: 'var(--paper)', minHeight: '80px', resize: 'vertical' }} placeholder="أضف أي تفاصيل أو تعليمات..." rows={3} value={requestNote} onChange={e => setRequestNote(e.target.value)} />
              </div>
              <div className="form-group">
                <label>إرفاق نموذج (اختياري)</label>
                <input type="file" className="input" accept=".pdf" onChange={e => { if (e.target.files && e.target.files[0]) setRequestFile(e.target.files[0]); else setRequestFile(null); }} />
                <small style={{ color: 'var(--slate-light)', display: 'block', marginTop: '4px' }}>بصيغة PDF فقط</small>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowRequestModal(false)}>إلغاء</button>
              <button className="btn btn-gold" onClick={() => handleRequestDocument(requestDocType, requestTitle)} disabled={!requestTitle.trim()}>إرسال الطلب</button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {showApproveModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-head"><h3>تأكيد قبول المتدرب</h3><button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowApproveModal(false)}>✕</button></div>
            <div className="modal-body">
              <p style={{ color: 'var(--slate)', fontSize: '13.5px', marginTop: 0, marginBottom: '20px' }}>أنت على وشك تنشيط حساب المتدرب وبدء فترة تدريبه.</p>
              <div className="form-group"><label>تاريخ البدء</label><input type="date" className="input" value={approveStartDate} onChange={e => setApproveStartDate(e.target.value)} /></div>
              <div className="form-group"><label>تاريخ الانتهاء</label><input type="date" className="input" value={approveEndDate} onChange={e => setApproveEndDate(e.target.value)} /></div>
              {durationStr && <div style={{ background: 'var(--paper)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', marginTop: '8px' }}><span style={{ fontSize: '12px', color: 'var(--slate)' }}>مدة التدريب المحسوبة:</span><div style={{ fontWeight: 'bold', color: 'var(--gold-dark)', marginTop: '4px' }}>{durationStr}</div></div>}
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowApproveModal(false)}>إلغاء</button>
              <button className="btn btn-success" style={{ background: 'var(--success)', color: '#fff', border: 'none' }} onClick={confirmApprove}>تأكيد وبدء التدريب</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
