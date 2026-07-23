import React, { useState, useEffect } from 'react';
import { UploadSimple, FilePdf, DownloadSimple, Trash, FolderOpen, Eye, FileDoc } from '@phosphor-icons/react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

export function DocumentVault() {
  const toast = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const token = sessionStorage.getItem('token');

  const fetchDocuments = async () => {
    try {
      const data = await api.get('/vault');
      setDocuments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.doc')) {
      toast.warning('عذراً، يُسمح فقط برفع ملفات PDF و Word');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('عذراً، حجم الملف يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (docName.trim()) {
      formData.append('custom_name', docName.trim());
    }

    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        setFile(null);
        setDocName('');
        const fileInput = document.getElementById('vault-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        fetchDocuments();
      } else {
        const data = await res.json();
        toast.error(data.msg || 'فشل رفع الملف');
      }
    } catch (err) {
      console.error(err);
      toast.error('فشل رفع الملف');
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${filename}"؟`)) return;
    try {
      await api.delete(`/vault/${filename}`);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      toast.error('فشل حذف الملف');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>خزنة المستندات</h1>
          <p style={{ color: 'var(--slate)' }}>النماذج والمستندات القياسية الجاهزة للمتدربين</p>
        </div>
      </div>

      <div className="card" style={{ padding: '22px', marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px' }}>رفع مستند جديد للخزنة</h2>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input 
              type="text"
              placeholder="اسم المستند"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', outline: 'none', background: 'var(--paper)' }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'}
              onBlur={e => e.target.style.borderColor = 'var(--line)'}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label 
              className="btn btn-ghost" 
              style={{ flex: 1, border: '1px dashed var(--line)', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '10px' }}
            >
              {file?.name?.toLowerCase().endsWith('.docx') || file?.name?.toLowerCase().endsWith('.doc') ? <FileDoc size={18} /> : <FilePdf size={18} />}
              {file ? file.name : 'اختر ملف PDF أو Word'}
              <input 
                id="vault-file-input"
                type="file" 
                accept=".pdf,.docx,.doc"
                required
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null;
                  setFile(selectedFile);
                  if (selectedFile && !docName) {
                    setDocName(selectedFile.name.replace(/\.(pdf|docx|doc)$/i, ''));
                  }
                }}
                style={{ display: 'none' }}
              />
            </label>
            <button 
              type="submit" 
              disabled={!file}
              className="btn btn-ink"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', whiteSpace: 'nowrap' }}
            >
              <UploadSimple size={18} />
              رفع الملف
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
        {documents.map((doc, i) => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', padding: '24px' }}>
            <button 
              onClick={() => handleDelete(doc.name)}
              style={{ 
                position: 'absolute', top: '12px', left: '12px', 
                background: 'var(--paper)', color: 'var(--danger)', 
                border: '1px solid var(--danger)', borderRadius: '8px',
                width: '32px', height: '32px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="حذف"
            >
              <Trash size={16} weight="regular" />
            </button>
            <div style={{ width: '70px', height: '70px', backgroundColor: doc.name.toLowerCase().endsWith('.pdf') ? 'var(--danger-bg)' : '#e0f0ff', color: doc.name.toLowerCase().endsWith('.pdf') ? 'var(--danger)' : '#0056b3', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              {doc.name.toLowerCase().endsWith('.pdf') ? <FilePdf size={36} weight="regular" /> : <FileDoc size={36} weight="regular" />}
            </div>
            <h3 style={{ fontWeight: 'bold', marginBottom: '8px', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dir="ltr">{doc.name.replace(/\.(pdf|docx|doc)$/i, '')}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate)', marginBottom: '24px' }}>KB {(doc.size / 1024).toFixed(1)}</p>
            <div style={{ width: '100%', marginTop: 'auto', display: 'flex', gap: '10px' }}>
              <a 
                href={`/api/vault/${doc.name}`} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-ghost"
                style={{ flex: 1, display: 'flex', justifyContent: 'center', textDecoration: 'none', gap: '6px', padding: '10px 0', fontSize: '0.9rem', borderRadius: '10px' }}
              >
                <Eye size={18} />
                عرض
              </a>
              <a 
                href={`/api/vault/${doc.name}`} 
                download={doc.name}
                className="btn btn-ink"
                style={{ flex: 1, display: 'flex', justifyContent: 'center', textDecoration: 'none', gap: '6px', padding: '10px 0', fontSize: '0.9rem', borderRadius: '10px' }}
              >
                <DownloadSimple size={18} />
                تحميل
              </a>
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px 0', color: 'var(--slate)' }}>
            <FolderOpen size={48} weight="duotone" style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ fontWeight: 600 }}>لا توجد مستندات في الخزنة حالياً</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>ارفع نماذج ومستندات قياسية لتسهيل الوصول إليها</div>
          </div>
        )}
      </div>
    </div>
  );
}
