import React, { useState } from 'react';
import { Plus, Trash, Check, X } from '@phosphor-icons/react';

type FieldType = 'text' | 'email' | 'number' | 'photo';

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
}

export function FormBuilder() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<FieldType>('text');
  const [newRequired, setNewRequired] = useState(false);

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
      <div className="card">
        <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>إضافة حقل جديد</h2>
        
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
            <option value="photo">صورة (Photo)</option>
          </select>
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            id="required-chk" 
            checked={newRequired} 
            onChange={(e) => setNewRequired(e.target.checked)} 
          />
          <label htmlFor="required-chk">حقل مطلوب (Required)</label>
        </div>

        <button className="btn" onClick={addField} style={{ width: '100%', justifyContent: 'center' }}>
          <Plus size={20} /> إضافة إلى النموذج
        </button>
      </div>

      {/* Preview Side */}
      <div className="card" style={{ backgroundColor: 'var(--bg-color)' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between' }}>
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
                {field.type === 'photo' ? (
                  <div style={{ border: '2px dashed var(--border-color)', padding: '24px', textAlign: 'center', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                    انقر لرفع صورة
                  </div>
                ) : (
                  <input 
                    type={field.type} 
                    className="input" 
                    placeholder={`أدخل ${field.label}...`} 
                    disabled 
                  />
                )}
              </div>
            ))
          )}
          
          {fields.length > 0 && (
            <button className="btn" style={{ justifyContent: 'center', marginTop: '16px' }}>إرسال الطلب</button>
          )}
        </div>
      </div>
    </div>
  );
}
