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
    <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '40px 20px', fontFamily: "'Cairo', 'Arial', sans-serif" }} dir="rtl">
      <div style={{ maxWidth: '620px', margin: '0 auto', background: 'white', borderRadius: '16px', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: '32px 32px 28px', textAlign: 'center' }}>
          <h1 style={{ color: '#B8960C', fontSize: '1.5rem', margin: '0 0 8px', fontWeight: 700 }}>{formTitle}</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.9rem' }}>يرجى ملء جميع الحقول المطلوبة بدقة</p>
        </div>

        {/* Form body */}
        <div style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {fields.map(field => (
              <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e' }}>
                  {field.label}
                  {field.required && <span style={{ color: '#EF4444', marginRight: 4 }}>*</span>}
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
                      style={{ ...inputStyle, cursor: 'pointer', padding: '10px', background: '#F9FAFB', border: '2px dashed #D1D5DB' }}
                      accept={field.type === 'photo' ? 'image/*' : '.pdf'}
                      onChange={e => { if (e.target.files?.[0]) handleFileUpload(field.label, e.target.files[0]); }}
                      required={field.required && !formData[field.label]}
                    />
                    {formData[field.label] && (
                      <div style={{ marginTop: 6, fontSize: '0.82rem', color: '#22C55E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={14} weight="fill" /> تم الرفع بنجاح
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 8, padding: '14px 24px', background: submitting ? '#9CA3AF' : '#B8960C',
                color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem',
                fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s', fontFamily: 'inherit'
              }}
            >
              {submitting ? 'جاري الإرسال...' : (<><span>إرسال الطلب</span><PaperPlaneRight size={20} /></>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1.5px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: '0.95rem',
  fontFamily: "'Cairo', 'Arial', sans-serif",
  outline: 'none',
  background: '#FAFAFA',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
