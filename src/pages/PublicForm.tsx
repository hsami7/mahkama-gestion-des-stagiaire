import { useState, useEffect } from 'react';
import { PaperPlaneRight, CheckCircle, Warning } from '@phosphor-icons/react';
import { useToast } from '../components/Toast';

// Assuming we have a base URL for our public endpoints
const API_BASE = '/api';

interface Field {
  id: string;
  label: string;
  type: string;
  required: boolean;
}

export default function PublicForm() {
  const toast = useToast();
  const [fields, setFields] = useState<Field[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the form layout
    fetch(`${API_BASE}/public-form`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.form_data) {
          try {
            const parsed = JSON.parse(data.form_data);
            setFields(parsed);
          } catch (e) {
            console.error("Failed to parse form data");
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching form", err);
        setError("تعذر تحميل النموذج. يرجى المحاولة لاحقاً.");
        setLoading(false);
      });
  }, []);

  const handleChange = (label: string, value: any) => {
    setFormData(prev => ({ ...prev, [label]: value }));
  };

  const handleFileUpload = async (label: string, file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      toast.warning("حجم الملف يجب أن لا يتجاوز 15 ميجابايت");
      return;
    }
    
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    
    try {
      const res = await fetch(`${API_BASE}/public-upload`, {
        method: 'POST',
        body: formDataObj
      });
      const data = await res.json();
      if (res.ok && data.filename) {
        // Here we store the path or filename in formData
        handleChange(label, data.path || data.filename);
      } else {
        toast.error("فشل رفع الملف: " + (data.msg || ""));
      }
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء رفع الملف");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    for (const field of fields) {
      if (field.required && !formData[field.label]) {
        toast.info(`حقل "${field.label}" مطلوب`);
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      const res = await fetch(`${API_BASE}/public-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.msg || "حدث خطأ أثناء الإرسال");
      }
    } catch (err) {
      console.error(err);
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="loader" style={{color: 'var(--ink)'}}>جاري التحميل...</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <CheckCircle size={64} weight="duotone" color="var(--success)" style={{ marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '12px', color: 'var(--ink)' }}>تم استلام طلبك بنجاح!</h2>
          <p style={{ color: 'var(--slate)', lineHeight: 1.6 }}>شكراً لك على التقديم. سيتم مراجعة طلبك والتواصل معك قريباً.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', padding: '40px 20px', fontFamily: "'Cairo', sans-serif" }} dir="rtl">
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderTop: '6px solid var(--gold)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: 'var(--ink)', fontSize: '24px', margin: '0 0 8px' }}>استمارة التقديم للتدريب</h1>
          <p style={{ color: 'var(--slate)', margin: 0 }}>يرجى ملء جميع الحقول المطلوبة أدناه بدقة.</p>
        </div>
        
        {error && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Warning size={20} />
            {error}
          </div>
        )}
        
        {fields.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--slate)', padding: '20px' }}>
            لا يوجد نموذج متاح حالياً.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {fields.map(field => (
              <div key={field.id} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label" style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--ink)' }}>
                  {field.label} {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                </label>
                
                {field.type === 'text' && (
                  <input 
                    type="text" 
                    className="input" 
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    value={formData[field.label] || ''}
                    onChange={e => handleChange(field.label, e.target.value)}
                    required={field.required}
                  />
                )}
                
                {field.type === 'email' && (
                  <input 
                    type="email" 
                    className="input" 
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    value={formData[field.label] || ''}
                    onChange={e => handleChange(field.label, e.target.value)}
                    required={field.required}
                  />
                )}
                
                {field.type === 'number' && (
                  <input 
                    type="number" 
                    className="input" 
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    value={formData[field.label] || ''}
                    onChange={e => handleChange(field.label, e.target.value)}
                    required={field.required}
                  />
                )}
                
                {field.type === 'date' && (
                  <input 
                    type="date" 
                    className="input" 
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    value={formData[field.label] || ''}
                    onChange={e => handleChange(field.label, e.target.value)}
                    required={field.required}
                  />
                )}
                
                {(field.type === 'photo' || field.type === 'pdf') && (
                  <div>
                    <input 
                      type="file" 
                      className="input"
                      style={{ padding: '10px', borderRadius: '8px', border: '1px dashed var(--line)', background: 'var(--paper)', cursor: 'pointer', width: '100%' }}
                      accept={field.type === 'photo' ? "image/*" : ".pdf"}
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(field.label, e.target.files[0]);
                        }
                      }}
                      required={field.required && !formData[field.label]}
                    />
                    {formData[field.label] && (
                      <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--success)', fontWeight: 'bold' }}>
                        تم الرفع بنجاح ✓
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            <button 
              type="submit" 
              className="btn btn-gold" 
              style={{ padding: '14px', fontSize: '16px', justifyContent: 'center', marginTop: '10px', borderRadius: '8px' }}
              disabled={submitting}
            >
              {submitting ? 'جاري الإرسال...' : (
                <>
                  إرسال الطلب
                  <PaperPlaneRight size={20} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
