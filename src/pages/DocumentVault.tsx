import React, { useState, useEffect } from 'react';
import { UploadSimple, FilePdf, DownloadSimple, Trash } from '@phosphor-icons/react';

export function DocumentVault() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const token = localStorage.getItem('token');

  const fetchDocuments = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDocuments(data);
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

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        setFile(null);
        fetchDocuments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">خزنة المستندات</h1>
          <p className="text-gray-500 mt-1">إدارة النماذج والمستندات القياسية الجاهزة للطباعة</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">رفع مستند جديد</h2>
        <form onSubmit={handleUpload} className="flex gap-4 items-center">
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button 
            type="submit" 
            disabled={!file}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <UploadSimple size={20} />
            رفع الملف
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
              <FilePdf size={32} weight="duotone" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1 truncate w-full" dir="ltr">{doc.name}</h3>
            <p className="text-xs text-gray-400 mb-4">{(doc.size / 1024).toFixed(2)} KB</p>
            <div className="flex gap-2 w-full mt-auto">
              <a 
                href={`http://localhost:5000/api/documents/${doc.name}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <DownloadSimple size={16} />
                تحميل
              </a>
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            لا توجد مستندات في الخزنة حالياً
          </div>
        )}
      </div>
    </div>
  );
}
