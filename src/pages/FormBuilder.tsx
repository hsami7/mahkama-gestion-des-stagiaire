import React, { useState, useEffect } from 'react';
import { Plus, Trash, Check, Copy, Link, PencilSimple, ToggleLeft, ToggleRight, ArrowLeft } from '@phosphor-icons/react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

type FieldType = 'text' | 'email' | 'number' | 'photo' | 'date' | 'pdf';

type MapsTo = '' | 'name' | 'name_fr' | 'email' | 'national_id' | 'phone' | 'university'
  | 'start_date' | 'end_date' | 'date_of_birth' | 'address' | 'department' | 'photo_path';

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  maps_to: MapsTo;
}

interface SavedForm {
  id: number;
  title: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  form_data: string;
  pending_count: number;
}

const MAPS_TO_LABELS: Record<string, string> = {
  '': 'لا يوجد ربط',
  'name': 'اسم المتدرب (عربي)',
  'name_fr': 'اسم المتدرب (فرنسي)',
  'email': 'البريد الإلكتروني',
  'national_id': 'رقم البطاقة الوطنية',
  'phone': 'رقم الهاتف',
  'university': 'الجامعة / المؤسسة',
  'start_date': 'تاريخ البدء',
  'end_date': 'تاريخ الانتهاء',
  'date_of_birth': 'تاريخ الميلاد',
  'address': 'العنوان',
  'department': 'القسم / الدائرة',
  'photo_path': 'الصورة الشخصية',
};

function formatDate(d: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('ar-MA', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return d; }
}

export function FormBuilder() {
  const toast = useToast();
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [editingForm, setEditingForm] = useState<SavedForm | null>(null);

  // Builder state
  const [formTitle, setFormTitle] = useState('نموذج تسجيل المتدربين');
  const [fields, setFields] = useState<FormField[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<FieldType>('text');
  const [newRequired, setNewRequired] = useState(false);
  const [newMapsTo, setNewMapsTo] = useState<MapsTo>('');
  const [saving, setSaving] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);

  const loadForms = async () => {
    try {
      const data = await api.get('/forms');
      setSavedForms(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadForms(); }, []);

  const openNewBuilder = () => {
    setEditingForm(null);
    setFormTitle('نموذج تسجيل المتدربين');
    setFields([]);
    setGeneratedSlug(null);
    setView('builder');
  };

  const openEditBuilder = (form: SavedForm) => {
    setEditingForm(form);
    setFormTitle(form.title);
    try { setFields(JSON.parse(form.form_data)); } catch { setFields([]); }
    setGeneratedSlug(form.slug);
    setView('builder');
  };

  const addField = () => {
    if (!newLabel.trim()) { toast.info('أدخل اسم الحقل'); return; }
    setFields(prev => [...prev, {
      id: Date.now().toString(),
      label: newLabel.trim(),
      type: newType,
      required: newRequired,
      maps_to: newMapsTo,
    }]);
    setNewLabel('');
    setNewRequired(false);
    setNewMapsTo('');
  };

  const removeField = (id: string) => setFields(prev => prev.filter(f => f.id !== id));

  const saveForm = async () => {
    if (!fields.length) { toast.info('أضف حقلاً واحداً على الأقل'); return; }
    setSaving(true);
    try {
      const payload: any = { title: formTitle, form_data: fields };
      if (editingForm) payload.id = editingForm.id;
      const res = await api.post('/forms', payload);
      setGeneratedSlug(res.slug);
      toast.success('تم حفظ النموذج بنجاح!');
      loadForms();
      if (!editingForm) {
        setEditingForm({ ...editingForm!, id: res.id, slug: res.slug, title: res.title, is_active: true, created_at: '', form_data: JSON.stringify(fields), pending_count: 0 });
      }
    } catch (err) {
      toast.error('فشل حفظ النموذج');
    } finally {
      setSaving(false);
    }
  };

  const deleteForm = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا النموذج؟')) return;
    try {
      await api.delete(`/forms/${id}`);
      toast.success('تم حذف النموذج');
      loadForms();
    } catch { toast.error('فشل الحذف'); }
  };

  const toggleForm = async (id: number) => {
    try {
      await api.post(`/forms/${id}/toggle`, {});
      loadForms();
    } catch { toast.error('فشل تغيير الحالة'); }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/apply/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ الرابط: ' + url);
  };

  const publicUrl = (slug: string) => `${window.location.origin}/apply/${slug}`;

  // ===================== LIST VIEW =====================
  if (view === 'list') {
    return (
      <div>
        <div className="section-head">
          <div>
            <h2 style={{ marginTop: 0 }}>منشئ النماذج</h2>
            <p>إنشاء نماذج التقديم وإدارة طلبات التسجيل</p>
          </div>
          <button className="btn btn-gold" onClick={openNewBuilder}>
            <Plus size={18} weight="bold" /> إنشاء نموذج جديد
          </button>
        </div>

        {savedForms.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--slate)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: 16 }}>لا توجد نماذج بعد</p>
            <button className="btn btn-gold" onClick={openNewBuilder}>
              <Plus size={18} /> إنشاء أول نموذج
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {savedForms.map(form => (
              <div key={form.id} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--ink)' }}>{form.title}</strong>
                    <span className={`badge ${form.is_active ? 'ok' : ''}`} style={!form.is_active ? { background: 'var(--paper)', color: 'var(--slate)' } : {}}>
                      <div className="dot"></div>{form.is_active ? 'نشط' : 'موقوف'}
                    </span>
                    {form.pending_count > 0 && (
                      <span className="badge warn"><div className="dot"></div>{form.pending_count} طلب معلق</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Link size={13} />
                    <code style={{ background: 'var(--paper)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>
                      /apply/{form.slug}
                    </code>
                    {form.created_at && <span>· {formatDate(form.created_at)}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost sm" onClick={() => copyLink(form.slug)} title="نسخ الرابط">
                    <Copy size={15} /> نسخ الرابط
                  </button>
                  <button className="btn btn-ghost sm" onClick={() => openEditBuilder(form)} title="تعديل">
                    <PencilSimple size={15} /> تعديل
                  </button>
                  <button className="btn btn-ghost sm" onClick={() => toggleForm(form.id)} title={form.is_active ? 'إيقاف' : 'تفعيل'}>
                    {form.is_active ? <ToggleRight size={15} weight="fill" color="var(--success)" /> : <ToggleLeft size={15} />}
                    {form.is_active ? 'إيقاف' : 'تفعيل'}
                  </button>
                  <button className="btn btn-ghost sm" onClick={() => deleteForm(form.id)} style={{ color: 'var(--danger)' }} title="حذف">
                    <Trash size={15} /> حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===================== BUILDER VIEW =====================
  return (
    <div>
      <div className="section-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => { setView('list'); loadForms(); }}>
            <ArrowLeft size={18} /> العودة للقائمة
          </button>
          <h2 style={{ margin: 0 }}>{editingForm ? 'تعديل النموذج' : 'نموذج جديد'}</h2>
        </div>
        <button className="btn btn-gold" onClick={saveForm} disabled={saving}>
          <Check size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ النموذج'}
        </button>
      </div>

      {/* Form title */}
      <div className="card" style={{ padding: '16px 22px', marginBottom: 20 }}>
        <label className="form-label">عنوان النموذج</label>
        <input
          type="text"
          className="input"
          value={formTitle}
          onChange={e => setFormTitle(e.target.value)}
          placeholder="مثال: نموذج تسجيل دفعة 2026"
          style={{ maxWidth: 450 }}
        />
      </div>

      {/* Generated link */}
      {generatedSlug && (
        <div className="card" style={{ padding: '14px 22px', marginBottom: 20, background: '#F0FDF4', borderRight: '4px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 'bold', color: 'var(--success)', marginBottom: 4 }}>رابط النموذج العام</div>
            <code style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>{publicUrl(generatedSlug)}</code>
          </div>
          <button className="btn btn-ghost sm" onClick={() => copyLink(generatedSlug)}>
            <Copy size={15} /> نسخ الرابط
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Builder Side */}
        <div className="card" style={{ padding: '22px' }}>
          <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: '1rem' }}>إضافة حقل جديد</h3>

          <div className="form-group">
            <label className="form-label">اسم الحقل / السؤال</label>
            <input
              type="text"
              className="input"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addField()}
              placeholder="مثال: الاسم الكامل"
            />
          </div>

          <div className="form-group">
            <label className="form-label">نوع الحقل</label>
            <select className="input" value={newType} onChange={e => setNewType(e.target.value as FieldType)}>
              <option value="text">نص (Text)</option>
              <option value="email">بريد إلكتروني (Email)</option>
              <option value="number">رقم (Number)</option>
              <option value="date">تاريخ (Date)</option>
              <option value="photo">صورة (Photo)</option>
              <option value="pdf">مستند PDF</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">ربط بحقل الملف الشخصي</label>
            <select className="input" value={newMapsTo} onChange={e => setNewMapsTo(e.target.value as MapsTo)}>
              {Object.entries(MAPS_TO_LABELS).map(([val, lbl]) => (
                <option key={val} value={val}>{lbl}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              id="required-chk"
              checked={newRequired}
              onChange={e => setNewRequired(e.target.checked)}
              style={{ accentColor: 'var(--gold)', width: 18, height: 18, cursor: 'pointer', margin: 0 }}
            />
            <label htmlFor="required-chk" style={{ cursor: 'pointer', margin: 0, fontWeight: 'bold' }}>حقل مطلوب (Required)</label>
          </div>

          <button className="btn btn-gold" onClick={addField} style={{ width: '100%', justifyContent: 'center' }}>
            <Plus size={20} /> إضافة إلى النموذج
          </button>
        </div>

        {/* Preview Side */}
        <div className="card" style={{ backgroundColor: 'var(--bg-color)', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>معاينة النموذج</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>{fields.length} حقول</span>
          </div>

          <div style={{ background: 'white', padding: 20, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ textAlign: 'center', padding: '10px 0 16px', borderBottom: '1px solid var(--line)' }}>
              <strong style={{ fontSize: '1.05rem', color: 'var(--ink)' }}>{formTitle}</strong>
            </div>

            {fields.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--slate)', padding: 20 }}>النموذج فارغ</div>
            ) : (
              fields.map((field) => (
                <div key={field.id} style={{ position: 'relative', padding: 14, border: '1px solid var(--line)', borderRadius: 8 }}>
                  <button
                    onClick={() => removeField(field.id)}
                    style={{ position: 'absolute', top: 8, left: 8, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 2 }}
                  >
                    <Trash size={16} />
                  </button>
                  <label className="form-label" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {field.label}
                    {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                    {field.maps_to && (
                      <span style={{ fontSize: '0.72rem', background: 'var(--gold-light, #FEF3C7)', color: 'var(--gold-dark)', padding: '1px 6px', borderRadius: 4 }}>
                        → {MAPS_TO_LABELS[field.maps_to]}
                      </span>
                    )}
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
          </div>
        </div>
      </div>
    </div>
  );
}
