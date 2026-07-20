import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, Funnel, Hash, CaretDown, Plus, X, CalendarCheck } from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { TestModeAutofill } from '../components/TestModeAutofill';
import { useToast } from '../components/Toast';

const defaultIntern = { 
  name: '', name_fr: '', encadrant: '', email: '', national_id: '', department: '',
  phone: '', start_date: '', end_date: '', date_of_birth: '', university: '', address: '', photo_path: '',
  documents: { id: null, convention: null, demande: null, insurance: null, resume: null } as { [key: string]: string | null },
  other_documents: [] as {name: string, file: string | null}[]
};

export function Interns() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [interns, setInterns] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInternId, setEditingInternId] = useState<number | null>(null);
  const [newIntern, setNewIntern] = useState(defaultIntern);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ query: '', status: '' });

  const filteredInterns = interns.filter(intern => {
    const matchQuery = !appliedFilters.query || 
      (intern.name && intern.name.toLowerCase().includes(appliedFilters.query.toLowerCase())) || 
      (intern.national_id && intern.national_id.toLowerCase().includes(appliedFilters.query.toLowerCase()));
    
    const matchStatus = !appliedFilters.status || intern.status === appliedFilters.status;

    return matchQuery && matchStatus;
  });

  const fetchInterns = async () => {
    try {
      const data = await api.get('/interns');
      setInterns(data);
    } catch (err) {
      console.error("Error fetching interns", err);
    }
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  useEffect(() => {
    if (location.state?.editIntern) {
      const intern = location.state.editIntern;
      setNewIntern({
        ...defaultIntern,
        ...intern
      });
      setEditingInternId(intern.id);
      setIsFormOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string, index?: number) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.warning('عذراً، يُسمح فقط برفع ملفات PDF');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('عذراً، حجم الملف يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }

    try {
      const res = await api.uploadFile('/documents', file);
      const filename = res.filename;
      
      if (docType === 'other' && index !== undefined) {
        const newOther = [...newIntern.other_documents];
        newOther[index].file = filename;
        setNewIntern({...newIntern, other_documents: newOther});
      } else {
        setNewIntern({
          ...newIntern,
          documents: { ...newIntern.documents, [docType]: filename }
        });
      }
    } catch (err) {
      console.error('File upload error', err);
      toast.error('فشل رفع الملف');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      toast.warning('عذراً، يُسمح فقط برفع الصور');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.warning('عذراً، حجم الصورة يجب أن لا يتجاوز 15 ميجابايت');
      return;
    }

    try {
      const res = await api.uploadFile('/upload_photo', file);
      setNewIntern({...newIntern, photo_path: res.photo_path});
    } catch (err) {
      console.error('Photo upload error', err);
      toast.error('فشل رفع الصورة');
    }
  };

  const addOtherDocument = () => {
    setNewIntern({
      ...newIntern, 
      other_documents: [...newIntern.other_documents, {name: '', file: null}]
    });
  };

  const removeDocument = (docType: string) => {
    setNewIntern({
      ...newIntern,
      documents: { ...newIntern.documents, [docType]: null }
    });
  };

  const removeOtherDocument = (index: number) => {
    const newOthers = [...newIntern.other_documents];
    newOthers.splice(index, 1);
    setNewIntern({
      ...newIntern,
      other_documents: newOthers
    });
  };

  const handleAddIntern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntern.photo_path) {
      toast.warning("الرجاء اختيار صورة شخصية");
      return;
    }
    if (newIntern.date_of_birth && newIntern.date_of_birth.length === 10) {
      const [day, month, year] = newIntern.date_of_birth.split('/');
      const birthDate = new Date(`${year}-${month}-${day}`);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        toast.warning("عذراً، يجب أن يكون عمر المتدرب 18 سنة على الأقل");
        return;
      }
    }

    try {
      if (editingInternId) {
        await api.put(`/interns/${editingInternId}`, newIntern);
      } else {
        await api.post('/interns', newIntern);
      }
      setIsFormOpen(false);
      setNewIntern(defaultIntern);
      setEditingInternId(null);
      fetchInterns(); 
    } catch (err) {
      console.error(err);
      toast.error('فشل حفظ بيانات المتدرب');
    }
  };

  const handleDateChange = (val: string, field: string) => {
    let clean = val.replace(/\D/g, '');
    if (clean.length > 2) clean = clean.slice(0, 2) + '/' + clean.slice(2);
    if (clean.length > 5) clean = clean.slice(0, 5) + '/' + clean.slice(5);
    setNewIntern({...newIntern, [field]: clean.slice(0, 10)});
  };

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>ملفات المتدربين</h2>
          <p>{interns.length} ملفًا مسجّلًا</p>
        </div>
        <button className="btn btn-gold" onClick={() => {
            if (isFormOpen) {
                setIsFormOpen(false);
                setEditingInternId(null);
                setNewIntern(defaultIntern);
            } else {
                setIsFormOpen(true);
            }
        }}>
          {isFormOpen ? <X weight="bold" size={19} color="#000" /> : <Plus weight="bold" size={19} color="#000" />} 
          {isFormOpen ? 'إغلاق النموذج' : 'إضافة متدرب يدويًا'}
        </button>
      </div>

      {isFormOpen && (
        <div className="card" style={{ marginBottom: '24px', padding: '28px', animation: 'fadeIn 0.25s ease', borderTop: '4px solid var(--gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus weight="bold" size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800 }}>{editingInternId ? 'تعديل بيانات المتدرب' : 'إضافة متدرب جديد'}</div>
                <div style={{ fontSize: '12px', color: 'var(--slate)', fontWeight: 500, marginTop: '2px' }}>
                  {editingInternId ? 'قم بتحديث بيانات المتدرب الحالية' : 'أدخل بيانات المتدرب لإضافته إلى النظام'}
                </div>
              </div>
            </h3>
          </div>
          
          <form onSubmit={handleAddIntern}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '16px', background: 'var(--paper)', border: '2px dashed var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', position: 'relative' }} onClick={() => document.getElementById('photo-upload')?.click()}>
                  {newIntern.photo_path ? (
                    <img src={newIntern.photo_path} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: 'var(--slate)', fontSize: '12px' }}>اختر صورة</span>
                  )}
                  <input id="photo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                </div>
                <label style={{ display: 'block', fontSize: '12px', marginTop: '8px', color: 'var(--slate)', cursor: 'pointer' }} onClick={() => document.getElementById('photo-upload')?.click()}>
                  صورة شخصية <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
              </div>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>الاسم الكامل بالعربية <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input 
                    type="text" 
                    placeholder="مثال: محمد أحمد" 
                  required
                  value={newIntern.name}
                  onChange={e => {
                    const arabicOnly = e.target.value.replace(/[^\u0600-\u06FF\s]/g, '');
                    setNewIntern({...newIntern, name: arabicOnly});
                  }}
                  style={{ background: 'var(--paper)', transition: 'border-color 0.2s, box-shadow 0.2s', padding: '12px 16px', border: '1px solid var(--line)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line)'}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>الاسم الكامل بالفرنسية <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mohammed Ahmed" 
                  required
                  value={newIntern.name_fr || ''}
                  onChange={e => {
                    const frenchOnly = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '');
                    setNewIntern({...newIntern, name_fr: frenchOnly});
                  }}
                  style={{ background: 'var(--paper)', transition: 'border-color 0.2s, box-shadow 0.2s', padding: '12px 16px', border: '1px solid var(--line)', outline: 'none', textAlign: 'left', direction: 'ltr' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line)'}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>البريد الإلكتروني <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  type="email" 
                  placeholder="email@example.com"
                  required
                  value={newIntern.email}
                  onChange={e => setNewIntern({...newIntern, email: e.target.value})}
                  style={{ background: 'var(--paper)', transition: 'border-color 0.2s, box-shadow 0.2s', padding: '12px 16px', border: '1px solid var(--line)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line)'}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>رقم الهوية الوطنية <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  type="text" 
                  placeholder="مثال: A123456"
                  required
                  value={newIntern.national_id}
                  onChange={e => setNewIntern({...newIntern, national_id: e.target.value})}
                  style={{ background: 'var(--paper)', transition: 'border-color 0.2s, box-shadow 0.2s', padding: '12px 16px', border: '1px solid var(--line)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line)'}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>رقم الهاتف <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  type="tel" 
                  placeholder="مثال: 0612345678"
                  required
                  pattern="^(06|07)\d{8}$"
                  maxLength={10}
                  title="يجب أن يبدأ بـ 06 أو 07 ويتكون من 10 أرقام"
                  value={newIntern.phone}
                  onChange={e => setNewIntern({...newIntern, phone: e.target.value.replace(/\D/g, '')})}
                  style={{ background: 'var(--paper)', transition: 'border-color 0.2s, box-shadow 0.2s', padding: '12px 16px', border: '1px solid var(--line)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line)'}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>تاريخ الازدياد <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="يوم/شهر/سنة"
                    required
                    pattern="\d{2}/\d{2}/\d{4}"
                    maxLength={10}
                    title="يجب أن يكون العمر 18 سنة على الأقل، بصيغة يوم/شهر/سنة"
                    value={newIntern.date_of_birth}
                    onChange={e => handleDateChange(e.target.value, 'date_of_birth')}
                    style={{ background: 'var(--paper)', transition: 'border-color 0.2s, box-shadow 0.2s', padding: '12px 16px 12px 36px', border: '1px solid var(--line)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                    onBlur={e => e.target.style.borderColor = 'var(--line)'}
                  />
                  <div style={{ position: 'absolute', left: '10px', width: '20px', height: '20px' }}>
                    <CalendarCheck size={18} color="var(--slate)" style={{ pointerEvents: 'none', position: 'absolute', top: '1px' }} />
                    <input 
                      type="date" 
                      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      onChange={e => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-');
                          handleDateChange(`${d}/${m}/${y}`, 'date_of_birth');
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>تاريخ البدء <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="يوم/شهر/سنة"
                    required
                    pattern="\d{2}/\d{2}/\d{4}"
                    maxLength={10}
                    value={newIntern.start_date}
                    onChange={e => handleDateChange(e.target.value, 'start_date')}
                    style={{ background: 'var(--paper)', transition: 'border-color 0.2s, box-shadow 0.2s', padding: '12px 16px 12px 36px', border: '1px solid var(--line)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                    onBlur={e => e.target.style.borderColor = 'var(--line)'}
                  />
                  <div style={{ position: 'absolute', left: '10px', width: '20px', height: '20px' }}>
                    <CalendarCheck size={18} color="var(--slate)" style={{ pointerEvents: 'none', position: 'absolute', top: '1px' }} />
                    <input 
                      type="date" 
                      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      onChange={e => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-');
                          handleDateChange(`${d}/${m}/${y}`, 'start_date');
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>تاريخ الانتهاء <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="يوم/شهر/سنة"
                    required
                    pattern="\d{2}/\d{2}/\d{4}"
                    maxLength={10}
                    value={newIntern.end_date}
                    onChange={e => handleDateChange(e.target.value, 'end_date')}
                    style={{ background: 'var(--paper)', transition: 'border-color 0.2s, box-shadow 0.2s', padding: '12px 16px 12px 36px', border: '1px solid var(--line)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                    onBlur={e => e.target.style.borderColor = 'var(--line)'}
                  />
                  <div style={{ position: 'absolute', left: '10px', width: '20px', height: '20px' }}>
                    <CalendarCheck size={18} color="var(--slate)" style={{ pointerEvents: 'none', position: 'absolute', top: '1px' }} />
                    <input 
                      type="date" 
                      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      onChange={e => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-');
                          handleDateChange(`${d}/${m}/${y}`, 'end_date');
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>الجامعة أو المعهد <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  type="text" 
                  placeholder="اسم المؤسسة..."
                  required
                  value={newIntern.university}
                  onChange={e => setNewIntern({...newIntern, university: e.target.value})}
                  style={{ background: 'var(--paper)', transition: 'border-color 0.2s, box-shadow 0.2s', padding: '12px 16px', border: '1px solid var(--line)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line)'}
                />
              </div>
            </div>
          </div>
            
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label>العنوان <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input 
                type="text" 
                placeholder="عنوان السكن..."
                required
                value={newIntern.address}
                onChange={e => setNewIntern({...newIntern, address: e.target.value})}
                style={{ width: '100%', background: 'var(--paper)', transition: 'border-color 0.2s, box-shadow 0.2s', padding: '12px 16px', border: '1px solid var(--line)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--line)'}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px dashed var(--line)' }}>
                <h4 style={{ fontSize: '15px', margin: 0 }}>المستندات المرفقة</h4>
                <span style={{ fontSize: '11px', color: 'var(--slate)', background: 'var(--paper)', padding: '4px 8px', borderRadius: '4px' }}>
                  ملفات PDF فقط (الحد الأقصى: 5 ميجابايت)
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {[
                  { id: 'id', label: 'بطاقة التعريف الوطنية' },
                  { id: 'convention', label: 'اتفاقية التدريب (Convention de stage)' },
                  { id: 'demande', label: 'طلب التدريب (Demande de stage)' },
                  { id: 'insurance', label: 'تأمين (Insurance)' },
                  { id: 'resume', label: 'السيرة الذاتية (Resume)' },
                ].map(doc => (
                  <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>{doc.label}</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <label style={{ 
                        flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        background: newIntern.documents[doc.id as keyof typeof newIntern.documents] ? 'var(--success-bg)' : 'var(--paper)', 
                        color: newIntern.documents[doc.id as keyof typeof newIntern.documents] ? 'var(--success)' : 'var(--slate)', 
                        border: `1px dashed ${newIntern.documents[doc.id as keyof typeof newIntern.documents] ? 'var(--success)' : 'var(--line)'}`, 
                        padding: '10px', borderRadius: '8px', fontSize: '12px', transition: 'all 0.2s', margin: 0 
                      }}>
                        <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, doc.id)} />
                        {newIntern.documents[doc.id as keyof typeof newIntern.documents] ? 'تم الرفع ✓' : 'اختر ملف PDF...'}
                      </label>
                      {newIntern.documents[doc.id as keyof typeof newIntern.documents] && (
                        <button type="button" onClick={() => removeDocument(doc.id as any)} style={{ flexShrink: 0, padding: '4px', background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="حذف">
                          <X size={16} weight="bold" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {newIntern.other_documents.length > 0 && (
                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                  {newIntern.other_documents.map((otherDoc, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--paper)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 2 }}>
                        <button type="button" onClick={() => removeOtherDocument(idx)} style={{ background: 'var(--danger-bg)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--danger)', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="حذف المستند">
                          <X size={14} weight="bold" />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        placeholder="اسم المستند..." 
                        value={otherDoc.name}
                        onChange={(e) => {
                          const newOthers = [...newIntern.other_documents];
                          newOthers[idx].name = e.target.value;
                          setNewIntern({...newIntern, other_documents: newOthers});
                        }}
                        style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid var(--line)', borderRadius: '4px', outline: 'none', width: 'calc(100% - 28px)' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label style={{ 
                          flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          background: otherDoc.file ? 'var(--success-bg)' : '#fff', 
                          color: otherDoc.file ? 'var(--success)' : 'var(--slate)', 
                          border: `1px dashed ${otherDoc.file ? 'var(--success)' : 'var(--line)'}`, 
                          padding: '8px', borderRadius: '4px', fontSize: '12px', transition: 'all 0.2s', margin: 0 
                        }}>
                          <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'other', idx)} />
                          {otherDoc.file ? 'تم الرفع ✓' : 'اختر ملف PDF...'}
                        </label>
                        {otherDoc.file && (
                          <button type="button" onClick={() => {
                            const newOthers = [...newIntern.other_documents];
                            newOthers[idx].file = '';
                            setNewIntern({...newIntern, other_documents: newOthers});
                          }} style={{ flexShrink: 0, padding: '4px', background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="إزالة الملف">
                            <X size={14} weight="bold" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button type="button" onClick={addOtherDocument} className="btn btn-ghost sm" style={{ marginTop: '16px' }}>
                <Plus size={14} /> إضافة مستند آخر
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid var(--line-soft)', paddingTop: '20px' }}>
              <div>
                <TestModeAutofill onFill={(data) => setNewIntern({ ...newIntern, ...data })} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => {
                setIsFormOpen(false);
                setEditingInternId(null);
              }}>إلغاء</button>
              <button type="submit" className="btn btn-ink">
                {editingInternId ? 'حفظ التعديلات' : 'إضافة المتدرب'}
              </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {!isFormOpen && interns.length > 0 ? (
        <>
          <div className="toolbar" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="filter-input">
              <MagnifyingGlass weight="bold" className="icon" />
              <input 
                type="text" 
                placeholder="ابحث بالاسم أو الرقم..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-input">
              <Funnel weight="bold" className="icon" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">كل الحالات</option>
                <option value="نشط">نشط</option>
                <option value="مستندات ناقصة">مستندات ناقصة</option>
                <option value="قيد المراجعة">قيد المراجعة</option>
                <option value="منتهي">منتهي</option>
              </select>
              <CaretDown weight="bold" className="icon" style={{ marginLeft: '-5px' }} />
            </div>

            <button 
              className="btn btn-ink" 
              onClick={() => setAppliedFilters({ query: searchQuery, status: filterStatus })}
            >
              تطبيق الفلتر
            </button>
            <button 
              className="btn btn-ghost" 
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('');
                setAppliedFilters({ query: '', status: '' });
              }}
            >
              مسح الفلتر
            </button>
          </div>

          {filteredInterns.length > 0 ? (
            <div className="dossier-grid">
              {filteredInterns.map(intern => (
                <div key={intern.id} className="dossier" onClick={() => navigate(`/interns/${intern.id}`)}>
                  <div className="stamp">
                    {intern.status === 'نشط' && <span className="badge ok"><div className="dot"></div>نشط</span>}
                    {intern.status === 'مستندات ناقصة' && <span className="badge bad"><div className="dot"></div>مستندات ناقصة</span>}
                    {intern.status === 'قيد المراجعة' && <span className="badge warn"><div className="dot"></div>قيد المراجعة</span>}
                    {intern.status === 'منتهي' && <span className="badge" style={{background: 'var(--paper)', color: 'var(--slate)'}}><div className="dot"></div>منتهي</span>}
                  </div>
                  
                  <div className="dossier-top">
                    <img src={intern.photo_path || `https://i.pravatar.cc/150?u=${intern.id}`} alt={intern.name} className="dossier-photo" />
                    <div>
                      <div className="dossier-name">{intern.name}</div>
                      <div className="dossier-role">متدرب</div>
                    </div>
                  </div>
                  
                  <div className="dossier-meta">
                    <span>ID: {2026000 + intern.id}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--slate)', background: 'var(--paper)', borderRadius: '16px', marginTop: '20px' }}>
              <MagnifyingGlass size={48} weight="duotone" style={{ opacity: 0.5, marginBottom: '16px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--ink)' }}>لا توجد نتائج مطابقة</div>
              <p style={{ marginTop: '8px' }}>حاول تغيير خيارات البحث أو الفلتر للحصول على نتائج.</p>
              <button className="btn btn-ghost" style={{ marginTop: '16px' }} onClick={() => {
                setFilterStatus('');
                setAppliedFilters({ query: '', status: '' });
              }}>
                مسح الفلتر
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--slate)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--slate-light)' }}>
            <MagnifyingGlass size={32} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: 'var(--ink)' }}>لا يوجد متدربين بعد</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>قم بإضافة أول متدرب باستخدام الزر أعلاه للبدء</p>
        </div>
      )}



    </div>
  );
}
