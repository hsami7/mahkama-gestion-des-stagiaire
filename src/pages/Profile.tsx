import React, { useState, useEffect } from 'react';
import { ArrowRight, PencilSimple, Trash, FileText, CheckCircle, DownloadSimple, Certificate, MicrosoftExcelLogo, FilePdf, Eye, UploadSimple, X, ArrowsClockwise, Package, Star } from '@phosphor-icons/react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, API_BASE } from '../services/api';
import { useToast } from '../components/Toast';

const EVAL_CRITERIA = [
  { key: 'discipline', label: 'الانضباط والالتزام بالمواعيد' },
  { key: 'skills', label: 'المهارات والكفاءة المهنية' },
  { key: 'teamwork', label: 'العمل الجماعي والتواصل' },
  { key: 'initiative', label: 'المبادرة والاجتهاد' },
  { key: 'quality', label: 'جودة العمل المنجز' },
];
const EVAL_MAX_PER = 4;
const EVAL_TOTAL_MAX = EVAL_CRITERIA.length * EVAL_MAX_PER;

function toDateInputValue(value?: string): string {
  if (!value || value.trim() === '') return '';
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo}-${d}`;
  }
  return '';
}

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

export function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [intern, setIntern] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEncadrant, setEditingEncadrant] = useState(false);
  const [encadrantInput, setEncadrantInput] = useState('');

  // Document Lifecycle Center
  const [docsLifecycle, setDocsLifecycle] = useState<any[]>([]);
  const [assignDocType, setAssignDocType] = useState('CONVENTION_SIGNED');
  const [assignCustomTitle, setAssignCustomTitle] = useState('');
  const [assignFile, setAssignFile] = useState<File | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [revisionDocId, setRevisionDocId] = useState<number | null>(null);
  const [revisionReason, setRevisionReason] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [showVaultModal, setShowVaultModal] = useState(false);

  const DOC_TYPE_LABELS: Record<string, string> = {
    CIN: 'بطاقة التعريف الوطنية (CIN)',
    CV: 'السيرة الذاتية (CV)',
    INSURANCE: 'التأمين (Assurance)',
    DEMANDE: 'طلب التدريب (Demande)',
    CONVENTION_SIGNED: 'اتفاقية التدريب الموقعة',
    FINAL_REPORT: 'التقرير النهائي',
    ATTESTATION_SIGNED: 'شهادة التدريب الموقعة',
    OTHER: 'مستند إضافي',
  };
  
  // Approval Modal State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveStartDate, setApproveStartDate] = useState('');
  const [approveEndDate, setApproveEndDate] = useState('');
  const [durationStr, setDurationStr] = useState('');

  // PDF Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'summary' | 'full'>('summary');

  const handleExportAction = async (disposition: 'attachment' | 'inline') => {
    const url = api.exportInternPdf(intern.id, exportMode, disposition);
    setShowExportModal(false);

    if (disposition !== 'inline') {
      window.open(url, '_blank');
      return;
    }

    // Preview & Print: fetch the PDF, load it in a hidden iframe, then print it.
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      let done = false;
      const cleanup = () => {
        setTimeout(() => {
          try { document.body.removeChild(iframe); } catch (e) {}
          try { URL.revokeObjectURL(blobUrl); } catch (e) {}
        }, 60000);
      };
      iframe.onload = () => {
        if (done) return;
        done = true;
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            window.open(blobUrl, '_blank');
          }
          cleanup();
        }, 400);
      };
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  // Evaluation Modal State
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [evalComments, setEvalComments] = useState('');
  const [savingEval, setSavingEval] = useState(false);

  // Calculate duration whenever dates change
  useEffect(() => {
    if (approveStartDate && approveEndDate) {
      const start = new Date(approveStartDate);
      const end = new Date(approveEndDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (end < start) {
        setDurationStr('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      } else {
        const months = Math.floor(diffDays / 30);
        const days = diffDays % 30;
        let str = '';
        if (months > 0) str += `${months} شهر `;
        if (days > 0) str += `${days} يوم`;
        setDurationStr(str || 'أقل من يوم');
      }
    } else {
      setDurationStr('');
    }
  }, [approveStartDate, approveEndDate]);

  const fetchInternAndAttendance = async () => {
    try {
      const data = await api.get(`/interns/${id}`);
      setIntern(data);
      const attData = await api.get(`/interns/${id}/attendance`);
      setAttendance(attData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocsLifecycle = async () => {
    if (!id) return;
    try {
      const data = await api.get(`/interns/${id}/documents`);
      setDocsLifecycle(data);
    } catch (err) {
      console.error(err);
    }
  };

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'Admin';
  let canAssignEncadrant = isAdmin;
  let canApproveInterns = isAdmin;
  let canEvaluateInterns = isAdmin;
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
    } catch (err) {
      toast.error("فشل في حفظ المؤطر");
    }
  };

  useEffect(() => {
    if (id) {
      fetchInternAndAttendance();
      fetchDocsLifecycle();
    }
  }, [id]);

  useEffect(() => {
    if (showAssignModal && assignDocType && !assignCustomTitle) {
      setAssignCustomTitle(DOC_TYPE_LABELS[assignDocType] || '');
    }
  }, [showAssignModal, assignDocType]);

  const markAttendance = async (status: string) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await api.post(`/interns/${id}/attendance`, { date: today, status });
      fetchInternAndAttendance();
    } catch (err) {
      toast.error("فشل في تسجيل الحضور");
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>جاري التحميل...</div>;
  if (!intern) return <div style={{ padding: '24px' }}>لم يتم العثور على المتدرب</div>;

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

  const handleEdit = () => {
    navigate('/interns', { state: { editIntern: intern } });
  };

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا المتدرب؟')) {
      try {
        await api.delete(`/interns/${intern.id}`);
        navigate('/interns');
      } catch (err) {
        console.error(err);
        toast.error('فشل الحذف');
      }
    }
  };

  const handleApproveClick = () => {
    const missingDocs = Object.keys(docNames).filter(key => !intern.documents?.[key]);
    if (missingDocs.length > 0) {
      toast.warning('لا يمكن قبول المتدرب. يرجى التأكد من رفع جميع المستندات المطلوبة أولاً.');
      return;
    }
    if (!intern.encadrant || intern.encadrant.trim() === '') {
      toast.warning('لا يمكن قبول المتدرب. يرجى تعيين المؤطر (المشرف) أولاً.');
      return;
    }

    setApproveStartDate(toDateInputValue(intern.start_date) || new Date().toISOString().split('T')[0]);
    setApproveEndDate(toDateInputValue(intern.end_date));
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!approveStartDate || !approveEndDate) {
      toast.warning('يرجى تحديد تاريخ البداية والنهاية.');
      return;
    }
    const end = new Date(approveEndDate);
    const start = new Date(approveStartDate);
    if (end < start) {
      toast.warning('تاريخ النهاية يجب أن يكون بعد تاريخ البداية.');
      return;
    }

    try {
      await api.put(`/interns/${id}`, { 
        ...intern, 
        status: 'نشط',
        start_date: approveStartDate,
        end_date: approveEndDate 
      });
      setShowApproveModal(false);
      fetchInternAndAttendance();
      toast.success('تم قبول المتدرب وتنشيط حسابه بنجاح!');
    } catch (err) {
      toast.error('فشل القبول');
    }
  };

  const openEvalModal = () => {
    const existing = intern?.evaluation?.criteria || {};
    const scores: Record<string, number> = {};
    EVAL_CRITERIA.forEach(c => { scores[c.key] = existing[c.key] ?? 0; });
    setEvalScores(scores);
    setEvalComments(intern?.evaluation?.comments || '');
    setShowEvalModal(true);
  };

  const evalTotal = EVAL_CRITERIA.reduce((sum, c) => sum + (evalScores[c.key] || 0), 0);

  const saveEvaluation = async () => {
    setSavingEval(true);
    try {
      const res = await api.post(`/interns/${id}/evaluation`, {
        criteria: evalScores,
        comments: evalComments,
        total: evalTotal,
        max: EVAL_TOTAL_MAX,
      });
      setIntern({ ...intern, evaluation: res.evaluation });
      setShowEvalModal(false);
      toast.success('تم حفظ تقييم المتدرب بنجاح!');
    } catch (err) {
      toast.error('فشل حفظ التقييم');
    } finally {
      setSavingEval(false);
    }
  };

  const handleReject = async () => {
    if (window.confirm('هل أنت متأكد من رفض هذا المتدرب؟')) {
      try {
        await api.put(`/interns/${id}`, { ...intern, status: 'مرفوض' });
        fetchInternAndAttendance();
      } catch (err) {
        toast.error('فشل الرفض');
      }
    }
  };

  return (
    <div>
      <div className="section-head">
        <button className="btn btn-ghost" onClick={() => navigate('/interns')}>
          <ArrowRight weight="bold" className="icon" /> عودة للقائمة
        </button>
      </div>

      <div className="profile-head">
        <div className="profile-photo-wrap">
          {intern.photo_path ? <img src={intern.photo_path} alt="Profile" /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'100%', height:'100%', padding:'15%', color:'var(--slate)'}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        </div>
        <div>
          <h2 className="profile-name" style={{ margin: 0 }}>{intern.name}</h2>
          {intern.name_fr && <div className="profile-sub" style={{ fontSize: '13px', fontFamily: 'sans-serif', direction: 'ltr', textAlign: 'right' }}>{intern.name_fr}</div>}
          <div className="profile-sub" style={{ marginTop: '4px' }}>متدرب</div>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className={`badge ${intern.status === 'نشط' ? 'badge-success' : intern.status === 'مرفوض' ? 'badge-danger' : 'badge-warning'}`}>
              <div className="dot"></div>{intern.status || 'قيد المراجعة'}
            </span>
          </div>
        </div>
        <div className="profile-actions" style={{ display: 'flex', gap: '8px' }}>
          <button title="تحميل شهادة التدريب" onClick={() => window.open(`${API_BASE}/interns/${intern.id}/attestation?token=${sessionStorage.getItem('token')}`, '_blank')} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#e0e7ff', border: '1.5px solid #6366f1', color: '#1a1a1a', transition: 'all 0.2s' }}>
            <Certificate weight="bold" size={18} color="#1a1a1a" />
          </button>
           <button title="تصدير الملف الشخصي Excel" onClick={() => window.open(api.exportInterns('excel', [intern.id]), '_blank')} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#E8F5E9', border: '1.5px solid #21A366', color: '#1a1a1a', transition: 'all 0.2s' }}>
             <MicrosoftExcelLogo weight="bold" size={18} color="#1a1a1a" />
           </button>
           <button title="تصدير PDF" onClick={() => { setExportMode('summary'); setShowExportModal(true); }} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#1E5631', border: '1.5px solid #1E5631', color: '#fff', transition: 'all 0.2s' }}>
             <FilePdf weight="bold" size={18} color="#fff" />
           </button>
          <button title="تعديل" onClick={handleEdit} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fef3c7', border: '1.5px solid #f59e0b', color: '#1a1a1a', transition: 'all 0.2s' }}>
            <PencilSimple weight="bold" size={18} color="#1a1a1a" />
          </button>
          <button title="حذف" onClick={handleDelete} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fee2e2', border: '1.5px solid #ef4444', color: '#1a1a1a', transition: 'all 0.2s' }}>
            <Trash weight="bold" size={18} color="#1a1a1a" />
          </button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card info-card">
          <h3><FileText weight="bold" className="icon" /> المعلومات الشخصية</h3>
          <div className="info-row">
            <span className="k">رقم الهوية</span>
            <span className="v">{intern.national_id || '—'}</span>
          </div>
          <div className="info-row">
            <span className="k">المؤطر (المشرف)</span>
            <span className="v">
              {canAssignEncadrant ? (
                editingEncadrant || !intern.encadrant ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={encadrantInput || ''} 
                      onChange={e => setEncadrantInput(e.target.value)} 
                      placeholder="أدخل اسم المؤطر"
                      style={{ padding: '4px 8px', border: '1px solid var(--line)', borderRadius: '4px', outline: 'none' }}
                    />
                    <button onClick={saveEncadrant} style={{ background: 'var(--success-bg)', color: 'var(--success)', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontWeight: 'bold' }}>حفظ</button>
                    {intern.encadrant && <button onClick={() => { setEditingEncadrant(false); setEncadrantInput(intern.encadrant); }} style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}>إلغاء</button>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {intern.encadrant}
                    <button onClick={() => { setEncadrantInput(intern.encadrant || ''); setEditingEncadrant(true); }} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="تعديل">
                      <PencilSimple weight="bold" />
                    </button>
                  </div>
                )
              ) : (
                intern.encadrant || '—'
              )}
            </span>
          </div>
          <div className="info-row">
            <span className="k">البريد الإلكتروني</span>
            <span className="v">{intern.email}</span>
          </div>
          <div className="info-row">
            <span className="k">رقم الهاتف</span>
            <span className="v">{intern.phone || '—'}</span>
          </div>
          <div className="info-row">
            <span className="k">تاريخ الازدياد</span>
            <span className="v">{intern.date_of_birth || '—'}</span>
          </div>
          <div className="info-row">
            <span className="k">تاريخ البدء</span>
            <span className="v">{intern.start_date || '—'}</span>
          </div>
          <div className="info-row">
            <span className="k">تاريخ الانتهاء</span>
            <span className="v">{intern.end_date || '—'}</span>
          </div>
          <div className="info-row">
            <span className="k">الجامعة أو المعهد</span>
            <span className="v">{intern.university || '—'}</span>
          </div>
          <div className="info-row">
            <span className="k">العنوان</span>
            <span className="v">{intern.address || '—'}</span>
          </div>
        </div>

        <div className="card info-card">
          <h3><FileText weight="bold" className="icon" /> مركز المستندات</h3>

          <div style={{marginBottom: 12, display:'flex', gap: 8}}>
            <button className="btn btn-ghost sm" onClick={() => { setAssignDocType('CONVENTION_SIGNED'); setAssignCustomTitle(''); setAssignFile(null); setShowAssignModal(true); }} style={{fontSize:12, padding:'6px 12px'}}>
              + رفع وثيقة موقعة
            </button>
            <button className="btn btn-ghost sm" onClick={async () => { try { const d = await api.get('/vault'); setVaultDocs(d); setShowVaultModal(true); } catch {} }} style={{fontSize:12, padding:'6px 12px'}}>
              <FileText size={14} /> إضافة من الخزنة
            </button>
          </div>

          {/* Section 1: المستندات المطلوبة من المتدرب (Incoming) */}
          <div style={{marginBottom:16}}>
            <div className="section-title" style={{marginBottom:8}}><h4 style={{fontSize:13, fontWeight:700, margin:0, color:'var(--gold-dark)'}}>المستندات المطلوبة من المتدرب</h4></div>
            {['CIN','CV','INSURANCE','DEMANDE'].filter(t => !['CONVENTION_SIGNED','ATTESTATION_SIGNED'].includes(t)).length === 0 && <div/>}
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:12.5}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--line)'}}>
                  <th style={{textAlign:'right', padding:'6px 4px', color:'var(--slate-light)', fontWeight:600}}>المستند</th>
                  <th style={{textAlign:'center', padding:'6px 4px', color:'var(--slate-light)', fontWeight:600}}>الحالة</th>
                  <th style={{textAlign:'center', padding:'6px 4px', color:'var(--slate-light)', fontWeight:600}}>تاريخ الرفع</th>
                  <th style={{textAlign:'left', padding:'6px 4px', color:'var(--slate-light)', fontWeight:600}}>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {['CIN','CV','INSURANCE','DEMANDE'].map(dt => {
                  const d = docsLifecycle.find(x => x.doc_type === dt);
                  if (!d) return null;
                  return (
                    <tr key={dt} style={{borderBottom:'1px solid var(--line)'}}>
                      <td style={{padding:'8px 4px'}}>
                        <div style={{fontWeight:600, color:'var(--ink)'}}>{DOC_TYPE_LABELS[dt]}</div>
                        {d?.rejection_reason && d.status === 'REVISION_REQUESTED' && (
                          <div style={{fontSize:11, color:'var(--danger)', marginTop:2, background:'#FFF0EE', padding:'3px 6px', borderRadius:4}}>
                            <span style={{fontWeight:600}}>ملاحظة الإدارة:</span> {d.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td style={{textAlign:'center', padding:'8px 4px'}}>
                        {!d || d.status === 'MISSING' ? <span className="badge" style={{fontSize:11, background:'var(--paper)', color:'var(--slate)'}}>غير مرفوع</span> :
                         d.status === 'PENDING_REVIEW' ? <span className="badge badge-warning" style={{fontSize:11}}>قيد المراجعة</span> :
                         d.status === 'APPROVED_AND_SIGNED' ? <span className="badge badge-success" style={{fontSize:11}}>مقبول</span> :
                         d.status === 'REVISION_REQUESTED' ? <span className="badge badge-danger" style={{fontSize:11}}>مطلوب إعادة</span> : null}
                      </td>
                      <td style={{textAlign:'center', padding:'8px 4px', color:'var(--slate)'}}>
                        {d?.file_path ? formatDate(d.updated_at || d.created_at) : '—'}
                      </td>
                      <td style={{textAlign:'left', padding:'8px 4px'}}>
                        <div style={{display:'flex', gap:4, justifyContent:'flex-end'}}>
                          {d?.file_path && (
                            <>
                              <button className="btn btn-ghost sm" onClick={() => window.open(api.downloadDocument(d.id), '_blank')} title="معاينة" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                <Eye size={14} />
                              </button>
                              <button className="btn btn-ghost sm" onClick={() => { const a = document.createElement('a'); a.href = api.downloadDocument(d.id); a.download = ''; a.click(); }} title="تحميل" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                <DownloadSimple size={14} />
                              </button>
                            </>
                          )}
                          {d && d.status !== 'MISSING' && (
                            <button className="btn btn-ghost sm" onClick={() => { setRevisionDocId(d.id); setRevisionReason(''); setShowRevisionModal(true); }} title="طلب إعادة الرفع" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gold-dark)'}}>
                              <ArrowsClockwise size={14} />
                            </button>
                          )}
                          {d?.status === 'PENDING_REVIEW' && (
                            <button className="btn btn-ghost sm" onClick={() => api.approveDocument(Number(id), d.id).then(() => fetchDocsLifecycle())} title="قبول" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--success)'}}>
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section 2: الوثائق الموقعة من الإدارة (Outgoing Signed Docs) */}
          <div style={{marginBottom:16}}>
            <div className="section-title" style={{marginBottom:8}}><h4 style={{fontSize:13, fontWeight:700, margin:0, color:'var(--success)'}}>الوثائق الموقعة من الإدارة</h4></div>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:12.5}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--line)'}}>
                  <th style={{textAlign:'right', padding:'6px 4px', color:'var(--slate-light)', fontWeight:600}}>الوثيقة</th>
                  <th style={{textAlign:'center', padding:'6px 4px', color:'var(--slate-light)', fontWeight:600}}>تاريخ الإرسال</th>
                  <th style={{textAlign:'left', padding:'6px 4px', color:'var(--slate-light)', fontWeight:600}}>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const signedDocs = docsLifecycle.filter(d => d.status === 'APPROVED_AND_SIGNED' && (d.uploaded_by === 'ADMIN' || d.doc_type === 'CONVENTION_SIGNED'));
                  return signedDocs.length === 0 ? (
                    <tr><td colSpan={3} style={{textAlign:'center', padding:'16px 4px', color:'var(--slate-light)'}}>لم يتم إصدار أي وثائق موقعة بعد</td></tr>
                  ) : signedDocs.map(d => (
                    <tr key={d.id} style={{borderBottom:'1px solid var(--line)'}}>
                      <td style={{padding:'8px 4px', fontWeight:600}}>{d.label}</td>
                      <td style={{textAlign:'center', padding:'8px 4px', color:'var(--slate)'}}>
                        {formatDate(d.updated_at)}
                      </td>
                      <td style={{textAlign:'left', padding:'8px 4px'}}>
                        <button className="btn btn-ghost sm" onClick={() => { const a = document.createElement('a'); a.href = api.downloadDocument(d.id); a.download = ''; a.click(); }} title="تحميل" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <DownloadSimple size={14} />
                        </button>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Section 3: ختام التدريب والأرشيف (Exit Docs) — visible only after documents are uploaded */}
          {(() => {
            const att = docsLifecycle.find(d => d.doc_type === 'ATTESTATION_SIGNED');
            const final = docsLifecycle.find(d => d.doc_type === 'FINAL_REPORT');
            const hasExitDocs = att?.file_path || final?.file_path;
            if (!hasExitDocs) return null;
            return (
            <div style={{marginBottom:8}}>
              <div className="section-title" style={{marginBottom:8}}><h4 style={{fontSize:13, fontWeight:700, margin:0, color:'var(--brand)'}}>ختام التدريب والأرشيف</h4></div>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {att?.file_path && (
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 6px', background:'var(--paper)', borderRadius:8, border:'1px solid var(--line)'}}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <Certificate weight="fill" style={{color:'var(--gold-dark)', width:16}} />
                    <span style={{fontWeight:600, fontSize:12.5}}>شهادة التدريب</span>
                  </div>
                  <div style={{display:'flex', gap:4}}>
                    <button className="btn btn-ghost sm" onClick={() => { const a = document.createElement('a'); a.href = api.downloadDocument(att.id); a.download = ''; a.click(); }} title="تحميل" style={{width:28,height:28,padding:0}}>
                      <DownloadSimple size={14} />
                    </button>
                  </div>
                </div>
                )}
                <button className="btn btn-ghost" style={{width:'100%', justifyContent:'center', padding:'10px', fontSize:12.5, border:'1.5px dashed var(--line)', borderRadius:8, color:'var(--slate)'}} onClick={async () => {
                  if (!id) return;
                  try {
                    const res = await fetch(`${API_BASE}/interns/${id}/export-zip?token=${sessionStorage.getItem('token')}`);
                    if (!res.ok) throw new Error('Export failed');
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `Intern_${id}_Archive.zip`; a.click();
                    URL.revokeObjectURL(url);
                  } catch (e) {
                    toast.error('فشل إنشاء الأرشيف');
                  }
                }}>
                  <DownloadSimple weight="bold" size={16} style={{marginLeft:6}} />
                  <Package size={16} /> تحميل أرشيف الملفات ZIP
                </button>
              </div>
            </div>
            );
          })()}
        </div>
      </div>

      {canApproveInterns && intern.status !== 'نشط' && intern.status !== 'مرفوض' && (
        <div className="card" style={{ padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', flexWrap: 'wrap', gap: '20px', borderTop: '4px solid var(--gold)', background: 'linear-gradient(to left, var(--paper), var(--bg))' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 'bold' }}>القرار النهائي للملف</h3>
            <p style={{ margin: 0, color: 'var(--slate)', fontSize: '0.95rem' }}>بناءً على مراجعة المستندات والمقابلة، يرجى اتخاذ القرار النهائي.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn btn-ghost" onClick={handleReject} style={{ padding: '12px 24px', color: 'var(--danger)', border: '1.5px solid var(--danger-border)', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px' }}>
<X size={18} /> رفض الطلب
            </button>
            <button className="btn btn-primary" onClick={handleApproveClick} style={{ padding: '12px 24px', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)' }}>
<CheckCircle size={18} weight="fill" /> قبول الطلب وتنشيط الحساب
            </button>
          </div>
        </div>
      )}

      {intern.status === 'نشط' && (canEvaluateInterns || intern.evaluation) && (
        <div className="card" style={{ padding: '28px', marginTop: '24px', borderTop: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 'bold' }}>تقييم المتدرب</h3>
              <p style={{ margin: 0, color: 'var(--slate)', fontSize: '0.95rem' }}>تقييم أداء المتدرب بناءً على معايير محددة.</p>
            </div>
            {canEvaluateInterns && (
              <button className="btn btn-primary" onClick={openEvalModal} style={{ padding: '12px 24px', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px' }}>
                {intern.evaluation ? 'تعديل التقييم' : <><Star size={18} weight="fill" /> تقييم المتدرب</>}
              </button>
            )}
          </div>

          {intern.evaluation && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  {intern.evaluation.total}/{intern.evaluation.max}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--slate)' }}>
                  بواسطة {intern.evaluation.evaluator} · {intern.evaluation.date}
                </span>
              </div>
              {EVAL_CRITERIA.map(c => (
                <div key={c.key} className="info-row">
                  <span className="k">{c.label}</span>
                  <span className="v">{intern.evaluation.criteria?.[c.key] ?? 0} / {EVAL_MAX_PER}</span>
                </div>
              ))}
              {intern.evaluation.comments && (
                <div style={{ marginTop: '12px', background: 'var(--paper)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--slate)', display: 'block', marginBottom: '4px' }}>ملاحظات المقيّم:</span>
                  {intern.evaluation.comments}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showExportModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-head">
              <h3>تصدير PDF</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowExportModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: 'var(--slate)' }}>اختر نوع التصدير</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => setExportMode('summary')}
                  style={{ textAlign: 'right', padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', background: exportMode === 'summary' ? 'var(--brand-tint, #EEF4EF)' : 'var(--paper)', border: `1.5px solid ${exportMode === 'summary' ? '#1E5631' : 'var(--line)'}`, transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#1E5631' }}>
                    <FilePdf weight="bold" size={18} color="#1E5631" /> الملف الأساسي فقط
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--slate)', marginTop: '4px' }}>ملف من صفحة واحدة: المعلومات الشخصية والأكاديمية وقائمة بالمستندات المرفوعة.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('full')}
                  style={{ textAlign: 'right', padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', background: exportMode === 'full' ? 'var(--brand-tint, #EEF4EF)' : 'var(--paper)', border: `1.5px solid ${exportMode === 'full' ? '#1E5631' : 'var(--line)'}`, transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#1E5631' }}>
                    <FileText weight="bold" size={18} color="#1E5631" /> الملف الكامل مع جميع المستندات
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--slate)', marginTop: '4px' }}>ملف متعدد الصفحات: بيانات المتدرب متبوعة بجميع المستندات المرفوعة (الاتفاقية، البطاقة الوطنية، التأمين، السيرة الذاتية...).</div>
                </button>
              </div>
            </div>
            <div className="modal-foot" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={() => setShowExportModal(false)}>إلغاء</button>
              <button className="btn btn-ghost" style={{ border: '1.5px solid #1E5631', color: '#1E5631' }} onClick={() => handleExportAction('inline')}>
                <Eye weight="bold" className="icon" /> معاينة وطباعة
              </button>
              <button className="btn" style={{ background: '#1E5631', color: '#fff', border: 'none' }} onClick={() => handleExportAction('attachment')}>
                <DownloadSimple weight="bold" className="icon" /> تحميل PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {showEvalModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-head">
              <h3>تقييم المتدرب</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowEvalModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              {EVAL_CRITERIA.map(c => (
                <div key={c.key} className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{c.label}</span>
                    <span style={{ color: 'var(--gold-dark)', fontWeight: 'bold' }}>{evalScores[c.key] ?? 0} / {EVAL_MAX_PER}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={EVAL_MAX_PER}
                    step={1}
                    value={evalScores[c.key] ?? 0}
                    onChange={e => setEvalScores({ ...evalScores, [c.key]: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
              <div style={{ background: 'var(--paper)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', margin: '8px 0 16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--slate)' }}>المجموع الكلي:</span>
                <div style={{ fontWeight: 'bold', color: 'var(--gold-dark)', marginTop: '4px', fontSize: '1.2rem' }}>
                  {evalTotal} / {EVAL_TOTAL_MAX}
                </div>
              </div>
              <div className="form-group">
                <label>ملاحظات (اختياري)</label>
                <textarea
                  className="input"
                  rows={4}
                  value={evalComments}
                  onChange={e => setEvalComments(e.target.value)}
                  placeholder="أضف ملاحظاتك حول أداء المتدرب..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowEvalModal(false)}>إلغاء</button>
              <button className="btn btn-success" style={{ background: 'var(--success)', color: '#fff', border: 'none' }} onClick={saveEvaluation} disabled={savingEval}>
                {savingEval ? 'جاري الحفظ...' : 'حفظ التقييم'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-head">
              <h3>تأكيد قبول المتدرب</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowApproveModal(false)}><X size={14} /></button>
            </div>
            
            <div className="modal-body">
              <p style={{ color: 'var(--slate)', fontSize: '13.5px', marginTop: 0, marginBottom: '20px' }}>
                أنت على وشك تنشيط حساب المتدرب وبدء فترة تدريبه. يرجى تأكيد تواريخ التدريب ليتم تفعيل الحضور والانصراف بناءً عليها.
              </p>
              
              <div className="form-group">
                <label>تاريخ البدء</label>
                <input 
                  type="date" 
                  className="input" 
                  value={approveStartDate}
                  onChange={e => setApproveStartDate(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>تاريخ الانتهاء</label>
                <input 
                  type="date" 
                  className="input" 
                  value={approveEndDate}
                  onChange={e => setApproveEndDate(e.target.value)}
                />
              </div>

              {durationStr && (
                <div style={{ background: 'var(--paper)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--slate)' }}>مدة التدريب المحسوبة:</span>
                  <div style={{ fontWeight: 'bold', color: 'var(--gold-dark)', marginTop: '4px' }}>
                    {durationStr}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowApproveModal(false)}>
                إلغاء
              </button>
              <button className="btn btn-success" style={{ background: 'var(--success)', color: '#fff', border: 'none' }} onClick={confirmApprove}>
                تأكيد وبدء التدريب
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-head">
              <h3>رفع وثيقة موقعة</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowAssignModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>نوع الوثيقة</label>
                <select className="input" value={assignDocType} onChange={e => { setAssignDocType(e.target.value); setAssignCustomTitle(''); }} style={{marginBottom: 8}}>
                  <option value="CONVENTION_SIGNED">اتفاقية التدريب الموقعة</option>
                  <option value="CIN">بطاقة التعريف الوطنية (CIN)</option>
                  <option value="CV">السيرة الذاتية (CV)</option>
                  <option value="INSURANCE">التأمين (Assurance)</option>
                  <option value="DEMANDE">طلب التدريب (Demande)</option>
                  <option value="FINAL_REPORT">التقرير النهائي</option>
                  <option value="ATTESTATION_SIGNED">شهادة التدريب الموقعة</option>
                  <option value="OTHER">مستند إضافي</option>
                </select>
              </div>
              {assignDocType === 'OTHER' && (
              <div className="form-group">
                <label>اسم المستند / العنوان</label>
                <input type="text" className="input" value={assignCustomTitle} onChange={e => setAssignCustomTitle(e.target.value)} placeholder="اتفاقية التدريب المعدلة 2026" />
                <small style={{color:'var(--slate-light)',display:'block',marginTop:4}}>سيظهر هذا العنوان للمتدرب. إذا ترك فارغًا، سيتم استخدام اسم نوع الوثيقة تلقائيًا.</small>
              </div>
              )}
              <div className="form-group">
                <label>الملف الموقع (PDF)</label>
                <input type="file" className="input" accept=".pdf" onChange={e => setAssignFile(e.target.files?.[0] || null)} />
                <small style={{color:'var(--slate-light)',display:'block',marginTop:4}}>يجب أن يكون الملف بصيغة PDF وحجم أقل من 15 ميجابايت</small>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowAssignModal(false)}>إلغاء</button>
              <button className="btn btn-success" style={{background:'var(--success)',color:'#fff',border:'none'}} disabled={!assignFile} onClick={async () => {
                if (!assignFile) return;
                try {
                  await api.uploadSignedDocument(Number(id), assignDocType, assignFile, assignCustomTitle);
                  toast.success('تم رفع الوثيقة الموقعة بنجاح');
                  setShowAssignModal(false);
                  setAssignFile(null);
                  fetchDocsLifecycle();
                } catch (err) {
                  toast.error('فشل رفع الوثيقة الموقعة');
                }
              }}>
                رفع الوثيقة الموقعة
              </button>
            </div>
          </div>
        </div>
      )}

      {showRevisionModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-head">
              <h3>طلب إعادة رفع المستند</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowRevisionModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>سبب طلب إعادة الرفع</label>
                <textarea className="input" rows={4} value={revisionReason} onChange={e => setRevisionReason(e.target.value)} placeholder="يرجى توضيح سبب طلب إعادة الرفع للمتدرب..." style={{resize:'vertical'}} />
                <small style={{color:'var(--slate-light)',display:'block',marginTop:4}}>سيظهر السبب للمتدرب في لوحة المستندات الخاصة به</small>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowRevisionModal(false)}>إلغاء</button>
              <button className="btn btn-danger" style={{background:'var(--danger)',color:'#fff',border:'none'}} disabled={!revisionReason.trim() || !revisionDocId} onClick={async () => {
                if (!revisionDocId) return;
                try {
                  await api.rejectDocument(Number(id), revisionDocId, revisionReason);
                  toast.success('تم إرسال طلب إعادة الرفع');
                  setShowRevisionModal(false);
                  setRevisionReason('');
                  setRevisionDocId(null);
                  fetchDocsLifecycle();
                } catch (err) {
                  toast.error('فشل إرسال الطلب');
                }
              }}>
                إرسال طلب إعادة الرفع
              </button>
            </div>
          </div>
        </div>
      )}

      {showVaultModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal" style={{maxWidth:500}}>
            <div className="modal-head">
              <h3>إضافة من خزنة المستندات</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowVaultModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              {vaultDocs.length === 0 && <div style={{textAlign:'center',padding:20,color:'var(--slate-light)'}}>الخزنة فارغة</div>}
              {vaultDocs.map((vd: any) => (
                <div key={vd.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 4px',borderBottom:'1px solid var(--line)'}}>
                  <div style={{fontWeight:600,fontSize:13,flex:1}}>{vd.name}</div>
                  <button className="btn btn-ghost sm" style={{padding:'4px 10px',fontSize:11}} onClick={async () => {
                    try {
                      await api.post(`/interns/${id}/vault-attach`, { vault_name: vd.name, doc_type: 'OTHER' });
                      toast.success('تمت إضافة المستند من الخزنة');
                      setShowVaultModal(false);
                      fetchDocsLifecycle();
                    } catch (err) {
                      toast.error('فشلت الإضافة من الخزنة');
                    }
                  }}>
                    إضافة للمتدرب
                  </button>
                </div>
              ))}
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowVaultModal(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
