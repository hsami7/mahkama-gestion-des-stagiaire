import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PaperPlaneRight, CheckCircle, Warning } from '@phosphor-icons/react';
import { useToast } from '../components/Toast';

const API_BASE = '/api';

interface Field {
  id: string;
  label: string;
  type: string;
  required: boolean;
  maps_to?: string;
}

export default function PublicForm() {
  const { slug } = useParams<{ slug: string }>();
  const toast = useToast();
  const [formTitle, setFormTitle] = useState('استمارة التقديم للتدريب');
  const [fields, setFields] = useState<Field[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('رابط النموذج غير صالح.');
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/public-form/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFields(data.form_data || []);
          setFormTitle(data.title || 'استمارة التقديم للتدريب');
        } else {
          setError(data.msg || 'تعذر تحميل النموذج.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً.');
        setLoading(false);
      });
  }, [slug]);

  const handleChange = (label: string, value: any) => {
    setFormData(prev => ({ ...prev, [label]: value }));
  };

  const handleFileUpload = async (label: string, file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      toast.warning('حجم الملف يجب أن لا يتجاوز 15 ميجابايت');
      return;
    }
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/public-upload`, { method: 'POST', body: formDataObj });
      const data = await res.json();
      if (res.ok && (data.filename || data.path)) {
        handleChange(label, data.path || `/api/uploads/${data.filename}`);
        toast.success('تم رفع الملف بنجاح');
      } else {
        toast.error('فشل رفع الملف: ' + (data.msg || ''));
      }
    } catch {
      toast.error('حدث خطأ أثناء رفع الملف');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const field of fields) {
      if (field.required && !formData[field.label]) {
        toast.info(`حقل "${field.label}" مطلوب`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/public-form/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.msg || 'حدث خطأ أثناء الإرسال');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8F9FA' }}>
        <div style={{ color: '#555' }}>جاري التحميل...</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8F9FA', padding: '20px' }}>
        <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '48px 32px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
          <CheckCircle size={72} weight="duotone" color="#22C55E" style={{ marginBottom: '20px' }} />
          <h2 style={{ marginBottom: '12px', color: '#1a1a2e', fontSize: '1.5rem' }}>تم استلام طلبك بنجاح!</h2>
          <p style={{ color: '#6B7280', lineHeight: 1.7, fontSize: '1rem' }}>
            شكراً لتقديمك. لقد تم استلام طلبك وهو الآن <strong>قيد المراجعة</strong>.
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: 12 }}>
            ستصلك رسالة على بريدك الإلكتروني بمجرد اتخاذ القرار.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8F9FA', padding: '20px' }}>
        <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '40px 24px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <Warning size={56} weight="duotone" color="#EF4444" style={{ marginBottom: '16px' }} />
          <h2 style={{ color: '#1a1a2e', marginBottom: 8 }}>غير متاح</h2>
          <p style={{ color: '#6B7280' }}>{error}</p>
        </div>
      </div>
    );
  }

return (
    <div style={{ minHeight: '100vh', background: '#F0EBF8', padding: '40px 20px', fontFamily: "'Cairo', 'Arial', sans-serif" }} dir="rtl">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Top color bar */}
        <div style={{ background: '#673AB7', height: 12, borderRadius: '12px 12px 0 0' }} />

        <div style={{ background: 'white', borderRadius: '0 0 12px 12px', boxShadow: '0 1px 6px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #E0E0E0' }}>
            <h1 style={{ color: '#202124', fontSize: '1.4rem', margin: '0 0 6px', fontWeight: 400 }}>{formTitle}</h1>
            <p style={{ color: '#70757A', margin: 0, fontSize: '0.82rem' }}>يرجى ملء جميع الحقول المطلوبة *</p>
          </div>

          {/* Form body */}
          <div style={{ padding: '24px 32px 32px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {fields.map(field => (
                <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#70757A', fontWeight: 500 }}>
                    {field.label}
                    {field.required && <span style={{ color: '#D93025' }}> *</span>}
                  </label>

                  {field.type === 'text' && (
                    <input type="text" style={inputStyle} value={formData[field.label] || ''} onChange={e => handleChange(field.label, e.target.value)} required={field.required} />
                  )}
                  {field.type === 'email' && (
                    <input type="email" style={inputStyle} value={formData[field.label] || ''} onChange={e => handleChange(field.label, e.target.value)} required={field.required} />
                  )}
                  {field.type === 'number' && (
                    <input type="number" style={inputStyle} value={formData[field.label] || ''} onChange={e => handleChange(field.label, e.target.value)} required={field.required} />
                  )}
                  {field.type === 'date' && (
                    <input type="date" style={inputStyle} value={formData[field.label] || ''} onChange={e => handleChange(field.label, e.target.value)} required={field.required} />
                  )}
                  {(field.type === 'photo' || field.type === 'pdf') && (
                    <div>
                      <input
                        type="file"
                        style={{ ...inputStyle, cursor: 'pointer', padding: '10px', background: '#F6F8FC', border: '1px solid #DADCE0', borderRadius: 4 }}
                        accept={field.type === 'photo' ? 'image/*' : '.pdf'}
                        onChange={e => { if (e.target.files?.[0]) handleFileUpload(field.label, e.target.files[0]); }}
                        required={field.required && !formData[field.label]}
                      />
                      {formData[field.label] && (
                        <div style={{ marginTop: 4, fontSize: '0.78rem', color: '#188038', fontWeight: 500 }}>
                          ✓ تم الرفع بنجاح
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: 20, display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 24px',
                    background: submitting ? '#9CA3AF' : '#673AB7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'background 0.2s',
                    fontFamily: 'inherit',
                    letterSpacing: '0.3px',
                  }}
                >
                  {submitting ? 'جاري الإرسال...' : (<><span>إرسال</span><PaperPlaneRight size={18} /></>)}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem', color: '#9AA0A6' }}>
          <span> powered by MYP</span>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: 'none',
  borderBottom: '1px solid #DADCE0',
  borderRadius: 0,
  fontSize: '0.95rem',
  fontFamily: "'Cairo', 'Arial', sans-serif",
  outline: 'none',
  background: 'transparent',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
