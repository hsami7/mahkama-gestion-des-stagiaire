import React, { useState, useEffect } from 'react';
import { Plus, Trash, Check, X } from '@phosphor-icons/react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

type FieldType = 'text' | 'email' | 'number' | 'photo' | 'date' | 'pdf';

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
}

export function FormBuilder() {
  const toast = useToast();
  const [fields, setFields] = useState<FormField[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<FieldType>('text');
  const [newRequired, setNewRequired] = useState(false);

  useEffect(() => {
    api.get('/forms').then(data => {
      try {
        setFields(JSON.parse(data.form_data));
      } catch (e) {
        setFields([]);
      }
    }).catch(console.error);
  }, []);

  const saveForm = async () => {
    try {
      await api.post('/forms', { form_data: fields });
      toast.success('تم حفظ النموذج بنجاح!');
    } catch (err) {
      console.error(err);
      toast.error('فشل حفظ النموذج');
    }
  };

  const addField = () => {
    if (!newLabel) return;
    setFields([...fields, { id: Date.now().toString(), label: newLabel, type: newType, required: newRequired }]);
    setNewLabel('');
    setNewRequired(false);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      
      {/* Builder Side */}
      <div className="card" style={{ padding: '22px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.2rem' }}>إضافة حقل جديد</h2>
        
        <div className="form-group">
          <label className="form-label">اسم السؤال / الحقل</label>
          <input 
            type="text" 
            className="input" 
            value={newLabel} 
            onChange={(e) => setNewLabel(e.target.value)} 
            placeholder="مثال: الاسم الكامل" 
          />
        </div>

        <div className="form-group">
          <label className="form-label">نوع الحقل</label>
          <select className="input" value={newType} onChange={(e) => setNewType(e.target.value as FieldType)}>
            <option value="text">نص (Text)</option>
            <option value="email">بريد إلكتروني (Email)</option>
            <option value="number">رقم (Number)</option>
            <option value="date">تاريخ (Date)</option>
            <option value="photo">صورة (Photo)</option>
            <option value="pdf">مستند (PDF)</option>
          </select>
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start', marginBottom: '20px' }}>
          <input 
            type="checkbox" 
            id="required-chk" 
            checked={newRequired} 
            onChange={(e) => setNewRequired(e.target.checked)} 
            style={{ 
              accentColor: 'var(--gold)', 
              width: '18px', 
              height: '18px', 
              cursor: 'pointer',
              margin: 0
            }}
          />
          <label htmlFor="required-chk" style={{ cursor: 'pointer', margin: 0, fontWeight: 'bold' }}>حقل مطلوب (Required)</label>
        </div>

        <button className="btn" onClick={addField} style={{ width: '100%', justifyContent: 'center' }}>
          <Plus size={20} /> إضافة إلى النموذج
        </button>
      </div>

      {/* Preview Side */}
      <div className="card" style={{ backgroundColor: 'var(--bg-color)', padding: '22px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>معاينة النموذج</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{fields.length} حقول</span>
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'white', padding: '24px', borderRadius: '8px' }}>
          {fields.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
              النموذج فارغ، قم بإضافة حقول من القائمة
            </div>
          ) : (
            fields.map((field) => (
              <div key={field.id} style={{ position: 'relative', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <button 
                  onClick={() => removeField(field.id)}
                  style={{ position: 'absolute', top: '8px', left: '8px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                >
                  <Trash size={20} />
                </button>
                <label className="form-label">
                  {field.label} {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                </label>
                {field.type === 'text' && <input type="text" className="input" placeholder="نص..." disabled />}
                {field.type === 'email' && <input type="email" className="input" placeholder="email@example.com" disabled />}
                {field.type === 'number' && <input type="number" className="input" placeholder="0" disabled />}
                {field.type === 'date' && <input type="date" className="input" disabled />}
                {field.type === 'photo' && <input type="file" className="input" accept="image/*" disabled />}
                {field.type === 'pdf' && <input type="file" className="input" accept=".pdf" disabled />}
              </div>
            ))
          )}
          
          {fields.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-ink" onClick={saveForm} style={{ flex: 1, justifyContent: 'center' }}>
                <Check size={18} />
                حفظ النموذج
              </button>
              <button 
                className="btn btn-gold" 
                onClick={() => {
                  const url = `${window.location.origin}/apply`;
                  navigator.clipboard.writeText(url);
                  toast.success('تم نسخ رابط النموذج العام: ' + url);
                }} 
                style={{ flex: 1, justifyContent: 'center' }}
              >
                نسخ رابط النشر
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
