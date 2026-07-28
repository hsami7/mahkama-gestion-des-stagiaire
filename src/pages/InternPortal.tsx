import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, CheckCircle, DownloadSimple, HandWaving, Confetti, Warning, UploadSimple, Eye, FileText, ArrowsClockwise, ClipboardText, Trash } from '@phosphor-icons/react';
import { api, API_BASE } from '../services/api';
import { handleViewFile, handleDownloadFile } from '../utils/documentUtils';
import { InternSidebar } from '../components/InternSidebar';
import { Header } from '../components/Header';
import '../InternPortal.css';

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

function sanitizeTitle(t: string): string {
  return t.replace(/\.pdf\.?$/i, '').trim();
}

export function InternPortal() {
  const [activeTab, setActiveTab] = useState('status');
  const [bellOpen, setBellOpen] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | string | null>(null);
  const [internData, setInternData] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<{ msg: string, type: string } | null>(null);
  const [lifecycleDocs, setLifecycleDocs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showInternUploadModal, setShowInternUploadModal] = useState(false);
  const [internUploadTitle, setInternUploadTitle] = useState('');
  const [internUploadFile, setInternUploadFile] = useState<File | null>(null);
  const [internUploadActionTypes, setInternUploadActionTypes] = useState<Set<string>>(new Set(['view']));
  const [docFilter, setDocFilter] = useState('all');

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const seenRequests = useRef<Set<number>>(new Set());

  const fetchRequests = async (notifyNew: boolean = false) => {
    try {
      const data = await api.get('/intern/requests');
      if (notifyNew) {
        data.forEach((r: any) => {
          if (!seenRequests.current.has(r.id)) {
            seenRequests.current.add(r.id);
            const docName = r.custom_title || r.document_type;
            showToast(`طلب إعادة رفع مستند: ${docName}${r.note ? ' — ' + r.note : ''}`, 'warning');
          }
        });
      } else {
        data.forEach((r: any) => seenRequests.current.add(r.id));
      }
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAndRedirect = () => {
    sessionStorage.clear();
    window.location.href = '/';
  };

  const fetchProfile = async () => {
    try {
      const data = await api.get('/intern/profile');
      setInternData(data);
    } catch (err: any) {
      if (err?.status === 404 || err?.status === 403) handleLogoutAndRedirect();
      else console.error(err);
    }
  };

  const fetchLifecycleDocs = async () => {
    try {
      const data = await api.getMyDocuments();
      setLifecycleDocs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchProfile();
    fetchLifecycleDocs();
    api.get('/notifications').then(setNotifications).catch(() => { });
  }, []);

  // Poll for newly created document requests and notify the intern
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests(true);
      fetchLifecycleDocs();
      api.get('/notifications').then(setNotifications).catch(() => { });
    }, 10000);
    return () => clearInterval(interval);
  }, [internData?.id]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  };

  const showToast = (msg: string, type: string = 'info') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 2600);
  };

  const handleUpload = async (requestId: number, file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      showToast('حجم الملف يجب أن لا يتجاوز 15 ميجابايت', 'error');
      return;
    }

    setUploading(requestId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/intern/requests/${requestId}/upload`, formData);
      showToast('تم رفع المستند بنجاح!', 'success');
      fetchRequests();
      fetchProfile();
    } catch (err: any) {
      showToast(err?.message || 'حدث خطأ أثناء الرفع', 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleProactiveUpload = async (docId: number, docType: string, file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      showToast('حجم الملف يجب أن لا يتجاوز 15 ميجابايت', 'error');
      return;
    }

    setUploading(docId);

    try {
      await api.uploadInternDocument(internData?.id, docType, file, docId);
      showToast('تم رفع المستند بنجاح!', 'success');
      fetchLifecycleDocs();
      fetchProfile();
      fetchRequests();
    } catch (err: any) {
      showToast(err?.message || 'حدث خطأ أثناء الرفع', 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleSignFillUpload = async (docId: number, file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      showToast('حجم الملف يجب أن لا يتجاوز 15 ميجابايت', 'error');
      return;
    }
    setUploading(docId);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/interns/${internData?.id}/documents/${docId}/return-upload`, formData);
      showToast('تم إرجاع النسخة بنجاح!', 'success');
      fetchLifecycleDocs();
    } catch (err: any) {
      showToast(err?.message || 'حدث خطأ أثناء الرفع', 'error');
    } finally {
      setUploading(null);
    }
  };

  const totalRequests = requests.length;

  // Returns true if the document for a given request is already uploaded.
  const isRequestUploaded = (r: any): boolean => {
    if (r.document_type === 'other') {
      return lifecycleDocs.some(d => d.custom_title === r.custom_title && d.file_path && d.status !== 'MISSING');
    }
    return lifecycleDocs.some(d => d.doc_type === r.document_type && d.file_path && d.status !== 'MISSING');
  };

  // A request is only "actionable" (still nagging) if its document is not yet uploaded.
  const missingCount = useMemo(() => {
    const reqs = requests.filter((r: any) => !isRequestUploaded(r)).length;
    const templateDocs = lifecycleDocs.filter(d => d.status === 'MISSING' && d.action_type === 'view' && d.source === 'TEMPLATE_VIEW').length;
    return reqs + templateDocs;
  }, [requests, lifecycleDocs]);

  // Pending re-upload requests + sign/fill docs that need attention + revision-requested docs
  const pendingCount = useMemo(() => {
    const reqs = requests.filter((r: any) => !isRequestUploaded(r)).length;
    const signFill = lifecycleDocs.filter(d => d.requested_by !== 'INTERN' && (d.action_type === 'sign' || d.action_type === 'fill' || d.action_type === 'sign_fill') && !d.returned_file_path).length;
    const awaitingIntern = lifecycleDocs.filter(d => d.requested_by === 'INTERN' && d.status === 'AWAITING_INTERN' && d.returned_file_path).length;
    const revisionReqs = lifecycleDocs.filter(d => d.status === 'REVISION_REQUESTED' && d.rejection_reason).length;
    const missingTemplateDocs = lifecycleDocs.filter(d => d.status === 'MISSING' && d.action_type === 'view' && d.source === 'TEMPLATE_VIEW').length;
    return reqs + signFill + awaitingIntern + revisionReqs + missingTemplateDocs;
  }, [requests, lifecycleDocs]);

  // Count of sign/fill lifecycle docs that need the intern's return
  const signFillCount = useMemo(() => lifecycleDocs.filter(d => d.requested_by !== 'INTERN' && (d.action_type === 'sign' || d.action_type === 'fill' || d.action_type === 'sign_fill') && !d.returned_file_path).length, [lifecycleDocs]);

  // Count of revision-requested docs (for main page alert)
  const revisionCount = useMemo(() => lifecycleDocs.filter(d => d.status === 'REVISION_REQUESTED' && d.rejection_reason).length, [lifecycleDocs]);

  const missingTemplateDocs = useMemo(() => lifecycleDocs.filter(d => d.status === 'MISSING' && d.action_type === 'view' && d.source === 'TEMPLATE_VIEW'), [lifecycleDocs]);

  const virtualNotifications = useMemo(() => {
    const virtual: any[] = missingTemplateDocs.map(d => ({
      id: -d.id, title: 'مستند مطلوب',
      body: `يرجى رفع "${d.custom_title || d.label}"`,
      is_read: false, created_at: null, type: 'TEMPLATE'
    }));
    return [...virtual, ...notifications];
  }, [missingTemplateDocs, notifications]);

  // Orange/yellow palette for request notifications
  const REQ_BG = '#FFF6E5';
  const REQ_FG = '#9A6B00';
  const REQ_BORDER = '#F2D49B';
  const REQ_DOT = '#F4B400';

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'status': return 'حالة الطلب';
      case 'documents': return 'المستندات';
      case 'profile': return 'ملفي الشخصي';
      default: return 'بوابة المتدرب';
    }
  };

  return (
    <div className="app-container">
      <InternSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        internData={internData}
        user={user}
        missingCount={missingCount}
        pendingCount={pendingCount}
        reqDotColor={REQ_DOT}
        onLogout={handleLogout}
      />
      <div className="main">
        <Header title={getPageTitle(activeTab)} missingCount={missingCount} notifications={virtualNotifications} onReadNotification={async (id) => {
          if (typeof id === 'number' && id < 0) return;
          try {
            await api.post(`/intern/notifications/${id}/read`, {});
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
          } catch { }
        }} onNotificationClick={() => setActiveTab('documents')} />

        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: 'var(--paper)' }}>
          {/* STATUS */}
          <div className={`view ${activeTab === 'status' ? 'on' : ''} p-wrap`}>
            <div className="welcome-row">
              <div className="welcome-photo">
                {internData?.photo_path ? <img src={internData.photo_path} alt="avatar" /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%', padding: '15%', color: 'var(--slate)' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
              </div>
              <div><h2>مرحبًا، {internData?.name || user?.name} <HandWaving size={22} weight="fill" style={{ display: 'inline' }} /></h2><p>{internData?.email || user?.email}</p></div>
            </div>

            {/* PENDING STATE */}
            {(!internData?.status || internData?.status === 'قيد المراجعة') && (
              <div className="state-block on">
                {pendingCount > 0 && (
                  <div className="alert req" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '16px 18px', borderRadius: '12px', marginBottom: 18, fontSize: '13.5px', fontWeight: 700, background: REQ_BG, color: REQ_FG, border: `1px solid ${REQ_BORDER}` }}>
                    <svg className="icon" viewBox="0 0 24 24" style={{ stroke: REQ_FG, width: 24, height: 24, flexShrink: 0, marginTop: 2 }}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                    <div>
                      لديك {pendingCount} طلب لإعادة رفع مستند من الإدارة — <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setActiveTab('documents')}>عرض الطلبات</span>
                      <ul style={{ margin: '8px 0 0', paddingRight: 18, fontWeight: 500, fontSize: 12.5, lineHeight: 1.9 }}>
                        {requests.filter((r: any) => !isRequestUploaded(r)).map((r: any) => (
                          <li key={r.id}>{r.custom_title || r.document_type}{r.note ? ` — ${r.note}` : ''}</li>
                        ))}
                        {lifecycleDocs.filter(d => d.status === 'REVISION_REQUESTED' && d.rejection_reason).map(d => (
                          <li key={d.id}>{d.custom_title || d.doc_type} — {d.rejection_reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="card" style={{ marginBottom: 18, padding: 24 }}>
                  <div className="intern-stepper" style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="intern-step done" style={{ flex: 1, textAlign: 'center', position: 'relative' }}><div className="sc" style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', position: 'relative', zIndex: 2 }}><CheckCircle weight="fill" size={18} /></div><small style={{ display: 'block', color: 'var(--slate)' }}>إنشاء الحساب</small></div>
                    <div className={`intern-step ${missingCount > 0 ? 'active' : 'done'}`} style={{ flex: 1, textAlign: 'center', position: 'relative' }}><div className="sc" style={{ width: 34, height: 34, borderRadius: '50%', background: missingCount > 0 ? 'var(--gold)' : 'var(--success)', color: missingCount > 0 ? '#2A2005' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', position: 'relative', zIndex: 2, boxShadow: missingCount > 0 ? '0 0 0 5px rgba(201,162,39,.18)' : 'none' }}>{missingCount > 0 ? '2' : <CheckCircle weight="fill" size={18} />}</div><small style={{ display: 'block', color: 'var(--slate)' }}>رفع المستندات</small></div>
                    <div className={`intern-step ${missingCount === 0 ? 'active' : ''}`} style={{ flex: 1, textAlign: 'center', position: 'relative' }}><div className="sc" style={{ width: 34, height: 34, borderRadius: '50%', background: missingCount === 0 ? 'var(--gold)' : 'var(--paper)', border: missingCount === 0 ? 'none' : '2px solid var(--line)', color: missingCount === 0 ? '#2A2005' : 'var(--slate-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', position: 'relative', zIndex: 2, boxShadow: missingCount === 0 ? '0 0 0 5px rgba(201,162,39,.18)' : 'none' }}>3</div><small style={{ display: 'block', color: 'var(--slate)' }}>المراجعة والقبول</small></div>
                  </div>
                </div>

                {/* Required documents list — pending state */}
                <div className="card" style={{ padding: 24, marginBottom: 18, borderTop: '3px solid var(--brand, #9B8B6B)' }}>
                  <div style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 15, margin: 0, color: 'var(--brand, #9B8B6B)' }}>الوثائق المطلوبة</h3>
                    <p style={{ fontSize: 12.5, color: 'var(--slate)', margin: '2px 0 0' }}>يرجى تجهيز المستندات التالية لاستكمال إجراءات التسجيل</p>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 2.2, paddingRight: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>- طلب من المؤسسة (حامل توقيع وصفة المسؤول)</span>
                      <span style={{ fontWeight: 600, color: 'var(--slate)' }}>Demande de Stage (Ecole) -</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>- نسخة من الشهادة أو الدبلوم المحصل عليه</span>
                      <span style={{ fontWeight: 600, color: 'var(--slate)' }}>Copie de l'Attestation du Diplôme obtenu -</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>- طلب خطي (تحديد فترة التدريب)</span>
                      <span style={{ fontWeight: 600, color: 'var(--slate)' }}>Demande Manuscrite -</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>- السيرة الذاتية</span>
                      <span style={{ fontWeight: 600, color: 'var(--slate)' }}>Curriculum Vitae (C. V.) -</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>- شهادة التأمين على الأخطار</span>
                      <span style={{ fontWeight: 600, color: 'var(--slate)' }}>Attestation d'Assurance -</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>- نسخة من البطاقة الوطنية للتعريف / الإقامة</span>
                      <span style={{ fontWeight: 600, color: 'var(--slate)' }}>Copie de N.I.C / Séjour -</span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 24 }}>
                  <div className="section-title"><h3>آخر التحديثات</h3></div>
                  <div className="timeline">
                    <div className="tl-item" style={{ display: 'flex', gap: 14, paddingBottom: 20, position: 'relative' }}>
                      <div className="tl-dot" style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, background: 'var(--success-bg)', color: 'var(--success)' }}><svg className="icon" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}><path d="M20 6L9 17l-5-5" /></svg></div>
                      <div className="tl-body"><b style={{ fontSize: 13, display: 'block' }}>تم إنشاء الحساب بنجاح</b><span style={{ fontSize: 11.5, color: 'var(--slate-light)' }}>مرحباً بك</span></div>
                    </div>
                    <div className="tl-item" style={{ display: 'flex', gap: 14, position: 'relative' }}>
                      <div className="tl-dot" style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, background: 'var(--warning-bg)', color: 'var(--warning)' }}><svg className="icon" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg></div>
                      <div className="tl-body"><b style={{ fontSize: 13, display: 'block' }}>طلبك الآن قيد المراجعة</b><span style={{ fontSize: 11.5, color: 'var(--slate-light)' }}>بانتظار الإدارة</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACCEPTED STATE */}
            {internData?.status === 'نشط' && (
              <div className="state-block on">
                <div className="hero-accept" style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '30px 28px', marginBottom: 20, color: '#fff', background: 'linear-gradient(120deg, #1E5631 0%, #2F9E44 100%)' }}>
                  <div className="hcontent" style={{ position: 'relative' }}>
                    <div className="htag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.18)', padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, marginBottom: 14 }}><Confetti size={14} weight="fill" /> مبروك</div>
                    <h2 style={{ fontSize: 23, margin: '0 0 6px' }}>تم قبولك رسميًا في برنامج التدريب!</h2>
                    <p style={{ margin: 0, fontSize: 13.5, color: '#DCF3E1', maxWidth: 520, lineHeight: 1.8 }}>يسعدنا إخبارك بأن طلبك قد لقي القبول. ستجد أدناه كل ما تحتاجه للاستعداد ليوم انطلاقك الأول.</p>
                  </div>
                </div>

                {/* Pending actions alert for active interns */}
                {signFillCount > 0 && (
                  <div className="alert req" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '16px 18px', borderRadius: '12px', marginBottom: 18, fontSize: '13.5px', fontWeight: 700, background: REQ_BG, color: REQ_FG, border: `1px solid ${REQ_BORDER}` }}>
                    <Warning size={22} color={REQ_FG} weight="fill" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      لديك {signFillCount} مستند{signFillCount > 1 ? 'ات' : ''} تتطلب التوقيع أو التعبئة من الإدارة — <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setActiveTab('documents')}>عرض المستندات</span>
                    </div>
                  </div>
                )}

                <div className="card" style={{ marginBottom: 18, padding: 24 }}>
                  <div className="intern-stepper" style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="intern-step done" style={{ flex: 1, textAlign: 'center', position: 'relative' }}><div className="sc" style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', position: 'relative', zIndex: 2 }}><CheckCircle weight="fill" size={18} /></div><small style={{ display: 'block', color: 'var(--slate)' }}>الإرسال</small></div>
                    <div className="intern-step done" style={{ flex: 1, textAlign: 'center', position: 'relative' }}><div className="sc" style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', position: 'relative', zIndex: 2 }}><CheckCircle weight="fill" size={18} /></div><small style={{ display: 'block', color: 'var(--slate)' }}>المراجعة</small></div>
                    <div className="intern-step done" style={{ flex: 1, textAlign: 'center', position: 'relative' }}><div className="sc" style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', position: 'relative', zIndex: 2 }}><CheckCircle weight="fill" size={18} /></div><small style={{ display: 'block', color: 'var(--slate)' }}>القبول</small></div>
                    <div className="intern-step active" style={{ flex: 1, textAlign: 'center', position: 'relative' }}><div className="sc" style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gold)', color: '#2A2005', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', position: 'relative', zIndex: 2, boxShadow: '0 0 0 5px rgba(201,162,39,.18)' }}>4</div><small style={{ display: 'block', color: 'var(--slate)' }}>بدء التدريب</small></div>
                  </div>
                </div>

                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="card mini-card" style={{ padding: '18px 20px' }}>
                    <div className="mc-top" style={{ marginBottom: 10, display: 'flex' }}><div className="mi" style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--success-bg)', color: 'var(--success)' }}><svg className="icon" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg></div></div>
                    <b style={{ fontSize: 13.5, display: 'block' }}>تاريخ الانطلاق</b><span style={{ fontSize: 12, color: 'var(--slate)' }}>{formatDate(internData?.start_date)}</span>
                  </div>
                  <div className="card mini-card" style={{ padding: '18px 20px' }}>
                    <div className="mc-top" style={{ marginBottom: 10, display: 'flex' }}><div className="mi" style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EAF0FF', color: '#2A4FCB' }}><svg className="icon" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg></div></div>
                    <b style={{ fontSize: 13.5, display: 'block' }}>المشرف المباشر</b><span style={{ fontSize: 12, color: 'var(--slate)' }}>{internData?.encadrant || 'لم يتم التعيين بعد'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* REJECTED STATE */}
            {internData?.status === 'مرفوض' && (
              <div className="state-block on">
                <div className="hero-reject" style={{ borderRadius: 16, padding: '30px 28px', marginBottom: 20, background: 'var(--ink)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                  <div className="hcontent" style={{ position: 'relative' }}>
                    <div className="htag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.1)', padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, marginBottom: 14, color: '#C9D2E3' }}>نتيجة الطلب</div>
                    <h2 style={{ fontSize: 21, margin: '0 0 8px' }}>نشكرك على اهتمامك ببرنامج التدريب لدينا</h2>
                    <p style={{ margin: 0, fontSize: 13.5, color: '#B7C0D6', maxWidth: 540, lineHeight: 1.9 }}>بعد دراسة متأنية لملفك، نأسف لإبلاغك بأننا لن نتمكن من المضي قدمًا في طلبك لهذه الدورة التدريبية. هذا لا يعكس بالضرورة مؤهلاتك، وإنما محدودية الشواغر المتاحة في هذه الفترة.</p>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 16, padding: 24 }}>
                  <div className="section-title"><h3>تفاصيل القرار</h3></div>
                  <div style={{ borderRight: '3px solid var(--slate-light)', paddingRight: 14, marginBottom: 18 }}>
                    <div style={{ fontSize: 11.5, color: 'var(--slate-light)', marginBottom: 4 }}>السبب المُشار إليه من قِبل اللجنة</div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.8 }}>اكتمال العدد المتاح من المقاعد في القسم المطلوب لهذه الدورة. نشجعك على التقديم مجددًا في الدورة القادمة.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DOCUMENTS — unified view */}
          <div className={`view ${activeTab === 'documents' ? 'on' : ''} p-wrap`}>
            {internData?.status === 'مرفوض' ? (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--slate)', fontSize: 14 }}>
                المستندات غير متاحة حاليًا. تم رفض طلبك.
              </div>
            ) : (<>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 17 }}><FileText weight="bold" style={{ display: 'inline', marginLeft: 6 }} /> مركز المستندات</h3>
                </div>

                {/* Required docs list */}
                <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--paper)', borderRadius: 8, border: '1px solid var(--line)', fontSize: 12.5, lineHeight: 2 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>الوثائق المطلوبة</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>- طلب من المؤسسة (حامل توقيع وصفة المسؤول)</span>
                    <span style={{ color: 'var(--slate)' }}>Demande de Stage (Ecole) -</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>- نسخة من الشهادة أو الدبلوم المحصل عليه</span>
                    <span style={{ color: 'var(--slate)' }}>Copie de l'Attestation du Diplôme obtenu -</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>- طلب خطي (تحديد فترة التدريب)</span>
                    <span style={{ color: 'var(--slate)' }}>Demande Manuscrite -</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>- السيرة الذاتية</span>
                    <span style={{ color: 'var(--slate)' }}>Curriculum Vitae (C. V.) -</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>- شهادة التأمين على الأخطار</span>
                    <span style={{ color: 'var(--slate)' }}>Attestation d'Assurance -</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>- نسخة من البطاقة الوطنية للتعريف / الإقامة</span>
                    <span style={{ color: 'var(--slate)' }}>Copie de N.I.C / Séjour -</span>
                  </div>
                </div>

                {/* Filter tabs */}
                {(() => {
                  const allDocs = lifecycleDocs;
                  const pendingDocs = lifecycleDocs.filter(d => d.status !== 'APPROVED_AND_SIGNED');
                  const completedDocs = lifecycleDocs.filter(d => d.status === 'APPROVED_AND_SIGNED');
                  const fromAdminDocs = lifecycleDocs.filter(d => d.requested_by === 'INTERN' && ['sign','fill','sign_fill'].includes(d.action_type));
                  const counts = { all: allDocs.length, pending: pendingDocs.length, completed: completedDocs.length, from_admin: fromAdminDocs.length };
                  const tabs = ['all', 'pending', 'completed', 'from_admin'] as const;
                  const labels = { all: 'الكل', pending: 'تحت الإجراء', completed: 'مكتمل', from_admin: 'من الإدارة' };
                  const filtered = lifecycleDocs.filter(d => {
                    if (docFilter === 'pending') return d.status !== 'APPROVED_AND_SIGNED';
                    if (docFilter === 'completed') return d.status === 'APPROVED_AND_SIGNED';
                    if (docFilter === 'from_admin') return d.requested_by === 'INTERN' && ['sign','fill','sign_fill'].includes(d.action_type);
                    return true;
                  }).sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
                  return (
                    <>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {tabs.map(tab => (
                          <button key={tab} onClick={() => setDocFilter(tab)} style={{
                            padding: '6px 14px', borderRadius: 20, border: '1px solid var(--line)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            background: docFilter === tab ? 'var(--ink)' : 'transparent',
                            color: docFilter === tab ? '#fff' : 'var(--slate)',
                            display: 'flex', alignItems: 'center', gap: 6
                          }}>
                            {labels[tab]}
                            {counts[tab] > 0 && <span style={{ fontSize: 10, background: docFilter === tab ? 'rgba(255,255,255,.2)' : 'var(--paper)', borderRadius: 10, padding: '1px 7px' }}>{counts[tab]}</span>}
                          </button>
                        ))}
                        </div>
                        <button className="btn btn-gold sm" onClick={() => { setInternUploadTitle(''); setInternUploadFile(null); setInternUploadActionTypes(new Set(['view'])); setShowInternUploadModal(true); }} style={{ fontSize: 12, padding: '8px 16px' }}>
                          <UploadSimple size={14} /> إضافة ملف
                        </button>
                      </div>

                      {/* Pending actions banner */}
                      {signFillCount > 0 && (
                        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: REQ_BG, border: `1px solid ${REQ_BORDER}`, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, fontWeight: 600, color: REQ_FG }}>
                          <Warning size={18} color={REQ_FG} weight="fill" style={{ flexShrink: 0 }} />
                          <span>لديك <strong>{signFillCount}</strong> مستند{signFillCount > 1 ? 'ات' : ''} تتطلب توقيعك أو تعبئتك</span>
                        </div>
                      )}

                      {/* Unified table */}
                      {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--slate-light)', fontSize: 13, background: 'var(--paper)', borderRadius: 8 }}>
                          {docFilter === 'pending' ? 'لا توجد مستندات قيد الإجراء' : docFilter === 'completed' ? 'لا توجد مستندات مكتملة' : docFilter === 'from_admin' ? 'لا توجد طلبات من الإدارة' : 'لا توجد مستندات'}
                        </div>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--line)' }}>
                              <th style={{ textAlign: 'right', padding: '8px 8px', color: 'var(--slate-light)', fontWeight: 600 }}>المستند</th>
                              <th style={{ textAlign: 'center', padding: '8px 8px', color: 'var(--slate-light)', fontWeight: 600 }}>الحالة</th>
                              <th style={{ textAlign: 'center', padding: '8px 8px', color: 'var(--slate-light)', fontWeight: 600 }}>تاريخ</th>
                              <th style={{ textAlign: 'left', padding: '8px 8px', color: 'var(--slate-light)', fontWeight: 600 }}>إجراء</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const rows: any[] = [];
                              const grouped = new Map<string, any[]>();
                              filtered.forEach(d => {
                                const base = (d.custom_title || d.doc_type || '').replace(/\s*\(.*?\)\s*$/, '');
                                if (!grouped.has(base)) grouped.set(base, []);
                                grouped.get(base)!.push(d);
                              });
for (const [base, docs] of grouped) {
                                const sign = docs.find(d => d.action_type === 'sign');
                                const fill = docs.find(d => d.action_type === 'fill');
                                const both = docs.find(d => d.action_type === 'sign_fill');
                                if (sign && fill) {
                                  rows.push({ id: `combined-${base}`, isCombined: true, sign, fill, base });
                                  // Also include any other docs in this group (e.g., view-only)
                                  docs.forEach(d => {
                                    if (d !== sign && d !== fill) rows.push(d);
                                  });
                                } else if (both) {
                                  // sign_fill is a single combined action - treat as combined row
                                  rows.push({ id: `combined-${base}`, isCombined: true, sign: both, fill: both, base, isSignFill: true });
                                  // Also include any other docs in this group (e.g., view-only, standalone sign/fill)
                                  docs.forEach(d => {
                                    if (d !== both) rows.push(d);
                                  });
                                } else {
                                  docs.forEach(d => rows.push(d));
                                }
                              }
                              return rows.map(row => {
                                if (row.isCombined) {
                                  const d = row.sign;
                                  const fillDoc = row.fill;
                                  const bothReturned = d.returned_file_path && fillDoc.returned_file_path;
                                  const anyReturned = d.returned_file_path || fillDoc.returned_file_path;
                                  const inputId = `return-upload-${d.id}`;
                                  // Use whichever doc has a file_path for view/download
                                  const fileDoc = d.file_path ? d : fillDoc.file_path ? fillDoc : null;
                                  const fileLabel = (d.custom_title || d.doc_type || row.base);
                                  const isSignFillRow = !!row.isSignFill;
                                  // Determine status based on document statuses
                                  let statusLabel = 'بانتظار الرفع';
                                  let statusClass = 'badge-warning';
                                  if (d.status === 'APPROVED_AND_SIGNED' && fillDoc.status === 'APPROVED_AND_SIGNED') {
                                    statusLabel = 'مكتمل';
                                    statusClass = 'badge-success';
                                  } else if (d.status === 'RETURNED' || fillDoc.status === 'RETURNED') {
                                    statusLabel = 'بانتظار المراجعة';
                                    statusClass = 'badge-warning';
                                  } else if (d.status === 'AWAITING_RETURN' && fillDoc.status === 'AWAITING_RETURN') {
                                    statusLabel = 'بانتظار التوقيع والتعبئة';
                                    statusClass = 'badge-warning';
                                  } else if (d.status === 'AWAITING_RETURN' || fillDoc.status === 'AWAITING_RETURN') {
                                    statusLabel = 'بانتظار الإجراء';
                                    statusClass = 'badge-warning';
                                  } else if (d.status === 'PENDING_REVIEW' || fillDoc.status === 'PENDING_REVIEW') {
                                    statusLabel = 'قيد المراجعة';
                                    statusClass = 'badge-warning';
                                  }
                                  return (
                                    <tr key={row.id} style={{ borderBottom: '1px solid var(--line)' }}>
                                      <td style={{ padding: '10px 8px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--ink)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.base}>
                                          {row.base}
                                          {row.isSignFill ? <span style={{ fontSize: 10, color: 'var(--slate-light)', marginRight: 6 }}>({d.action_type === 'sign_fill' ? 'توقيع وتعبئة' : 'توقيع وتعبئة'})</span> : <span style={{ fontSize: 10, color: 'var(--slate-light)', marginRight: 6 }}>(توقيع) و (تعبئة وإرجاع)</span>}
                                        </div>
                                      </td>
                                      <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                                        <span className={`badge ${statusClass}`} style={{ fontSize: 11 }}>{statusLabel}</span>
                                      </td>
                                      <td style={{ textAlign: 'center', padding: '10px 8px', color: 'var(--slate)', fontSize: 11 }}>
                                        {fileDoc ? formatDate(fileDoc.updated_at || fileDoc.created_at) : '—'}
                                      </td>
                                      <td style={{ textAlign: 'left', padding: '10px 8px' }}>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                          {/* View latest document */}
                                          <button className="btn btn-ghost sm" title={fileDoc ? "معاينة" : "لا يوجد ملف مرفق من الإدارة"} disabled={!fileDoc} onClick={() => fileDoc && handleViewFile(api.downloadDocument(fileDoc.id) + (anyReturned ? '&returned=1' : ''), fileLabel + '.pdf')} style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: fileDoc ? 1 : 0.3 }}>
                                            <Eye size={14} />
                                          </button>
                                          {/* Download latest document */}
                                          <button className="btn btn-ghost sm" title={fileDoc ? "تحميل" : "لا يوجد ملف مرفق من الإدارة"} disabled={!fileDoc} onClick={() => fileDoc && handleDownloadFile(api.downloadDocument(fileDoc.id) + (anyReturned ? '&returned=1' : ''), fileLabel + '.pdf')} style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: fileDoc ? 1 : 0.3 }}>
                                            <DownloadSimple size={14} />
                                          </button>
                                          {/* Upload return if not approved and not both returned */}
                                          {d.status !== 'APPROVED_AND_SIGNED' && fillDoc.status !== 'APPROVED_AND_SIGNED' && !bothReturned && (
                                            <>
                                              <input type="file" id={inputId} style={{ display: 'none' }} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={e => {
                                                if (!e.target.files?.[0]) return;
                                                const file = e.target.files[0];
                                                [d, fillDoc].forEach(doc => {
                                                  const fd = new FormData();
                                                  fd.append('file', file);
                                                  api.post(`/interns/${internData?.id}/documents/${doc.id}/return-upload`, fd);
                                                });
                                                showToast('تم استلام النسخة المعبأة', 'success');
                                                setTimeout(() => fetchLifecycleDocs(), 500);
                                              }} />
                                              <button className="btn btn-ink sm" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => document.getElementById(inputId)?.click()}>
                                                <UploadSimple size={14} /> رفع
                                              </button>
                                            </>
                                          )}
                                          {/* Greyed upload if already returned but not yet approved */}
                                          {d.status !== 'APPROVED_AND_SIGNED' && fillDoc.status !== 'APPROVED_AND_SIGNED' && bothReturned && (
                                            <button className="btn btn-ink sm" style={{ padding: '4px 8px', fontSize: 11, opacity: 0.4, cursor: 'not-allowed' }} disabled>
                                              <UploadSimple size={14} /> رفع
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }
                                const d = row;
                                const isSignFill = d.action_type === 'sign' || d.action_type === 'fill' || d.action_type === 'sign_fill';
                                const isView = d.action_type === 'view';
                                const isReturned = !!d.returned_file_path;
                                const inputId2 = `doc-upload-${d.id}`;
                                const fileLabel = d.custom_title || d.doc_type || 'document';
                                
                                // Status label based on action_type and status
                                const getStatusLabel = () => {
                                  if (d.status === 'APPROVED_AND_SIGNED') return 'مقبول';
                                  if (d.status === 'REVISION_REQUESTED') return 'مطلوب إعادة';
                                  if (d.status === 'RETURNED') return 'تم الإرجاع';
                                  if (d.status === 'AWAITING_ADMIN') return 'بانتظار الإدارة';
                                  if (d.status === 'AWAITING_INTERN') return 'في انتظار قبولك';
                                  if (d.status === 'PENDING_REVIEW') return 'قيد المراجعة';
                                  if (d.status === 'AWAITING_RETURN') {
                                    if (d.action_type === 'sign') return 'بانتظار التوقيع';
                                    if (d.action_type === 'fill') return 'بانتظار التعبئة';
                                    return 'بانتظار التوقيع والتعبئة';
                                  }
                                  if (d.status === 'MISSING') {
                                    if (d.file_path) return 'قيد المراجعة';
                                    return 'بانتظار الرفع';
                                  }
                                  return d.status || '—';
                                };
                                
                                const statusLabel = getStatusLabel();
                                
                                const statusClass = d.status === 'APPROVED_AND_SIGNED' ? 'badge-success' :
                                  d.status === 'RETURNED' ? 'badge-success' :
                                    d.status === 'PENDING_REVIEW' ? 'badge-warning' :
                                      d.status === 'AWAITING_INTERN' ? 'badge-warning' :
                                        d.status === 'AWAITING_ADMIN' ? 'badge-warning' :
                                          d.status === 'REVISION_REQUESTED' ? 'badge-danger' :
                                            d.status === 'AWAITING_RETURN' ? 'badge-warning' : '';
                                
                                const isTemplate = d.source === 'TEMPLATE_VIEW';
                                const isTemplatePendingAdmin = isTemplate && d.status === 'PENDING_REVIEW' && d.uploaded_by === 'ADMIN';
                                const isTemplatePendingIntern = isTemplate && d.status === 'PENDING_REVIEW' && d.uploaded_by === 'INTERN';
                                const isInternInitiatedSignFill = d.requested_by === 'INTERN' && (d.action_type === 'sign' || d.action_type === 'fill' || d.action_type === 'sign_fill');
                                const showViewDownload = !!d.file_path && !isTemplatePendingAdmin;
                                const canUpload = !isInternInitiatedSignFill && ((!isView && !isReturned) || (d.status === 'REVISION_REQUESTED') || (d.status === 'MISSING' && !d.file_path) || isTemplatePendingAdmin);
                                const isUploadDisabled = isTemplatePendingIntern;
                                return (
                                  <tr key={d.id} style={{ borderBottom: '1px solid var(--line)' }}>
                                    <td style={{ padding: '10px 8px' }}>
                                      <div style={{ fontWeight: 600, color: 'var(--ink)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fileLabel}>
                                        {fileLabel}
                                        {(() => {
                                          const isTemplate = d.source === 'TEMPLATE_VIEW';
                                          if (isTemplate) return <span style={{ fontSize: 10, color: 'var(--slate-light)', marginRight: 6 }}>(مستند مطلوب)</span>;
                                          const badgeMap: any = {
                                            'view': 'عرض فقط',
                                            'sign': 'توقيع',
                                            'fill': 'تعبئة وإرجاع',
                                            'sign_fill': 'توقيع وتعبئة',
                                          };
                                          const label = badgeMap[d.action_type];
                                          return label ? <span style={{ fontSize: 10, color: 'var(--slate-light)', marginRight: 6 }}>({label})</span> : null;
                                        })()}
                                      </div>
                                      {d.rejection_reason && d.status === 'REVISION_REQUESTED' && (
                                        <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2, background: '#FFF0EE', padding: '3px 6px', borderRadius: 4 }}>
                                          <Warning size={12} weight="fill" style={{ marginLeft: 4 }} /> {d.rejection_reason}
                                        </div>
                                      )}
                                      {isInternInitiatedSignFill && d.status === 'AWAITING_ADMIN' && (
                                        <div style={{ fontSize: 11, color: '#B45309', marginTop: 2, background: '#FEF3C7', padding: '3px 6px', borderRadius: 4 }}>
                                          في انتظار رفع الإدارة للنسخة الموقعة/المعبأة
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                                      <span className={`badge ${statusClass}`} style={{ fontSize: 11, background: !statusClass && d.status !== 'APPROVED_AND_SIGNED' ? 'var(--paper)' : undefined, color: !statusClass && d.status !== 'APPROVED_AND_SIGNED' ? 'var(--slate)' : undefined }}>{statusLabel}</span>
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '10px 8px', color: 'var(--slate)', fontSize: 11 }}>
                                      {d.file_path || d.returned_file_path ? formatDate(d.updated_at || d.created_at) : '—'}
                                    </td>
                                    <td style={{ textAlign: 'left', padding: '10px 8px' }}>
                                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                      {d.status === 'AWAITING_INTERN' && d.returned_file_path ? (
                                        <>
                                          <button className="btn btn-ghost sm" title="معاينة" onClick={() => handleViewFile(api.downloadDocument(d.id) + '&returned=1', fileLabel + '.' + (d.file_type || 'pdf'))} style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Eye size={14} />
                                          </button>
                                          <button className="btn btn-ghost sm" title="تحميل" onClick={() => handleDownloadFile(api.downloadDocument(d.id) + '&returned=1', fileLabel + '.' + (d.file_type || 'pdf'))} style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <DownloadSimple size={14} />
                                          </button>
                                          <button className="btn btn-ghost sm" title="قبول" onClick={async () => {
                                            try {
                                              await api.post(`/interns/${internData?.id}/documents/${d.id}/intern-accept`, {});
                                              fetchLifecycleDocs();
                                              showToast('تم قبول المستند', 'success');
                                            } catch { showToast('فشل قبول المستند', 'error'); }
                                          }} style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                                            <CheckCircle size={14} />
                                          </button>
                                          <button className="btn btn-ghost sm" title="طلب إعادة رفع" onClick={async () => {
                                            const reason = window.prompt('سبب طلب إعادة الرفع:');
                                            if (reason === null) return;
                                            try {
                                              await api.post(`/interns/${internData?.id}/documents/${d.id}/intern-request-revision`, { reason });
                                              fetchLifecycleDocs();
                                              showToast('تم طلب إعادة الرفع', 'success');
                                            } catch { showToast('فشل إرسال الطلب', 'error'); }
                                          }} style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-dark)' }}>
                                            <ArrowsClockwise size={14} />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                        {/* 1️⃣ View latest document */}
                                        {showViewDownload && (
                                          <>
                                            <button className="btn btn-ghost sm" title="معاينة" onClick={() => handleViewFile(api.downloadDocument(d.id) + (d.returned_file_path ? '&returned=1' : ''), fileLabel + '.' + (d.file_type || 'pdf'))} style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              <Eye size={14} />
                                            </button>
                                            {/* 2️⃣ Download latest document */}
                                            <button className="btn btn-ghost sm" title="تحميل" onClick={() => handleDownloadFile(api.downloadDocument(d.id) + (d.returned_file_path ? '&returned=1' : ''), fileLabel + '.' + (d.file_type || 'pdf'))} style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              <DownloadSimple size={14} />
                                            </button>
                                          </>
                                        )}
                                        {/* 4️⃣ Upload / re-upload button */}
                                        {canUpload && (
                                          <>
                                            <input type="file" id={inputId2} style={{ display: 'none' }} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={e => {
                                              if (!e.target.files?.[0]) return;
                                              const file = e.target.files[0];
                                              if (isSignFill) {
                                                handleSignFillUpload(d.id, file);
                                              } else {
                                                handleProactiveUpload(d.id, d.doc_type, file);
                                              }
                                            }} />
                                            <button className="btn btn-ink sm" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => document.getElementById(inputId2)?.click()}>
                                              <UploadSimple size={14} /> {d.status === 'REVISION_REQUESTED' ? 'إعادة رفع' : 'رفع'}
                                            </button>
                                          </>
                                        )}
                                        {/* 5️⃣ Disabled upload (template doc, intern already uploaded, waiting for approval) */}
                                        {isUploadDisabled && (
                                          <button className="btn btn-ink sm" style={{ padding: '4px 8px', fontSize: 11, opacity: 0.4, cursor: 'not-allowed' }} disabled>
                                            <UploadSimple size={14} /> رفع
                                          </button>
                                        )}
                                        {/* 6️⃣ Cancel button — intern can delete own request while AWAITING_ADMIN */}
                                        {isInternInitiatedSignFill && d.status === 'AWAITING_ADMIN' && (
                                          <button className="btn btn-ghost sm" title="حذف الطلب" onClick={async () => {
                                            if (!confirm('هل تريد حذف هذا الطلب؟')) return;
                                            try {
                                              await api.post(`/interns/${internData?.id}/documents/${d.id}/cancel-request`, {});
                                              showToast('تم حذف الطلب', 'success');
                                              fetchLifecycleDocs();
                                            } catch { showToast('فشل حذف الطلب', 'error'); }
                                          }} style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                                            <Trash size={14} />
                                          </button>
                                        )}
                                        </>
                                      )}
                                      </div>
                                    </td>
                                  </tr>
);
                              });
})()}
                          </tbody>
                          </table>
                        )}
                      </>
                    );
                  })()}
              </div>
            </>)}
          </div>

          {/* PROFILE */}
          <div className={`view ${activeTab === 'profile' ? 'on' : ''} p-wrap`}>
            <div className="profile-head">
              <div className="profile-photo-wrap">
                {internData?.photo_path ? <img src={internData.photo_path} alt="avatar" /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%', padding: '15%', color: 'var(--slate)' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
              </div>
              <div><div className="profile-id">{internData?.name || user?.name}</div><div className="profile-sub">{internData?.email || user?.email}</div></div>
            </div>
            <div className="card" style={{ padding: '20px 24px' }}>
              <div className="section-title"><h3>المعلومات الشخصية</h3></div>

              <div className="info-row"><div className="k">رقم التسجيل</div><div className="v">{internData ? `INT-${internData.id.toString().padStart(4, '0')}` : 'غير محدد'}</div></div>
              <div className="info-row"><div className="k">الاسم الكامل</div><div className="v">{internData?.name || user?.name}</div></div>
              <div className="info-row"><div className="k">البريد الإلكتروني</div><div className="v">{internData?.email || user?.email}</div></div>
              <div className="info-row"><div className="k">رقم الهاتف</div><div className="v">{internData?.phone || 'غير محدد'}</div></div>
              <div className="info-row"><div className="k">تاريخ البدء</div><div className="v">{formatDate(internData?.start_date)}</div></div>
              <div className="info-row"><div className="k">تاريخ الانتهاء</div><div className="v">{formatDate(internData?.end_date)}</div></div>
              <div className="info-row"><div className="k">الجامعة أو المعهد</div><div className="v">{internData?.university || 'غير محدد'}</div></div>
              <div className="info-row" style={{ borderBottom: 'none', paddingBottom: 0 }}><div className="k">تغيير كلمة المرور</div><div className="v" style={{ paddingLeft: '8px' }}>يرجى الذهاب إلى الإعدادات لتغيير كلمة المرور</div></div>
            </div>

            {internData?.evaluation?.criteria && (
              <div className="card" style={{ padding: '20px 24px', marginTop: 16, borderTop: '3px solid var(--success)' }}>
                <div className="section-title"><h3>بطاقة تقييم المتدرب</h3></div>
                <div style={{ marginBottom: 14, fontSize: 13 }}>
                  <b>الفترة:</b> من {formatDate(internData.evaluation.period_from || internData.start_date)} إلى {formatDate(internData.evaluation.period_to || internData.end_date)}
                </div>
                {internData.evaluation.rotations?.length > 0 && (
                  <div style={{ marginBottom: 14, fontSize: 12.5 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>فترات التدريب:</div>
                    {internData.evaluation.rotations.map((r: any, i: number) => (
                      <div key={i} style={{ background: 'var(--paper)', padding: '6px 10px', borderRadius: 6, marginBottom: 4, border: '1px solid var(--line)' }}>
                        <b>{r.label || ('الفترة ' + (i + 1))}</b> — {r.supervisor} | {r.department} | من {formatDate(r.from)} إلى {formatDate(r.to)}
                      </div>
                    ))}
                  </div>
                )}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 12 }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--line)' }}>
                    <th style={{ textAlign: 'right', padding: '6px 4px', width: 200 }}>المعيار</th>
                    <th style={{ textAlign: 'center', padding: '6px 4px', width: 60 }}>نعم</th>
                    <th style={{ textAlign: 'center', padding: '6px 4px', width: 60 }}>لا</th>
                    <th style={{ width: 'auto' }}></th>
                  </tr></thead>
                  <tbody>
                    {(window as any).EVAL_CRITERIA ? (window as any).EVAL_CRITERIA.map((c: any) => {
                      const val = internData.evaluation.criteria?.[c.key] || { yes: false, no: false };
                      return (
                        <tr key={c.key} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '8px 4px', fontWeight: 600 }}>{c.label}</td>
                          <td style={{ textAlign: 'center', padding: '8px 4px', color: val.yes ? 'var(--success)' : 'var(--slate-light)' }}>{val.yes ? '✓' : '—'}</td>
                          <td style={{ textAlign: 'center', padding: '8px 4px', color: val.no ? 'var(--danger)' : 'var(--slate-light)' }}>{val.no ? '✓' : '—'}</td>
                          <td></td>
                        </tr>
                      );
                    }) : Object.keys(internData.evaluation.criteria || {}).length > 0 && (
                      Object.entries(internData.evaluation.criteria).map(([key, val]: [string, any]) => (
                        <tr key={key} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '8px 4px', fontWeight: 600 }}>{key}</td>
                          <td style={{ textAlign: 'center', padding: '8px 4px', color: val.yes ? 'var(--success)' : 'var(--slate-light)' }}>{val.yes ? '✓' : '—'}</td>
                          <td style={{ textAlign: 'center', padding: '8px 4px', color: val.no ? 'var(--danger)' : 'var(--slate-light)' }}>{val.no ? '✓' : '—'}</td>
                          <td></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {internData.evaluation.comments && (
                  <div style={{ background: 'var(--paper)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: 12, fontSize: 13 }}>
                    <span style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>ملاحظات:</span>
                    {internData.evaluation.comments}
                  </div>
                )}
                {internData.evaluation.signed_file_path && (
                  <a href={internData.evaluation.signed_file_path} target="_blank" rel="noreferrer" className="btn btn-ink sm" style={{ padding: '6px 14px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Eye size={14} /> معاينة البطاقة الموقعة
                  </a>
                )}
                <div style={{ fontSize: 11.5, color: 'var(--slate)', marginTop: 8 }}>بتقييم من: {internData.evaluation.evaluator} · {formatDate(internData.evaluation.date)}</div>
              </div>
            )}
          </div>

        </div>

        {/* MOBILE BOTTOM NAV */}
        <div className="bottom-nav">
          <div className={`bn-item ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>
            <svg className="icon" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>الحالة
          </div>
          {internData?.status !== 'مرفوض' && (
            <div className={`bn-item ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
              {pendingCount > 0 && <span className="bn-dot" style={{ background: REQ_DOT, borderColor: REQ_DOT }}></span>}
              <svg className="icon" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>المستندات
            </div>
          )}
          <div className={`bn-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <svg className="icon" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>ملفي
          </div>
        </div>
      </div>

      {showInternUploadModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-head">
              <h3>طلب مستند / إضافة ملف</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowInternUploadModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>اسم المستند</label>
                <input type="text" className="input" value={internUploadTitle} onChange={e => setInternUploadTitle(e.target.value)} placeholder="اتفاقية التدريب المعدلة 2026" />
                {!internUploadFile && <small style={{color:'var(--slate-light)',display:'block',marginTop:4}}>إذا لم تختر ملفًا، سيتم إنشاء طلب مستند دون رفع ملف</small>}
              </div>

              <div className="form-group">
                <label>الملف</label>
                <div style={{display:'flex', gap:8, alignItems:'flex-start'}}>
                  <div style={{flex:1}}>
                    <input type="file" className="input" id="intern-file-upload" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setInternUploadFile(file);
                      if (file && !internUploadTitle.trim()) {
                        setInternUploadTitle(file.name.replace(/\.\w+$/, ''));
                      }
                    }} style={{display:'none'}} />
                    <button type="button" className="btn btn-ghost" onClick={() => document.getElementById('intern-file-upload')?.click()} style={{width:'100%', justifyContent:'center', padding:'10px', fontSize:13, border:'1.5px dashed var(--line)', borderRadius:8}}>
                      <UploadSimple size={16} /> {internUploadFile ? 'تغيير الملف' : 'اختيار ملف من الجهاز'}
                    </button>
                    {internUploadFile && (
                      <div style={{marginTop:6, padding:'6px 10px', background:'#EFF6FF', borderRadius:6, border:'1px solid #BFDBFE', fontSize:12, display:'flex', alignItems:'center', gap:6}}>
                        <FileText size={14} color="#2563EB" />
                        <span style={{fontWeight:600}}>{internUploadFile.name}</span>
                        <button className="btn btn-ghost sm" onClick={() => setInternUploadFile(null)} style={{marginRight:'auto', padding:2}}><X size={14} /></button>
                      </div>
                    )}
                </div>
              </div>
            </div>
            <div className="form-group" style={{marginTop:16}}>
                <label>نوع الطلب للملفات المرفوعة</label>
                <div style={{display:'flex', flexDirection:'column', gap:8, padding:'8px 12px', background:'var(--paper)', borderRadius:8, border:'1px solid var(--line)'}}>
                  {(['view','sign','fill'] as const).map(type => {
                    const viewLocked = type === 'view' && (internUploadActionTypes.has('sign') || internUploadActionTypes.has('fill'));
                    return (
                    <label key={type} style={{display:'flex', alignItems:'center', gap:10, cursor: viewLocked ? 'not-allowed' : 'pointer', fontSize:13, padding:'4px 0', opacity: viewLocked ? 0.5 : 1}}>
                      <input type="checkbox" checked={internUploadActionTypes.has(type)} disabled={viewLocked} onChange={e => {
                        const next = new Set(internUploadActionTypes);
                        if (type === 'sign' || type === 'fill') next.delete('view');
                        e.target.checked ? next.add(type) : next.delete(type);
                        if (next.size === 0) next.add('view');
                        setInternUploadActionTypes(next);
                      }} style={{width:18,height:18,cursor: viewLocked ? 'not-allowed' : 'pointer', accentColor:'var(--gold-dark)'}} />
                      <span style={{fontWeight: internUploadActionTypes.has(type) ? 600 : 400}}>
                        {type === 'view' ? 'عرض فقط — المتدرب يرى ويحمل المستند' : ''}
                        {type === 'sign' ? 'توقيع — الإدارة توقع وترفع النسخة' : ''}
                        {type === 'fill' ? 'تعبئة وإرجاع — الإدارة تعبي النموذج وترفعه' : ''}
                      </span>
                    </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => { setShowInternUploadModal(false); setInternUploadActionTypes(new Set(['view'])); }}>إلغاء</button>
              {Array.from(internUploadActionTypes).some(t => t === 'sign' || t === 'fill') && !internUploadFile && (
                <div style={{color:'#B45309', fontSize:12, marginBottom:8}}>إذا لم تختر ملفًا، ستتم إحالة الطلب إلى الإدارة لرفع النسخة الموقعة/المعبأة</div>
              )}
              <button className="btn btn-gold" disabled={
                (!internUploadTitle.trim() && !internUploadFile)
              } onClick={async () => {
                const title = internUploadTitle.trim() || internUploadFile?.name.replace(/\.\w+$/, '') || 'مستند';
                let types = Array.from(internUploadActionTypes);
                const primaryType = types[0] || 'view';
                try {
                  const res = await api.post(`/interns/${internData?.id}/document-lifecycle`, {
                    document_type: 'OTHER', custom_title: title, action_type: primaryType
                  });
                  const docId = res.doc_id;
                  if (internUploadFile) {
                    await api.uploadInternDocument(internData?.id, 'OTHER', internUploadFile, docId, title);
                  }
                  setShowInternUploadModal(false);
                  setInternUploadFile(null);
                  setInternUploadTitle('');
                  setInternUploadActionTypes(new Set(['view']));
                  fetchLifecycleDocs();
                  showToast('تم إرسال الطلب بنجاح', 'success');
                } catch {
                  showToast('فشل إرسال الطلب', 'error');
                }
              }}>
                <UploadSimple size={14} /> رفع الملف
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="toast" className={toastMsg ? 'on' : ''} style={{
        position: 'fixed', bottom: 26, left: '50%', transform: toastMsg ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
        background: toastMsg?.type === 'success' ? '#16A34A' : 'var(--ink)', color: '#fff', padding: '13px 22px', borderRadius: 10, fontSize: 13.5, opacity: toastMsg ? 1 : 0, transition: '.25s', zIndex: 100, display: 'flex', alignItems: 'center', gap: 9
      }}>
        {toastMsg?.msg}
      </div>
    </div>
  );
}
