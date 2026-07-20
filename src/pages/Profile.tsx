import React, { useState, useEffect } from 'react';
import { ArrowRight, Printer, PencilSimple, Trash, FileText, CheckCircle, WarningCircle, DownloadSimple, Certificate, CalendarCheck } from '@phosphor-icons/react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, API_BASE } from '../services/api';
import { useToast } from '../components/Toast';

export function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [intern, setIntern] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEncadrant, setEditingEncadrant] = useState(false);
  const [encadrantInput, setEncadrantInput] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [requestDocType, setRequestDocType] = useState('other');
  const [requestFile, setRequestFile] = useState<File | null>(null);
  
  const openRequestModal = (docType: string, title: string) => {
    setRequestDocType(docType);
    setRequestTitle(title);
    setRequestNote('');
    setRequestFile(null);
    setShowRequestModal(true);
  };
  
  // Approval Modal State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveStartDate, setApproveStartDate] = useState('');
  const [approveEndDate, setApproveEndDate] = useState('');
  const [durationStr, setDurationStr] = useState('');

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

  const handleRequestDocument = async (docType: string, customTitle?: string) => {
    try {
      const formData = new FormData();
      formData.append('document_type', docType);
      formData.append('custom_title', customTitle || '');
      formData.append('note', requestNote || '');
      if (requestFile) {
        formData.append('file', requestFile);
      }

      await api.post(`/interns/${id}/requests`, formData);
      toast.success('تم إرسال الطلب بنجاح للمتدرب!');
      setShowRequestModal(false);
      setRequestTitle('');
      setRequestNote('');
      setRequestFile(null);
    } catch (err) {
      toast.error('حدث خطأ أثناء إرسال الطلب');
    }
  };

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

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'Admin';
  let canAssignEncadrant = isAdmin;
  let canApproveInterns = isAdmin;
  if (!isAdmin && user?.permissions) {
    try {
      const perms = JSON.parse(user.permissions);
      if (perms?.assign_encadrant?.edit) canAssignEncadrant = true;
      if (perms?.approve_interns?.edit) canApproveInterns = true;
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
    if (id) fetchInternAndAttendance();
  }, [id]);

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
    window.open(`${API_BASE}/documents/${filename}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
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

    setApproveStartDate(intern.start_date || new Date().toISOString().split('T')[0]);
    setApproveEndDate(intern.end_date || '');
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
          <button title="طباعة" onClick={handlePrint} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f4f5f7', border: '1.5px solid #d1d5db', color: '#1a1a1a', transition: 'all 0.2s' }}>
            <Printer weight="bold" size={18} color="#1a1a1a" />
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
          <h3><FileText weight="bold" className="icon" /> المستندات المرفقة</h3>
          
          {Object.keys(docNames).map(key => {
            const file = intern.documents?.[key];
            return (
              <div key={key} className={`doc-item ${!file ? 'missing' : ''}`}>
                <div className="di">
                  {file ? <CheckCircle weight="fill" className="icon" style={{color: 'var(--success)'}} /> : <WarningCircle weight="fill" className="icon" />}
                </div>
                <div>
                  <div className="dn">{docNames[key]}</div>
                  <div className="ds">{file ? 'مرفق متوفر' : 'غير متوفر'}</div>
                </div>
                <div className="du" style={{ display: 'flex', gap: '6px' }}>
                  {file && (
                    <button className="btn btn-ghost sm" onClick={() => handleDownload(file)} title="تحميل المستند" style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'var(--slate)' }}>
                      <DownloadSimple size={18} />
                    </button>
                  )}
                  <button className="btn btn-ghost sm" style={{ color: 'var(--gold)', border: '1px solid var(--gold)', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }} onClick={() => openRequestModal(key, docNames[key])} title={file ? 'المستند غير واضح أو به خطأ؟ اطلب من المتدرب إعادة رفعه مع ترك ملاحظة' : 'إرسال طلب للمتدرب لإضافة هذا المستند'}>
                    {file ? <PencilSimple size={18} /> : <WarningCircle size={18} />}
                  </button>
                </div>
              </div>
            );
          })}
          
          {intern.documents?.others?.map((other: any, idx: number) => {
            if (!other.file) return null;
            return (
              <div key={`other-${idx}`} className="doc-item">
                <div className="di">
                  <CheckCircle weight="fill" className="icon" style={{color: 'var(--success)'}} />
                </div>
                <div>
                  <div className="dn">{other.name || 'مستند إضافي'}</div>
                  <div className="ds">مرفق متوفر</div>
                </div>
                <div className="du" style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-ghost sm" onClick={() => handleDownload(other.file)} title="تحميل المستند" style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'var(--slate)' }}>
                    <DownloadSimple size={18} />
                  </button>
                  <button className="btn btn-ghost sm" style={{ color: 'var(--gold)', border: '1px solid var(--gold)', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }} onClick={() => openRequestModal('other', other.name)} title="المستند غير واضح أو به خطأ؟ اطلب من المتدرب إعادة رفعه مع ترك ملاحظة">
                    <PencilSimple size={18} />
                  </button>
                </div>
              </div>
            );
          })}
          
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-gold" onClick={() => openRequestModal('other', '')}>
              + طلب مستند جديد
            </button>
          </div>
          
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
              ✕ رفض الطلب
            </button>
            <button className="btn btn-primary" onClick={handleApproveClick} style={{ padding: '12px 24px', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)' }}>
              ✓ قبول الطلب وتنشيط الحساب
            </button>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-head">
              <h3>{requestDocType === 'other' ? 'طلب مستند جديد' : 'طلب إعادة رفع مستند'}</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowRequestModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>اسم المستند المطلوب</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="مثال: شهادة طبية" 
                  value={requestTitle}
                  onChange={e => setRequestTitle(e.target.value)}
                  disabled={requestDocType !== 'other'}
                  style={requestDocType !== 'other' ? { background: 'var(--paper-2)', color: 'var(--slate)', border: 'none', fontWeight: 'bold' } : {}}
                />
              </div>
              
              <div className="form-group">
                <label>ملاحظة للمتدرب (اختياري)</label>
                <textarea 
                  className="input" 
                  style={{ width: '100%', padding: '11px 13px', border: '1px solid var(--line)', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13.5px', background: 'var(--paper)', minHeight: '80px', resize: 'vertical' }}
                  placeholder="أضف أي تفاصيل أو تعليمات..." 
                  rows={3}
                  value={requestNote}
                  onChange={e => setRequestNote(e.target.value)}
                ></textarea>
              </div>

              <div className="form-group">
                <label>إرفاق نموذج (اختياري)</label>
                <input 
                  type="file" 
                  className="input" 
                  accept=".pdf"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setRequestFile(e.target.files[0]);
                    } else {
                      setRequestFile(null);
                    }
                  }}
                />
                <small style={{ color: 'var(--slate-light)', display: 'block', marginTop: '4px' }}>بصيغة PDF فقط - يمكن للمتدرب تحميله، تعبئته، ثم إعادة رفعه</small>
              </div>
            </div>
            
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowRequestModal(false)}>
                إلغاء
              </button>
              <button className="btn btn-gold" onClick={() => handleRequestDocument(requestDocType, requestTitle)} disabled={!requestTitle.trim()}>
                إرسال الطلب
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
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowApproveModal(false)}>
                ✕
              </button>
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

    </div>
  );
}
