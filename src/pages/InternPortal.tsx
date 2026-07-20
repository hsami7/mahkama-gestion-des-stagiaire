import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../services/api';
import { InternSidebar } from '../components/InternSidebar';
import { Header } from '../components/Header';
import '../InternPortal.css';

export function InternPortal() {
  const [activeTab, setActiveTab] = useState('status');
  const [bellOpen, setBellOpen] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [internData, setInternData] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<{msg: string, type: string} | null>(null);

  const uploadedDocs = useMemo(() => {
    if (!internData?.documents) return [];
    if (Array.isArray(internData.documents)) return internData.documents;
    const docs: any[] = [];
    Object.entries(internData.documents).forEach(([key, val]) => {
      if (key === 'others' && Array.isArray(val)) {
        val.forEach((o: any, idx) => {
          if (o.file && typeof o.file === 'string' && o.file.trim() !== '') {
            docs.push({ id: `other-${idx}`, document_type: o.name || 'مستند إضافي', file_path: o.file, status: 'مرفوعة' });
          }
        });
      } else if (typeof val === 'string' && val.trim() !== '') {
        let title = key;
        if (key === 'cv') title = 'السيرة الذاتية (CV)';
        if (key === 'cin' || key === 'id') title = 'البطاقة الوطنية (CIN)';
        if (key === 'insurance') title = 'تأمين التدريب';
        if (key === 'convention') title = 'اتفاقية التدريب';
        if (key === 'demande') title = 'طلب التدريب';
        docs.push({ id: key, document_type: title, file_path: val, status: 'مرفوعة' });
      }
    });
    return docs;
  }, [internData?.documents]);
  
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Build a viewable URL for an uploaded file path (handles bare filenames, full paths, and missing extensions)
  const buildFileUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const name = path.replace(/^\/api\/uploads\//, '').replace(/^\//, '');
    return `http://127.0.0.1:5000/api/uploads/${name}`;
  };

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

  const fetchProfile = async () => {
    try {
      const data = await api.get('/intern/profile');
      setInternData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchProfile();
  }, []);

  // Poll for newly created document requests and notify the intern
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('يجب أن يكون الملف بصيغة PDF', 'error');
      return;
    }

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

  const handleProactiveUpload = async (docType: string, file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('يجب أن يكون الملف بصيغة PDF', 'error');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('حجم الملف يجب أن لا يتجاوز 15 ميجابايت', 'error');
      return;
    }

    setUploading(docType as any);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);

    try {
      await api.post(`/intern/upload_unrequested`, formData);
      showToast('تم رفع المستند بنجاح!', 'success');
      fetchProfile();
    } catch (err: any) {
      showToast(err?.message || 'حدث خطأ أثناء الرفع', 'error');
    } finally {
      setUploading(null);
    }
  };

  const totalRequests = requests.length;
  // A request is only "missing" if the corresponding document is not yet uploaded.
  const missingCount = useMemo(() => {
    const docs = internData?.documents;
    const others = (docs && Array.isArray(docs.others)) ? docs.others : [];
    return requests.filter((r: any) => {
      if (r.document_type === 'other') {
        return !others.some((o: any) => o.name === r.custom_title && o.file && o.file.trim() !== '');
      }
      return !(docs && typeof docs[r.document_type] === 'string' && docs[r.document_type].trim() !== '');
    }).length;
  }, [requests, internData?.documents]);

  // Pending re-upload requests from the admin (regardless of whether a file is already attached)
  const pendingCount = requests.length;

  // Orange/yellow palette for request notifications
  const REQ_BG = '#FFF6E5';
  const REQ_FG = '#9A6B00';
  const REQ_BORDER = '#F2D49B';
  const REQ_DOT = '#F4B400';

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'status': return 'حالة الطلب';
      case 'docs': return 'مستنداتي';
      case 'downloads': return 'التنزيلات';
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
        <Header title={getPageTitle(activeTab)} missingCount={missingCount} />

        <div className="view on">
          {/* STATUS */}
          <div className={`view ${activeTab === 'status' ? 'on' : ''}`}>
            <div className="welcome-row">
              <div className="welcome-photo">
                {internData?.photo_path ? <img src={internData.photo_path} alt="avatar" /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'100%', height:'100%', padding:'15%', color:'var(--slate)'}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              </div>
              <div><h2>مرحبًا، {internData?.name || user?.name} 👋</h2><p>{internData?.email || user?.email}</p></div>
            </div>

            {/* PENDING STATE */}
            {(!internData?.status || internData?.status === 'قيد المراجعة') && (
              <div className="state-block on">
                {pendingCount > 0 && (
                  <div className="alert req" style={{display:'flex', alignItems:'flex-start', gap:10, padding:'16px 18px', borderRadius:'12px', marginBottom:18, fontSize:'13.5px', fontWeight:700, background: REQ_BG, color: REQ_FG, border:`1px solid ${REQ_BORDER}`}}>
                    <svg className="icon" viewBox="0 0 24 24" style={{stroke: REQ_FG, width:24, height:24, flexShrink:0, marginTop:2}}><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
                    <div>
                      لديك {pendingCount} طلب لإعادة رفع مستند من الإدارة — <span style={{textDecoration:'underline', cursor:'pointer'}} onClick={() => setActiveTab('docs')}>عرض الطلبات</span>
                      <ul style={{margin:'8px 0 0', paddingRight:18, fontWeight:500, fontSize:12.5, lineHeight:1.9}}>
                        {requests.map((r: any) => (
                          <li key={r.id}>{r.custom_title || r.document_type}{r.note ? ` — ${r.note}` : ''}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                <div className="card" style={{marginBottom:18, padding:24}}>
                  <div className="intern-stepper" style={{display:'flex', alignItems:'center'}}>
                    <div className="intern-step done" style={{flex:1, textAlign:'center', position:'relative'}}><div className="sc" style={{width:34,height:34,borderRadius:'50%',background:'var(--success)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px',position:'relative',zIndex:2}}>✓</div><small style={{display:'block',color:'var(--slate)'}}>إنشاء الحساب</small></div>
                    <div className={`intern-step ${missingCount > 0 ? 'active' : 'done'}`} style={{flex:1, textAlign:'center', position:'relative'}}><div className="sc" style={{width:34,height:34,borderRadius:'50%',background:missingCount>0?'var(--gold)':'var(--success)',color:missingCount>0?'#2A2005':'#fff',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px',position:'relative',zIndex:2, boxShadow:missingCount>0?'0 0 0 5px rgba(201,162,39,.18)':'none'}}>{missingCount>0?'2':'✓'}</div><small style={{display:'block',color:'var(--slate)'}}>رفع المستندات</small></div>
                    <div className={`intern-step ${missingCount === 0 ? 'active' : ''}`} style={{flex:1, textAlign:'center', position:'relative'}}><div className="sc" style={{width:34,height:34,borderRadius:'50%',background:missingCount===0?'var(--gold)':'var(--paper)',border:missingCount===0?'none':'2px solid var(--line)',color:missingCount===0?'#2A2005':'var(--slate-light)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px',position:'relative',zIndex:2, boxShadow:missingCount===0?'0 0 0 5px rgba(201,162,39,.18)':'none'}}>3</div><small style={{display:'block',color:'var(--slate)'}}>المراجعة والقبول</small></div>
                  </div>
                </div>



                <div className="card" style={{padding: 24}}>
                  <div className="section-title"><h3>آخر التحديثات</h3></div>
                  <div className="timeline">
                    <div className="tl-item" style={{display:'flex', gap:14, paddingBottom:20, position:'relative'}}>
                      <div className="tl-dot" style={{width:30,height:30,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:1,background:'var(--success-bg)', color:'var(--success)'}}><svg className="icon" viewBox="0 0 24 24" style={{width:15, height:15}}><path d="M20 6L9 17l-5-5"/></svg></div>
                      <div className="tl-body"><b style={{fontSize:13,display:'block'}}>تم إنشاء الحساب بنجاح</b><span style={{fontSize:11.5,color:'var(--slate-light)'}}>مرحباً بك</span></div>
                    </div>
                    <div className="tl-item" style={{display:'flex', gap:14, position:'relative'}}>
                      <div className="tl-dot" style={{width:30,height:30,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:1,background:'var(--warning-bg)', color:'var(--warning)'}}><svg className="icon" viewBox="0 0 24 24" style={{width:15, height:15}}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div>
                      <div className="tl-body"><b style={{fontSize:13,display:'block'}}>طلبك الآن قيد المراجعة</b><span style={{fontSize:11.5,color:'var(--slate-light)'}}>بانتظار الإدارة</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACCEPTED STATE */}
            {internData?.status === 'نشط' && (
              <div className="state-block on">
                <div className="hero-accept" style={{position:'relative', overflow:'hidden', borderRadius:16, padding:'30px 28px', marginBottom:20, color:'#fff', background:'linear-gradient(120deg, #1E5631 0%, #2F9E44 100%)'}}>
                  <div className="hcontent" style={{position:'relative'}}>
                    <div className="htag" style={{display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.18)', padding:'5px 12px', borderRadius:20, fontSize:11.5, fontWeight:700, marginBottom:14}}>🎉 مبروك</div>
                    <h2 style={{fontSize:23, margin:'0 0 6px'}}>تم قبولك رسميًا في برنامج التدريب!</h2>
                    <p style={{margin:0, fontSize:13.5, color:'#DCF3E1', maxWidth:520, lineHeight:1.8}}>يسعدنا إخبارك بأن طلبك قد لقي القبول. ستجد أدناه كل ما تحتاجه للاستعداد ليوم انطلاقك الأول.</p>
                  </div>
                </div>

                <div className="card" style={{marginBottom:18, padding:24}}>
                  <div className="intern-stepper" style={{display:'flex', alignItems:'center'}}>
                    <div className="intern-step done" style={{flex:1, textAlign:'center', position:'relative'}}><div className="sc" style={{width:34,height:34,borderRadius:'50%',background:'var(--success)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px',position:'relative',zIndex:2}}>✓</div><small style={{display:'block',color:'var(--slate)'}}>الإرسال</small></div>
                    <div className="intern-step done" style={{flex:1, textAlign:'center', position:'relative'}}><div className="sc" style={{width:34,height:34,borderRadius:'50%',background:'var(--success)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px',position:'relative',zIndex:2}}>✓</div><small style={{display:'block',color:'var(--slate)'}}>المراجعة</small></div>
                    <div className="intern-step done" style={{flex:1, textAlign:'center', position:'relative'}}><div className="sc" style={{width:34,height:34,borderRadius:'50%',background:'var(--success)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px',position:'relative',zIndex:2}}>✓</div><small style={{display:'block',color:'var(--slate)'}}>القبول</small></div>
                    <div className="intern-step active" style={{flex:1, textAlign:'center', position:'relative'}}><div className="sc" style={{width:34,height:34,borderRadius:'50%',background:'var(--gold)',color:'#2A2005',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px',position:'relative',zIndex:2, boxShadow:'0 0 0 5px rgba(201,162,39,.18)'}}>4</div><small style={{display:'block',color:'var(--slate)'}}>بدء التدريب</small></div>
                  </div>
                </div>

                <div className="grid-2" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16}}>
                  <div className="card mini-card" style={{padding:'18px 20px'}}>
                    <div className="mc-top" style={{marginBottom:10, display:'flex'}}><div className="mi" style={{width:36,height:36,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--success-bg)',color:'var(--success)'}}><svg className="icon" viewBox="0 0 24 24" style={{width:18,height:18}}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div></div>
                    <b style={{fontSize:13.5, display:'block'}}>تاريخ الانطلاق</b><span style={{fontSize:12, color:'var(--slate)'}}>{internData?.start_date || 'غير محدد'}</span>
                  </div>
                  <div className="card mini-card" style={{padding:'18px 20px'}}>
                    <div className="mc-top" style={{marginBottom:10, display:'flex'}}><div className="mi" style={{width:36,height:36,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',background:'#EAF0FF',color:'#2A4FCB'}}><svg className="icon" viewBox="0 0 24 24" style={{width:18,height:18}}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg></div></div>
                    <b style={{fontSize:13.5, display:'block'}}>المشرف المباشر</b><span style={{fontSize:12, color:'var(--slate)'}}>{internData?.encadrant || 'لم يتم التعيين بعد'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* REJECTED STATE */}
            {internData?.status === 'مرفوض' && (
              <div className="state-block on">
                <div className="hero-reject" style={{borderRadius:16, padding:'30px 28px', marginBottom:20, background:'var(--ink)', color:'#fff', position:'relative', overflow:'hidden'}}>
                  <div className="hcontent" style={{position:'relative'}}>
                    <div className="htag" style={{display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.1)', padding:'5px 12px', borderRadius:20, fontSize:11.5, fontWeight:700, marginBottom:14, color:'#C9D2E3'}}>نتيجة الطلب</div>
                    <h2 style={{fontSize:21, margin:'0 0 8px'}}>نشكرك على اهتمامك ببرنامج التدريب لدينا</h2>
                    <p style={{margin:0, fontSize:13.5, color:'#B7C0D6', maxWidth:540, lineHeight:1.9}}>بعد دراسة متأنية لملفك، نأسف لإبلاغك بأننا لن نتمكن من المضي قدمًا في طلبك لهذه الدورة التدريبية. هذا لا يعكس بالضرورة مؤهلاتك، وإنما محدودية الشواغر المتاحة في هذه الفترة.</p>
                  </div>
                </div>

                <div className="card" style={{marginBottom:16, padding:24}}>
                  <div className="section-title"><h3>تفاصيل القرار</h3></div>
                  <div style={{borderRight:'3px solid var(--slate-light)', paddingRight:14, marginBottom:18}}>
                    <div style={{fontSize:11.5, color:'var(--slate-light)', marginBottom:4}}>السبب المُشار إليه من قِبل اللجنة</div>
                    <div style={{fontSize:13.5, lineHeight:1.8}}>اكتمال العدد المتاح من المقاعد في القسم المطلوب لهذه الدورة. نشجعك على التقديم مجددًا في الدورة القادمة.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DOCUMENTS */}
          <div className={`view ${activeTab === 'docs' ? 'on' : ''}`}>
            <div className="section-title"><h2 style={{fontSize:19, margin:0}}>مستنداتي</h2></div>
            <p style={{color:'var(--slate)', fontSize:13.5, margin:'0 0 20px'}}>المستندات الخاصة بك وحالتها الحالية</p>

            <div className="card" style={{padding: 24}}>
              <div className="section-title" style={{marginBottom: 20}}><h3>المستندات المرفقة</h3></div>
              
              {[
                { key: 'id', label: 'بطاقة التعريف الوطنية (CIN)' },
                { key: 'convention', label: 'اتفاقية التدريب (Convention de stage)' },
                { key: 'demande', label: 'طلب التدريب (Demande de stage)' },
                { key: 'insurance', label: 'تأمين التدريب (Insurance)' },
                { key: 'resume', label: 'السيرة الذاتية (Resume)' }
              ].map(docItem => {
                const uploaded = uploadedDocs.find(d => d.id === docItem.key);
                const req = requests.find(r => r.document_type === docItem.key);

                return (
                  <div className={`doc-item ${uploaded ? 'ok' : req ? 'missing' : ''}`} key={docItem.key}>
                    <div className="di">
                      {uploaded ? (
                        <svg className="icon" viewBox="0 0 24 24" style={{width:18, height:18}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                      ) : req ? (
                        <svg className="icon" viewBox="0 0 24 24" style={{width:18, height:18}}><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
                      ) : (
                        <svg className="icon" viewBox="0 0 24 24" style={{width:18, height:18}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                      )}
                    </div>
                    <div>
                      <div className="dn">{docItem.label}</div>
                      <div className="ds" style={{ color: req && !uploaded ? 'var(--danger)' : '' }}>
                        {uploaded ? 'مرفق متوفر' : req ? 'مطلوبة — بانتظار الرفع' : 'غير متوفر'}
                      </div>
                      {req?.note && req.note.trim() !== '' && !uploaded && (
                        <div className="req-note" style={{ fontSize: 12, color: 'var(--slate)', marginTop: 6, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px', lineHeight: 1.6 }}>
                          <b style={{ color: 'var(--ink)' }}>ملاحظة: </b>{req.note}
                        </div>
                      )}
                    </div>
                    <div className="du" style={{marginRight:'auto', display:'flex', gap:8, alignItems:'center'}}>
                      {uploaded && uploaded.file_path ? (
                        <a href={buildFileUrl(uploaded.file_path)} target="_blank" rel="noreferrer" className="btn btn-ghost sm" style={{color:'var(--slate)'}}>
                          <svg className="icon" viewBox="0 0 24 24" style={{width:14, height:14}}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> عرض
                        </a>
                      ) : (
                        <>
                          <input 
                            type="file" 
                            id={req ? `f-${req.id}` : `f-proactive-${docItem.key}`} 
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                if (req) {
                                  handleUpload(req.id, e.target.files[0]);
                                } else {
                                  handleProactiveUpload(docItem.key, e.target.files[0]);
                                }
                              }
                            }}
                          />
                          <button className="btn btn-ink" style={{padding:'8px 14px', fontSize:12.5}} onClick={() => document.getElementById(req ? `f-${req.id}` : `f-proactive-${docItem.key}`)?.click()} disabled={uploading === (req ? req.id : docItem.key)}>
                            {uploading === (req ? req.id : docItem.key) ? 'جاري...' : 'رفع الآن'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Render Custom Requests */}
              {requests.filter(r => !['cin', 'convention', 'demande', 'insurance', 'cv'].includes(r.document_type)).map(req => (
                <div className="doc-item missing" key={req.id}>
                  <div className="di"><svg className="icon" viewBox="0 0 24 24" style={{width:18, height:18}}><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg></div>
                  <div>
                    <div className="dn">{req.custom_title || req.document_type}</div>
                    <div className="ds" style={{ color: 'var(--danger)' }}>مطلوبة — بانتظار الرفع</div>
                    {req.note && req.note.trim() !== '' && (
                      <div className="req-note" style={{ fontSize: 12, color: 'var(--slate)', marginTop: 6, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px', lineHeight: 1.6 }}>
                        <b style={{ color: 'var(--ink)' }}>ملاحظة: </b>{req.note}
                      </div>
                    )}
                  </div>
                  <div className="du" style={{marginRight:'auto', display:'flex', gap:8, alignItems:'center'}}>
                    {req.template_path && (
                      <a 
                        href={`http://127.0.0.1:5000${req.template_path.startsWith('/') ? '' : '/'}${req.template_path}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-ghost sm" 
                        style={{color:'var(--gold-dark)', border: '1px solid var(--gold-border)'}}
                      >
                        <svg className="icon" viewBox="0 0 24 24" style={{width:14, height:14}}><path d="M12 15V3M7 10l5 5 5-5"/><path d="M4 21h16"/></svg> تحميل النموذج
                      </a>
                    )}
                    {(() => {
                      const cur = (internData?.documents?.others || []).find((o: any) => o.name === req.custom_title && o.file && o.file.trim() !== '');
                      return cur ? (
                        <a href={buildFileUrl(cur.file)} target="_blank" rel="noreferrer" className="btn btn-ghost sm" style={{color:'var(--slate)'}}>
                          <svg className="icon" viewBox="0 0 24 24" style={{width:14, height:14}}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> عرض الحالي
                        </a>
                      ) : null;
                    })()}
                    <input
                      type="file" 
                      id={`f-${req.id}`} 
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleUpload(req.id, e.target.files[0]);
                        }
                      }}
                    />
                    <button className="btn btn-ink" style={{padding:'8px 14px', fontSize:12.5}} onClick={() => document.getElementById(`f-${req.id}`)?.click()} disabled={uploading === req.id}>
                      {uploading === req.id ? 'جاري...' : 'رفع الآن'}
                    </button>
                  </div>
                </div>
              ))}

              {/* Render Custom Uploaded Docs */}
              {uploadedDocs.filter(d => d.id.startsWith('other-')).map((doc: any, i: number) => (
                <div className="doc-item ok" key={doc.id || i}>
                  <div className="di"><svg className="icon" viewBox="0 0 24 24" style={{width:18, height:18}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg></div>
                  <div>
                    <div className="dn">{doc.document_type || 'مستند إضافي'}</div>
                    <div className="ds">مرفق متوفر</div>
                  </div>
                  <div className="du" style={{marginRight:'auto', display:'flex', gap:8, alignItems:'center'}}>
                    {doc.file_path && (
                      <a href={buildFileUrl(doc.file_path)} target="_blank" rel="noreferrer" className="btn btn-ghost sm" style={{color:'var(--slate)'}}>
                        <svg className="icon" viewBox="0 0 24 24" style={{width:14, height:14}}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> عرض
                      </a>
                    )}
                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* DOWNLOADS */}
          <div className={`view ${activeTab === 'downloads' ? 'on' : ''}`}>
            <div className="section-title"><h2 style={{fontSize:19, margin:0}}>التنزيلات</h2></div>
            <p style={{color:'var(--slate)', fontSize:13.5, margin:'0 0 20px'}}>وثائق جاهزة مشتركة من إدارة التدريب</p>
            <div className="dl-grid">
              <div className="card" style={{padding:18}}>
                <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:14}}>
                  <div style={{width:40, height:40, borderRadius:9, background:'var(--paper)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold-dark)'}}><svg className="icon" viewBox="0 0 24 24" style={{width:18, height:18}}><path d="M6 2h9l3 3v17H6z"/><path d="M15 2v4h4"/></svg></div>
                  <div><b style={{fontSize:13}}>دليل المتدرب الداخلي</b><div style={{fontSize:11, color:'var(--slate-light)'}}>PDF · 1.1 ميجابايت</div></div>
                </div>
                <button className="btn btn-ghost" style={{width:'100%', justifyContent:'center'}} onClick={() => showToast('جاري التحميل...', 'info')}>
                  <svg className="icon" viewBox="0 0 24 24" style={{width:15, height:15}}><path d="M12 15V3M7 10l5 5 5-5"/><path d="M4 21h16"/></svg> تحميل
                </button>
              </div>
            </div>
          </div>

          {/* PROFILE */}
          <div className={`view ${activeTab === 'profile' ? 'on' : ''}`}>
            <div className="profile-head">
              <div className="profile-photo-wrap">
                {internData?.photo_path ? <img src={internData.photo_path} alt="avatar" /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'100%', height:'100%', padding:'15%', color:'var(--slate)'}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              </div>
              <div><div className="profile-id">{internData?.name || user?.name}</div><div className="profile-sub">{internData?.email || user?.email}</div></div>
            </div>
            <div className="card">
              <div className="section-title"><h3>المعلومات الشخصية</h3></div>

              <div className="info-row"><div className="k">رقم التسجيل</div><div className="v">{internData ? `INT-${internData.id.toString().padStart(4, '0')}` : 'غير محدد'}</div></div>
              <div className="info-row"><div className="k">الاسم الكامل</div><div className="v">{internData?.name || user?.name}</div></div>
              <div className="info-row"><div className="k">البريد الإلكتروني</div><div className="v">{internData?.email || user?.email}</div></div>
              <div className="info-row"><div className="k">رقم الهاتف</div><div className="v">{internData?.phone || 'غير محدد'}</div></div>
              <div className="info-row"><div className="k">تاريخ البدء</div><div className="v">{(internData?.start_date && internData.start_date.trim() !== '') ? new Date(internData.start_date).toLocaleDateString('ar-EG') : 'غير محدد'}</div></div>
              <div className="info-row"><div className="k">تاريخ الانتهاء</div><div className="v">{(internData?.end_date && internData.end_date.trim() !== '') ? new Date(internData.end_date).toLocaleDateString('ar-EG') : 'غير محدد'}</div></div>
              <div className="info-row"><div className="k">الجامعة أو المعهد</div><div className="v">{internData?.university || 'غير محدد'}</div></div>
              <div className="info-row" style={{ borderBottom: 'none', paddingBottom: 0 }}><div className="k">تغيير كلمة المرور</div><div className="v" style={{ paddingLeft: '8px' }}>يرجى الذهاب إلى الإعدادات لتغيير كلمة المرور</div></div>
            </div>
          </div>

        </div>

        {/* MOBILE BOTTOM NAV */}
        <div className="bottom-nav">
          <div className={`bn-item ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}>
            <svg className="icon" viewBox="0 0 24 24" style={{width:20, height:20}}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>الحالة
          </div>
          <div className={`bn-item ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
            {pendingCount > 0 && <span className="bn-dot" style={{ background: REQ_DOT, borderColor: REQ_DOT }}></span>}
            <svg className="icon" viewBox="0 0 24 24" style={{width:20, height:20}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>مستنداتي
          </div>
          <div className={`bn-item ${activeTab === 'downloads' ? 'active' : ''}`} onClick={() => setActiveTab('downloads')}>
            <svg className="icon" viewBox="0 0 24 24" style={{width:20, height:20}}><path d="M12 15V3M7 10l5 5 5-5"/><path d="M4 21h16"/></svg>تنزيلات
          </div>
          <div className={`bn-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <svg className="icon" viewBox="0 0 24 24" style={{width:20, height:20}}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>ملفي
          </div>
        </div>
      </div>

      <div id="toast" className={toastMsg ? 'on' : ''} style={{
        position: 'fixed', bottom: 26, left: '50%', transform: toastMsg ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
        background: 'var(--ink)', color: '#fff', padding: '13px 22px', borderRadius: 10, fontSize: 13.5, opacity: toastMsg ? 1 : 0, transition: '.25s', zIndex: 100, display: 'flex', alignItems: 'center', gap: 9
      }}>
        {toastMsg?.msg}
      </div>
    </div>
  );
}
