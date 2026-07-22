import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, PencilSimple, Trash, FileText, CheckCircle, DownloadSimple, Certificate, MicrosoftExcelLogo, FilePdf, Eye, UploadSimple, X, ArrowsClockwise, Package, ClipboardText, CalendarBlank, FileDoc } from '@phosphor-icons/react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import { useNavigate, useParams } from 'react-router-dom';
import { api, API_BASE } from '../services/api';
import { useToast } from '../components/Toast';
import TextArea from '../components/TextArea';
import CoverageChart from '../components/CoverageChart';
import { LOGO_BASE64 } from '../utils/logoBase64';

const EVAL_CRITERIA = [
  { key: 'punctuality', label: 'المواظبة واحترام الوقت' },
  { key: 'skills', label: 'المهارات السلوكية والعملية' },
  { key: 'conduct', label: 'حسن التعامل' },
  { key: 'seriousness', label: 'الجدية في العمل' },
];

const DEPARTMENTS = [
  'المكتب الإداري والتوزيع',
  'فتح الملفات والصندوق',
  'الجلسات',
  'الخبرة والمسح الضوئي',
];

function toDateInputValue(value?: string): string {
  if (!value || value.trim() === '') return '';
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo}-${d}`;
  }
  return '';
}

function formatDate(d: string | undefined | null): string {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch { return d || '—'; }
}

const RotDateInput = React.memo(({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => {
  const [text, setText] = useState(value ? formatDate(value) : '');
  const hiddenRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setText(value ? formatDate(value) : ''); }, [value]);
  const commit = (raw: string) => {
    let clean = raw.replace(/[^\d]/g, '').slice(0, 8);
    if (clean.length > 2) clean = clean.slice(0, 2) + '/' + clean.slice(2);
    if (clean.length > 5) clean = clean.slice(0, 5) + '/' + clean.slice(5);
    setText(clean);
    const parts = clean.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      const iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
      if (!isNaN(new Date(iso).getTime())) onChange(iso);
      else onChange('');
    } else onChange('');
  };
  return (
    <div style={{position:'relative'}}>
      <input type="text" inputMode="numeric" className="input" style={{fontSize:12, width:'100%', paddingLeft:34}} value={text} onChange={e => commit(e.target.value)} onBlur={e => commit(e.target.value)} placeholder={placeholder} />
      <button type="button" onClick={() => hiddenRef.current?.showPicker()} style={{position:'absolute',left:4,top:'50%',transform:'translateY(-50%)',width:28,height:28,borderRadius:6,border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--slate)'}}><CalendarBlank size={16} /></button>
      <input type="date" ref={hiddenRef} onChange={e => { const iso = e.target.value; if (iso) { onChange(iso); setText(formatDate(iso)); }}}
        style={{position:'absolute',left:0,top:'50%',transform:'translateY(-50%)',width:28,height:28,opacity:0,pointerEvents:'none'}} />
    </div>
  );
});

function sanitizeTitle(t: string): string {
  return t.replace(/\.pdf\.?$/i, '').trim();
}

export function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [intern, setIntern] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEncadrant, setEditingEncadrant] = useState(false);
  const [encadrantInput, setEncadrantInput] = useState('');

  // Document Lifecycle Center
  const [docsLifecycle, setDocsLifecycle] = useState<any[]>([]);
  const [assignDocType, setAssignDocType] = useState('CONVENTION_SIGNED');
  const [assignCustomTitle, setAssignCustomTitle] = useState('');
  const [assignFile, setAssignFile] = useState<File | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [revisionDocId, setRevisionDocId] = useState<number | null>(null);
  const [revisionReason, setRevisionReason] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [selectedVaultDocs, setSelectedVaultDocs] = useState<Set<string>>(new Set());
  const [vaultRequiresReturn, setVaultRequiresReturn] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);

  const DOC_TYPE_LABELS: Record<string, string> = {
    CIN: 'بطاقة التعريف الوطنية (CIN)',
    CV: 'السيرة الذاتية (CV)',
    INSURANCE: 'التأمين (Assurance)',
    DEMANDE: 'طلب التدريب (Demande)',
    CONVENTION_SIGNED: 'اتفاقية التدريب الموقعة',
    FINAL_REPORT: 'التقرير النهائي',
    ATTESTATION_SIGNED: 'شهادة التدريب الموقعة',
    OTHER: 'مستند إضافي',
  };
  
  // Approval Modal State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveStartDate, setApproveStartDate] = useState('');
  const [approveEndDate, setApproveEndDate] = useState('');
  const [durationStr, setDurationStr] = useState('');
  const [approveStartDisplay, setApproveStartDisplay] = useState('');
  const [approveEndDisplay, setApproveEndDisplay] = useState('');
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  // PDF Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'summary' | 'full'>('summary');

  const handleExportAction = async (disposition: 'attachment' | 'inline') => {
    const url = api.exportInternPdf(intern.id, exportMode, disposition);
    setShowExportModal(false);

    if (disposition !== 'inline') {
      window.open(url, '_blank');
      return;
    }

    // Preview & Print: fetch the PDF, load it in a hidden iframe, then print it.
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      let done = false;
      const cleanup = () => {
        setTimeout(() => {
          try { document.body.removeChild(iframe); } catch (e) {}
          try { URL.revokeObjectURL(blobUrl); } catch (e) {}
        }, 60000);
      };
      iframe.onload = () => {
        if (done) return;
        done = true;
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            window.open(blobUrl, '_blank');
          }
          cleanup();
        }, 400);
      };
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  // Evaluation State
  const [showEvalForm, setShowEvalForm] = useState(false);

  const [evalPeriodFrom, setEvalPeriodFrom] = useState('');
  const [evalPeriodTo, setEvalPeriodTo] = useState('');
  const [evalRotations, setEvalRotations] = useState<{supervisor:string;department:string;from:string;to:string}[]>([]);
  const [evalCriteria, setEvalCriteria] = useState<Record<string,{yes:boolean;no:boolean}>>({});
  const [evalComments, setEvalComments] = useState('');
  const [savingEval, setSavingEval] = useState(false);
  const [uploadingSigned, setUploadingSigned] = useState(false);
  const [signedUploaded, setSignedUploaded] = useState(false);

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

  const fetchDocsLifecycle = async () => {
    if (!id) return;
    try {
      const data = await api.get(`/interns/${id}/documents`);
      setDocsLifecycle(data);
    } catch (err) {
      console.error(err);
    }
  };

  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'Admin';
  let canAssignEncadrant = isAdmin;
  let canApproveInterns = isAdmin;
  let canEvaluateInterns = isAdmin;
  if (!isAdmin && user?.permissions) {
    try {
      const perms = JSON.parse(user.permissions);
      if (perms?.assign_encadrant?.edit) canAssignEncadrant = true;
      if (perms?.approve_interns?.edit) canApproveInterns = true;
      if (perms?.evaluate_interns?.edit) canEvaluateInterns = true;
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
    if (id) {
      fetchInternAndAttendance();
      fetchDocsLifecycle();
    }
  }, [id]);

  useEffect(() => {
    if (showAssignModal && assignDocType && !assignCustomTitle) {
      setAssignCustomTitle(DOC_TYPE_LABELS[assignDocType] || '');
    }
  }, [showAssignModal, assignDocType]);

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
    if (!filename) return;
    const name = filename.replace(/^\/api\/uploads\//, '').replace(/^\//, '');
    window.open(`${API_BASE}/documents/${name}`, '_blank');
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

  const commitDate = (raw: string, setDisplay: (v: string) => void, setIso: (v: string) => void, hiddenRef: React.RefObject<HTMLInputElement | null>) => {
    let clean = raw.replace(/[^\d]/g, '').slice(0, 8);
    if (clean.length > 2) clean = clean.slice(0, 2) + '/' + clean.slice(2);
    if (clean.length > 5) clean = clean.slice(0, 5) + '/' + clean.slice(5);
    setDisplay(clean);
    const parts = clean.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      const iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
      if (!isNaN(new Date(iso).getTime())) {
        setIso(iso);
        return;
      }
    }
    setIso('');
  };

  const handleApproveClick = () => {
    const requiredTypes = ['CIN', 'CV', 'INSURANCE', 'DEMANDE'];
    const missingDocs = requiredTypes.filter(dt => {
      const doc = docsLifecycle.find(d => d.doc_type === dt);
      return !doc || !doc.file_path || doc.status === 'MISSING';
    });
    if (missingDocs.length > 0) {
      toast.warning('لا يمكن قبول المتدرب. يرجى التأكد من رفع جميع المستندات المطلوبة أولاً.');
      return;
    }
    if (!intern.encadrant || intern.encadrant.trim() === '') {
      toast.warning('لا يمكن قبول المتدرب. يرجى تعيين المؤطر (المشرف) أولاً.');
      return;
    }

    setApproveStartDate(toDateInputValue(intern.start_date) || new Date().toISOString().split('T')[0]);
    setApproveEndDate(toDateInputValue(intern.end_date));
    setApproveStartDisplay(formatDate(intern.start_date) || new Date().toLocaleDateString('en-GB'));
    setApproveEndDisplay(formatDate(intern.end_date) || '');
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

  const openEvalForm = () => {
    const ev = intern?.evaluation || {};
    setEvalPeriodFrom(ev.period_from || '');
    setEvalPeriodTo(ev.period_to || '');
    setEvalRotations(ev.rotations?.length > 0 ? ev.rotations : [{ supervisor: '', department: '', from: '', to: '' }]);
    setEvalCriteria(ev.criteria || {});
    setEvalComments(ev.comments || '');
    setShowEvalForm(true);
  };

  const saveEvaluation = async () => {
    if (evalRotations.length === 0 || evalRotations.some(r => !r.supervisor || !r.department || !r.from || !r.to)) {
      toast.error('يرجى إكمال معلومات فترات التدريب (المشرف، الشعبة، والتواريخ)');
      return;
    }
    setSavingEval(true);
    try {
      const res = await api.post(`/interns/${id}/evaluation`, {
        period_from: evalPeriodFrom,
        period_to: evalPeriodTo,
        rotations: evalRotations,
        criteria: evalCriteria,
        comments: evalComments,
      });
      setIntern({ ...intern, evaluation: res.evaluation });
      toast.success('تم حفظ تقييم المتدرب بنجاح!');
      setShowEvalForm(false);
    } catch (err) {
      toast.error('فشل حفظ التقييم');
    } finally {
      setSavingEval(false);
    }
  };

  const addRotation = () => {
    setEvalRotations([...evalRotations, { supervisor: '', department: '', from: '', to: '' }]);
  };

  const updateRotation = (idx: number, field: string, value: string) => {
    const next = [...evalRotations];
    (next[idx] as any)[field] = value;
    setEvalRotations(next);
  };

  const removeRotation = (idx: number) => {
    setEvalRotations(evalRotations.filter((_, i) => i !== idx));
  };

  const handleUploadSigned = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) { toast.error('يجب أن يكون الملف بصيغة PDF'); return; }
    setUploadingSigned(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(`/interns/${id}/evaluation/signed-upload`, fd);
      const ev = { ...(intern?.evaluation || {}), signed_file_path: res.signed_file_path };
      setIntern({ ...intern, evaluation: ev });
      setSignedUploaded(true);
      toast.success('تم رفع النسخة الموقعة');
    } catch { toast.error('فشل رفع النسخة الموقعة'); }
    finally { setUploadingSigned(false); }
  };

  const generateEvalHtml = () => {
    const ev = intern?.evaluation || {};
    const crit = evalCriteria || ev.criteria || {};
    const rots = evalRotations.length > 0 ? evalRotations : (ev.rotations || []);
    const pFrom = evalPeriodFrom || ev.period_from || '';
    const pTo = evalPeriodTo || ev.period_to || '';
    const comments = evalComments || ev.comments || '';

    return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="utf-8">
  <title>بطاقة تقييم التدريب</title>
  <style>
    @font-face {
      font-family: 'Tifinagh';
      src: local('Segoe UI Historic'), local('Noto Sans Tifinagh');
    }
    @page { margin: 10mm; }
    body {
      font-family: 'Traditional Arabic', 'Arial', sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 0;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .header-text {
      text-align: center;
      font-weight: bold;
      font-size: 15px;
    }
    .header-tifinagh {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      font-family: 'Tifinagh', sans-serif;
      direction: ltr;
    }
    .header-logo {
      width: 90px;
      height: 90px;
      object-fit: contain;
    }
    h1 {
      text-align: center;
      font-size: 32px;
      font-weight: bold;
      margin: 10px 0 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 3px solid #000;
      margin-bottom: 0;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px 12px;
      text-align: center;
      vertical-align: middle;
      font-weight: bold;
    }
    .bg-yellow {
      background-color: #FACC2E !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .notes-box {
      border: 3px solid #000;
      border-top: none;
      min-height: 150px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      page-break-inside: avoid;
    }
    .notes-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 18px;
    }
    .checkbox-cell {
      font-size: 24px;
      font-family: Arial, sans-serif;
    }
    .content-row td {
      font-size: 15px;
    }
    .dotted-line {
      border-bottom: 2px dotted #000;
      margin: 20px 0;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="header-text">
      المملكة المغربية<br>
      وزارة العدل<br>
      محكمة الإستئناف الإدارية بفاس
    </div>
    <img src="${LOGO_BASE64}" class="header-logo" alt="Logo" />
    <div class="header-tifinagh">
      ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ<br>
      ⵜⴰⵎⴰⵡⵙⵜ ⵏ ⵜⵥⵔⴼⵜ<br>
      ⵜⴰⵙⵏⴱⴹⴰⵢⵜ ⵏ ⵡⴰⵍⴰⵙ ⵜⴰⵎⵙⵙⵓⴳⵓⵔⵜ<br>
      ⴷⵉ ⴼⴰⵙ
    </div>
  </div>

  <h1>بطاقة تقييم التدريب</h1>

  <table>
    <tr class="bg-yellow">
      <td style="width: 15%;">الاسم الكامل</td>
      <td style="width: 35%; background-color: #fff !important;">${intern?.name || ''}</td>
      <td style="width: 15%;">مقر التدريب</td>
      <td style="width: 35%;">كتابة الضبط بمحكمة الاستئناف الإدارية بفاس</td>
    </tr>
    <tr>
      <td colspan="2" style="font-size: 22px;">فترة التدريب المطلوبة</td>
      <td colspan="2" style="text-align: center; font-size: 18px; direction: rtl;">
        <div style="display: flex; justify-content: center; gap: 30px;">
          <span>من: ${pFrom || '...................'}</span>
          <span>إلى: ${pTo || '...................'}</span>
        </div>
      </td>
    </tr>
    <tr class="bg-yellow">
      <td colspan="4" style="font-size: 20px;">معلومات عن التدريب</td>
    </tr>
    <tr class="bg-yellow content-row">
      <td>الفترة</td>
      <td>الشعبة</td>
      <td colspan="2">المشرف على التكوين</td>
    </tr>
    ${(rots.length > 0 ? rots : [{ supervisor: '', department: '', from: '', to: '' }]).map((r: any, i: number) => {
      return `
      <tr class="content-row">
        <td>
          الفترة ${i+1}<br>
          من: ${r.from || '...................'} إلى: ${r.to || '...................'}
        </td>
        <td>${r.department || '<br>'}</td>
        <td colspan="2">${r.supervisor || '<br>'}</td>
      </tr>`;
    }).join('')}
    
    <tr class="bg-yellow content-row">
      <td colspan="2">تقييم المتدرب</td>
      <td style="width: 10%;">نعم</td>
      <td style="width: 10%;">لا</td>
    </tr>
    ${EVAL_CRITERIA.map((c, i) => {
      const val = crit[c.key] || { yes: false, no: false };
      return `
      <tr class="content-row">
        ${i === 0 ? `<td rowspan="${EVAL_CRITERIA.length}" style="width: 20%; font-size: 18px;">المهارات السلوكية والعملية</td>` : ''}
        <td ${i === 0 ? 'style="width: 60%;"' : ''}>${c.label}</td>
        <td class="checkbox-cell">${val.yes ? '☑' : '☐'}</td>
        <td class="checkbox-cell">${val.no ? '☑' : '☐'}</td>
      </tr>`;
    }).join('')}
  </table>
  
  <div class="notes-box">
    <div class="notes-header">
      <span>ملاحظات</span>
      <span>توقيع المسؤول الإداري</span>
    </div>
    <div style="font-weight: normal; margin-top: 15px; flex-grow: 1; white-space: pre-wrap;">${comments || ''}</div>
    ${!comments ? `
    <div class="dotted-line"></div>
    <div class="dotted-line"></div>
    <div class="dotted-line"></div>
    ` : ''}
  </div>
</body>
</html>`;
  };

  const handlePrintEval = () => {
    printHTML(generateEvalHtml());
  };

  const printHTML = (html: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    let done = false;
    const cleanup = () => {
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch (e) {}
        try { URL.revokeObjectURL(blobUrl); } catch (e) {}
      }, 60000);
    };
    iframe.onload = () => {
      if (done) return;
      done = true;
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          window.open(blobUrl, '_blank');
        }
        cleanup();
      }, 400);
    };
  };

  const handleDownloadWord = async () => {
    try {
      const ev = intern?.evaluation || {};
      const crit = evalCriteria || ev.criteria || {};
      const rots = evalRotations.length > 0 ? evalRotations : (ev.rotations || []);
      const pFrom = evalPeriodFrom || ev.period_from || '';
      const pTo = evalPeriodTo || ev.period_to || '';
      const comments = evalComments || ev.comments || '';

      const res = await fetch('/evaluation_template.docx');
      if (!res.ok) throw new Error('Template not found');
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const getRot = (idx: number) => rots[idx] || { supervisor: '', department: '', from: '', to: '' };
      
      doc.render({
        name: intern?.name || '',
        from: pFrom,
        to: pTo,
        sup1: getRot(0).supervisor,
        dep1: getRot(0).department,
        f1: getRot(0).from,
        t1: getRot(0).to,
        sup2: getRot(1).supervisor,
        dep2: getRot(1).department,
        f2: getRot(1).from,
        t2: getRot(1).to,
        sup3: getRot(2).supervisor,
        dep3: getRot(2).department,
        f3: getRot(2).from,
        t3: getRot(2).to,
        sup4: getRot(3).supervisor,
        dep4: getRot(3).department,
        f4: getRot(3).from,
        t4: getRot(3).to,
        
        c1_no: crit['punctuality']?.no ? '☑' : '☐',
        c1_yes: crit['punctuality']?.yes ? '☑' : '☐',
        c2_no: crit['skills']?.no ? '☑' : '☐',
        c2_yes: crit['skills']?.yes ? '☑' : '☐',
        c3_no: crit['conduct']?.no ? '☑' : '☐',
        c3_yes: crit['conduct']?.yes ? '☑' : '☐',
        c4_no: crit['seriousness']?.no ? '☑' : '☐',
        c4_yes: crit['seriousness']?.yes ? '☑' : '☐',
        
        notes: comments,
      });

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      saveAs(out, `بطاقة_تقييم_${intern?.name || 'متدرب'}.docx`);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء إنشاء ملف Word');
    }
  };

  const handleDownloadPdf = () => {
    const html = generateEvalHtml();

    const container = document.createElement('div');
    container.innerHTML = html;
    
    const opt = {
      margin: 10,
      filename: `بطاقة_تقييم_${intern?.name || 'متدرب'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(container).save();
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
          {intern.status !== 'مرفوض' && (
          <button title="تحميل شهادة التدريب" onClick={() => window.open(`${API_BASE}/interns/${intern.id}/attestation?token=${sessionStorage.getItem('token')}`, '_blank')} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#e0e7ff', border: '1.5px solid #6366f1', color: '#1a1a1a', transition: 'all 0.2s' }}>
            <Certificate weight="bold" size={18} color="#1a1a1a" />
          </button>
          )}
           <button title="تصدير الملف الشخصي Excel" onClick={() => window.open(api.exportInterns('excel', [intern.id]), '_blank')} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#E8F5E9', border: '1.5px solid #21A366', color: '#1a1a1a', transition: 'all 0.2s' }}>
             <MicrosoftExcelLogo weight="bold" size={18} color="#1a1a1a" />
           </button>
           <button title="تصدير PDF" onClick={() => { setExportMode('summary'); setShowExportModal(true); }} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#1E5631', border: '1.5px solid #1E5631', color: '#fff', transition: 'all 0.2s' }}>
             <FilePdf weight="bold" size={18} color="#fff" />
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
            <span className="v">{formatDate(intern.date_of_birth)}</span>
          </div>
          <div className="info-row">
            <span className="k">تاريخ البدء</span>
            <span className="v">{formatDate(intern.start_date)}</span>
          </div>
          <div className="info-row">
            <span className="k">تاريخ الانتهاء</span>
            <span className="v">{formatDate(intern.end_date)}</span>
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
          <h3><FileText weight="bold" className="icon" /> مركز المستندات</h3>

          <div style={{marginBottom: 12, display:'flex', gap: 8}}>
            <button className="btn btn-ghost sm" onClick={() => { setAssignDocType('CONVENTION_SIGNED'); setAssignCustomTitle(''); setAssignFile(null); setShowAssignModal(true); }} style={{fontSize:12, padding:'6px 12px'}}>
              + رفع وثيقة موقعة
            </button>
            <button className="btn btn-ghost sm" onClick={async () => { try { const d = await api.get('/vault'); setVaultDocs(d); setShowVaultModal(true); } catch {} }} style={{fontSize:12, padding:'6px 12px'}}>
              <FileText size={14} /> إضافة من الخزنة
            </button>
          </div>

          {/* Section 1: المستندات المطلوبة من المتدرب (Incoming) */}
          <div style={{marginBottom:16}}>
            <div className="section-title" style={{marginBottom:8}}><h4 style={{fontSize:13, fontWeight:700, margin:0, color:'var(--gold-dark)'}}>المستندات المطلوبة من المتدرب</h4></div>
            {['CIN','CV','INSURANCE','DEMANDE'].filter(t => !['CONVENTION_SIGNED','ATTESTATION_SIGNED'].includes(t)).length === 0 && <div/>}
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:12.5}}>
                <thead>
                  <tr style={{borderBottom:'1px solid var(--line)'}}>
                    <th style={{textAlign:'right', padding:'8px 8px', color:'var(--slate-light)', fontWeight:600}}>المستند</th>
                    <th style={{textAlign:'center', padding:'8px 8px', color:'var(--slate-light)', fontWeight:600}}>الحالة</th>
                    <th style={{textAlign:'center', padding:'8px 8px', color:'var(--slate-light)', fontWeight:600}}>تاريخ الرفع</th>
                    <th style={{textAlign:'left', padding:'8px 8px', color:'var(--slate-light)', fontWeight:600}}>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {['CIN','CV','INSURANCE','DEMANDE'].map(dt => {
                    const d = docsLifecycle.find(x => x.doc_type === dt);
                    if (!d) return null;
                    return (
                      <tr key={dt} style={{borderBottom:'1px solid var(--line)'}}>
                        <td style={{padding:'10px 8px'}}>
                          <div style={{fontWeight:600, color:'var(--ink)'}}>{DOC_TYPE_LABELS[dt]}</div>
                          {d?.rejection_reason && d.status === 'REVISION_REQUESTED' && (
                            <div style={{fontSize:11, color:'var(--danger)', marginTop:2, background:'#FFF0EE', padding:'3px 6px', borderRadius:4}}>
                              <span style={{fontWeight:600}}>ملاحظة الإدارة:</span> {d.rejection_reason}
                            </div>
                          )}
                        </td>
                        <td style={{textAlign:'center', padding:'10px 8px'}}>
                          {!d || d.status === 'MISSING' ? <span className="badge" style={{fontSize:11, background:'var(--paper)', color:'var(--slate)'}}>غير مرفوع</span> :
                           d.status === 'PENDING_REVIEW' ? <span className="badge badge-warning" style={{fontSize:11}}>قيد المراجعة</span> :
                           d.status === 'APPROVED_AND_SIGNED' ? <span className="badge badge-success" style={{fontSize:11}}>مقبول</span> :
                           d.status === 'REVISION_REQUESTED' ? <span className="badge badge-danger" style={{fontSize:11}}>مطلوب إعادة</span> : null}
                        </td>
                        <td style={{textAlign:'center', padding:'10px 8px', color:'var(--slate)'}}>
                          {d?.file_path ? formatDate(d.updated_at || d.created_at) : '—'}
                        </td>
                        <td style={{textAlign:'left', padding:'10px 8px'}}>
                          <div style={{display:'flex', gap:4, justifyContent:'flex-end'}}>
                            {d?.file_path && (
                              <>
                                <button className="btn btn-ghost sm" onClick={() => window.open(api.downloadDocument(d.id), '_blank')} title="معاينة" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                  <Eye size={14} />
                                </button>
                                <button className="btn btn-ghost sm" onClick={() => { const a = document.createElement('a'); a.href = api.downloadDocument(d.id); a.download = ''; a.click(); }} title="تحميل" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                  <DownloadSimple size={14} />
                                </button>
                              </>
                            )}
                            {d && d.status !== 'MISSING' && (
                              <button className="btn btn-ghost sm" onClick={() => { setRevisionDocId(d.id); setRevisionReason(''); setShowRevisionModal(true); }} title="طلب إعادة الرفع" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gold-dark)'}}>
                                <ArrowsClockwise size={14} />
                              </button>
                            )}
                            {d?.status === 'PENDING_REVIEW' && (
                              <button className="btn btn-ghost sm" onClick={() => api.approveDocument(Number(id), d.id).then(() => fetchDocsLifecycle())} title="قبول" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--success)'}}>
                                <CheckCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>

          {/* Section 2: الوثائق الموقعة من الإدارة (Outgoing Signed Docs) */}
          <div style={{marginBottom:16}}>
            <div className="section-title" style={{marginBottom:8}}><h4 style={{fontSize:13, fontWeight:700, margin:0, color:'var(--success)'}}>وثائق من الإدارة</h4></div>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:12.5}}>
                <thead>
                  <tr style={{borderBottom:'1px solid var(--line)'}}>
                    <th style={{textAlign:'right', padding:'8px 8px', color:'var(--slate-light)', fontWeight:600}}>الوثيقة</th>
                    <th style={{textAlign:'center', padding:'8px 8px', color:'var(--slate-light)', fontWeight:600}}>تاريخ الإرسال</th>
                    <th style={{textAlign:'left', padding:'8px 8px', color:'var(--slate-light)', fontWeight:600}}>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                    {(() => {
                      const signedDocs = docsLifecycle.filter(d => d.status === 'APPROVED_AND_SIGNED' && (d.uploaded_by === 'ADMIN' || d.doc_type === 'CONVENTION_SIGNED') && !d.requires_return);
                      const returnDocs = docsLifecycle.filter(d => d.requires_return === true);
                      const hasAny = signedDocs.length > 0 || returnDocs.length > 0;
                      if (!hasAny) {
                        return <tr><td colSpan={3} style={{textAlign:'center', padding:'16px 8px', color:'var(--slate-light)'}}>لم يتم إصدار أي وثائق بعد</td></tr>;
                      }
                      return <>
                        {returnDocs.map(d => (
                          <tr key={d.id} style={{borderBottom:'1px solid var(--line)'}}>
                            <td style={{padding:'10px 8px', fontWeight:600}}>
                              {sanitizeTitle(d.label)}
                              <div style={{marginTop:6}}>
                                {d.returned_file_path ? (
                                  <span style={{display:'inline-flex', alignItems:'center', gap:4, background:'#E7F8EE', color:'#15803D', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:9999}}>
                                    <CheckCircle size={11} weight="fill" /> تم إرجاع النسخة المعبأة
                                  </span>
                                ) : (
                                  <span style={{display:'inline-flex', alignItems:'center', gap:4, background:'#FEF3C7', color:'#B45309', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:9999}}>
                                    يتطلب التعبئة
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{textAlign:'center', padding:'10px 8px', color:'var(--slate)'}}>
                              {formatDate(d.updated_at)}
                            </td>
                            <td style={{textAlign:'left', padding:'10px 8px'}}>
                              <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                                {d.file_path && !d.returned_file_path && (
                                  <button className="btn btn-ghost sm" onClick={() => { const a = document.createElement('a'); a.href = api.downloadDocument(d.id); a.download = ''; a.click(); }} style={{padding:'6px 12px', fontSize:11, display:'flex', alignItems:'center', gap:4}}>
                                    <DownloadSimple size={14} /> تحميل النموذج
                                  </button>
                                )}
                                {d.returned_file_path && (
                                  <button className="btn btn-ghost sm" onClick={() => window.open(api.downloadDocument(d.id) + '&returned=1', '_blank')} style={{padding:'6px 12px', fontSize:11, display:'flex', alignItems:'center', gap:4}}>
                                    <Eye size={14} /> معاينة
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {signedDocs.map(d => (
                          <tr key={d.id} style={{borderBottom:'1px solid var(--line)'}}>
                            <td style={{padding:'10px 8px', fontWeight:600}}>{sanitizeTitle(d.label)}</td>
                            <td style={{textAlign:'center', padding:'10px 8px', color:'var(--slate)'}}>
                              {formatDate(d.updated_at)}
                            </td>
                            <td style={{textAlign:'left', padding:'10px 8px'}}>
                              <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                                <button className="btn btn-ghost sm" onClick={() => { const a = document.createElement('a'); a.href = api.downloadDocument(d.id); a.download = ''; a.click(); }} style={{padding:'6px 12px', fontSize:11, display:'flex', alignItems:'center', gap:4}}>
                                  <DownloadSimple size={14} /> تحميل
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>;
                    })()}
                </tbody>
              </table>
          </div>

          {/* Section 3: ختام التدريب والأرشيف (Exit Docs) — visible only after documents are uploaded */}
          {(() => {
            const att = docsLifecycle.find(d => d.doc_type === 'ATTESTATION_SIGNED');
            const final = docsLifecycle.find(d => d.doc_type === 'FINAL_REPORT');
            const hasExitDocs = att?.file_path || final?.file_path;
            if (!hasExitDocs) return null;
            return (
            <div style={{marginBottom:8}}>
              <div className="section-title" style={{marginBottom:8}}><h4 style={{fontSize:13, fontWeight:700, margin:0, color:'var(--brand)'}}>ختام التدريب والأرشيف</h4></div>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {att?.file_path && (
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 6px', background:'var(--paper)', borderRadius:8, border:'1px solid var(--line)'}}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <Certificate weight="fill" style={{color:'var(--gold-dark)', width:16}} />
                    <span style={{fontWeight:600, fontSize:12.5}}>شهادة التدريب</span>
                  </div>
                  <div style={{display:'flex', gap:4}}>
                    <button className="btn btn-ghost sm" onClick={() => { const a = document.createElement('a'); a.href = api.downloadDocument(att.id); a.download = ''; a.click(); }} title="تحميل" style={{width:28,height:28,padding:0}}>
                      <DownloadSimple size={14} />
                    </button>
                  </div>
                </div>
                )}
                <button className="btn btn-ghost" style={{width:'100%', justifyContent:'center', padding:'10px', fontSize:12.5, border:'1.5px dashed var(--line)', borderRadius:8, color:'var(--slate)'}} onClick={async () => {
                  if (!id) return;
                  try {
                    const res = await fetch(`${API_BASE}/interns/${id}/export-zip?token=${sessionStorage.getItem('token')}`);
                    if (!res.ok) throw new Error('Export failed');
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `Intern_${id}_Archive.zip`; a.click();
                    URL.revokeObjectURL(url);
                  } catch (e) {
                    toast.error('فشل إنشاء الأرشيف');
                  }
                }}>
                  <DownloadSimple weight="bold" size={16} style={{marginLeft:6}} />
                  <Package size={16} /> تحميل أرشيف الملفات ZIP
                </button>
              </div>
            </div>
            );
          })()}
        </div>
      </div>

      {canApproveInterns && intern.status !== 'نشط' && intern.status !== 'مرفوض' && (
        <>
        <CoverageChart internId={Number(id)} />
        <div className="card" style={{ padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', flexWrap: 'wrap', gap: '20px', borderTop: '4px solid var(--gold)', background: 'linear-gradient(to left, var(--paper), var(--bg))' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 'bold' }}>القرار النهائي للملف</h3>
            <p style={{ margin: 0, color: 'var(--slate)', fontSize: '0.95rem' }}>بناءً على مراجعة المستندات والمقابلة، يرجى اتخاذ القرار النهائي.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn btn-ghost" onClick={handleReject} style={{ padding: '12px 24px', color: 'var(--danger)', border: '1.5px solid var(--danger-border)', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px' }}>
<X size={18} /> رفض الطلب
            </button>
            <button className="btn btn-primary" onClick={handleApproveClick} style={{ padding: '12px 24px', fontWeight: 'bold', fontSize: '14px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)' }}>
<CheckCircle size={18} weight="fill" /> قبول الطلب وتنشيط الحساب
            </button>
          </div>
        </div>
        </>
      )}

      {intern.status === 'نشط' && (canEvaluateInterns || intern.evaluation?.criteria) && (
        <div className="card" style={{ padding: '28px', marginTop: '24px', borderTop: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 'bold' }}>بطاقة تقييم التدريب</h3>
              <p style={{ margin: 0, color: 'var(--slate)', fontSize: '0.95rem' }}>تقييم أداء المتدرب وطباعة البطاقة للتوقيع.</p>
            </div>
            {canEvaluateInterns && (
              <div style={{display:'flex', gap:8}}>
                <button className="btn btn-primary" onClick={openEvalForm} style={{ padding: '10px 20px', fontWeight: 'bold', fontSize: '13px', borderRadius: '8px' }}>
                  <ClipboardText size={18} weight="fill" /> {intern.evaluation?.criteria ? 'تعديل التقييم' : 'تقييم المتدرب'}
                </button>
              </div>
            )}
          </div>

          {intern.evaluation?.criteria && (
            <div style={{ marginTop: '20px' }}>
              <div style={{marginBottom:14, fontSize:13}}>
                <b>الفترة:</b> من {formatDate(intern.evaluation.period_from)} إلى {formatDate(intern.evaluation.period_to)}
              </div>
              {intern.evaluation.rotations?.length > 0 && (
                <div style={{marginBottom:14, fontSize:12.5}}>
                  <div style={{fontWeight:700, marginBottom:6}}>فترات التدريب:</div>
                  {intern.evaluation.rotations.map((r: any, i: number) => (
                    <div key={i} style={{background:'var(--paper)', padding:'6px 10px', borderRadius:6, marginBottom:4, border:'1px solid var(--line)'}}>
                      <b>{r.label || ('الفترة '+(i+1))}</b> — {r.supervisor} | {r.department} | من {formatDate(r.from)} إلى {formatDate(r.to)}
                    </div>
                  ))}
                </div>
              )}
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:12.5, marginBottom:12}}>
                <thead><tr style={{borderBottom:'1px solid var(--line)'}}>
                  <th style={{textAlign:'center', padding:'6px 4px', width:60}}>لا</th>
                  <th style={{textAlign:'center', padding:'6px 4px', width:60}}>نعم</th>
                  <th style={{textAlign:'right', padding:'6px 4px'}}>المعيار</th>
                </tr></thead>
                <tbody>
                  {EVAL_CRITERIA.map(c => {
                    const val = intern.evaluation.criteria?.[c.key] || {yes:false, no:false};
                    return (
                      <tr key={c.key} style={{borderBottom:'1px solid var(--line)'}}>
                        <td style={{textAlign:'center', padding:'8px 4px', color: val.no ? 'var(--danger)' : 'var(--slate-light)'}}>{val.no ? '✓' : '—'}</td>
                        <td style={{textAlign:'center', padding:'8px 4px', color: val.yes ? 'var(--success)' : 'var(--slate-light)'}}>{val.yes ? '✓' : '—'}</td>
                        <td style={{padding:'8px 4px', fontWeight:600}}>{c.label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {intern.evaluation.comments && (
                <div style={{ background: 'var(--paper)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom:12, fontSize:13 }}>
                  <span style={{ fontWeight:700, display:'block', marginBottom:4 }}>ملاحظات:</span>
                  {intern.evaluation.comments}
                </div>
              )}
              <div style={{fontSize:11.5, color:'var(--slate)'}}>بواسطة: {intern.evaluation.evaluator} · {formatDate(intern.evaluation.date)}</div>
              {canEvaluateInterns && (
                <div style={{marginTop:12, display:'flex', gap:8, alignItems:'center'}}>
                  {(intern.evaluation?.signed_file_path || signedUploaded) ? (
                    <span style={{display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'var(--success)'}}>
                      <CheckCircle size={15} weight="fill" /> تم رفع النسخة الموقعة
                    </span>
                  ) : (
                    <label className="btn btn-ghost sm" style={{cursor:'pointer', fontSize:12, display:'inline-flex', alignItems:'center', gap:6, border: uploadingSigned ? '1px dashed var(--gold)' : undefined}}>
                      <UploadSimple size={14} />
                      {uploadingSigned ? 'جاري الرفع...' : 'رفع النسخة الموقعة (PDF)'}
                      <input type="file" accept=".pdf" style={{display:'none'}} onChange={handleUploadSigned} disabled={uploadingSigned} />
                    </label>
                  )}
                  {intern.evaluation?.signed_file_path && (
                    <a href={intern.evaluation.signed_file_path} target="_blank" rel="noreferrer" className="btn btn-ghost sm" style={{padding:'6px 12px', fontSize:12, display:'inline-flex', alignItems:'center', gap:4}}>
                      <Eye size={14} /> معاينة الموقع
                    </a>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className="btn btn-ghost sm" onClick={handlePrintEval} style={{fontSize:12}}>
                      <DownloadSimple size={14} /> طباعة البطاقة
                    </button>
                    <button className="btn btn-ghost sm" onClick={handleDownloadWord} title="تحميل DOCX" style={{fontSize:12, color:'#2b579a'}}>
                      <FileDoc size={14} /> DOCX
                    </button>
                    <button className="btn btn-ghost sm" onClick={handleDownloadPdf} title="تحميل PDF" style={{fontSize:12, color:'#d32f2f'}}>
                      <FilePdf size={14} /> PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showExportModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-head">
              <h3>تصدير PDF</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowExportModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: 'var(--slate)' }}>اختر نوع التصدير</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => setExportMode('summary')}
                  style={{ textAlign: 'right', padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', background: exportMode === 'summary' ? 'var(--brand-tint, #EEF4EF)' : 'var(--paper)', border: `1.5px solid ${exportMode === 'summary' ? '#1E5631' : 'var(--line)'}`, transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#1E5631' }}>
                    <FilePdf weight="bold" size={18} color="#1E5631" /> الملف الأساسي فقط
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--slate)', marginTop: '4px' }}>ملف من صفحة واحدة: المعلومات الشخصية والأكاديمية وقائمة بالمستندات المرفوعة.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('full')}
                  style={{ textAlign: 'right', padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', background: exportMode === 'full' ? 'var(--brand-tint, #EEF4EF)' : 'var(--paper)', border: `1.5px solid ${exportMode === 'full' ? '#1E5631' : 'var(--line)'}`, transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#1E5631' }}>
                    <FileText weight="bold" size={18} color="#1E5631" /> الملف الكامل مع جميع المستندات
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--slate)', marginTop: '4px' }}>ملف متعدد الصفحات: بيانات المتدرب متبوعة بجميع المستندات المرفوعة (الاتفاقية، البطاقة الوطنية، التأمين، السيرة الذاتية...).</div>
                </button>
              </div>
            </div>
            <div className="modal-foot" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={() => setShowExportModal(false)}>إلغاء</button>
              <button className="btn btn-ghost" style={{ border: '1.5px solid #1E5631', color: '#1E5631' }} onClick={() => handleExportAction('inline')}>
                <Eye weight="bold" className="icon" /> معاينة وطباعة
              </button>
              <button className="btn" style={{ background: '#1E5631', color: '#fff', border: 'none' }} onClick={() => handleExportAction('attachment')}>
                <DownloadSimple weight="bold" className="icon" /> تحميل PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {showEvalForm && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal" style={{maxWidth:700}}>
            <div className="modal-head">
              <h3>بطاقة تقييم التدريب</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowEvalForm(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
                <div style={{marginBottom:16}}>
                <label style={{fontWeight:700, fontSize:13, display:'block', marginBottom:8}}>معلومات عن التدريب (فترات)</label>
                {evalRotations.map((r, i) => {
                  const isCustom = r.department && !DEPARTMENTS.includes(r.department);
                  return (
                  <div key={i} style={{background:'var(--paper)', padding:12, borderRadius:8, border:'1px solid var(--line)', marginBottom:8}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                      <b style={{fontSize:12}}>{r.label || ('الفترة '+(i+1))}</b>
                      {evalRotations.length > 1 && <button className="btn btn-ghost sm" onClick={() => removeRotation(i)} style={{fontSize:10, color:'var(--danger)', padding:'2px 6px'}}><X size={12} /> حذف</button>}
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr', gap:8}}>
                      <div className="form-group" style={{margin:0}}>
                        <label style={{fontSize:11}}>الشعبة</label>
                        <div style={{display:'flex', gap:6, alignItems:'center'}}>
                          <select className="input" style={{fontSize:12, width:'100%'}} value={isCustom ? 'أخرى' : (r.department || '')} onChange={e => {
                            const val = e.target.value;
                            if (val === 'أخرى') {
                              updateRotation(i, 'department', '');
                            } else {
                              updateRotation(i, 'department', val);
                            }
                          }}>
                            <option value="">اختر الشعبة</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            <option value="أخرى">أخرى (كتابة يدوية)</option>
                          </select>
                          {isCustom && (
                            <input className="input" style={{fontSize:12, flex:1}} value={r.department} onChange={e => updateRotation(i, 'department', e.target.value)} placeholder="اكتب اسم الشعبة" />
                          )}
                        </div>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                        <div className="form-group" style={{margin:0}}>
                          <label style={{fontSize:11}}>من</label>
                          <RotDateInput value={r.from} onChange={v => updateRotation(i, 'from', v)} placeholder="dd/mm/yyyy" />
                        </div>
                        <div className="form-group" style={{margin:0}}>
                          <label style={{fontSize:11}}>إلى</label>
                          <RotDateInput value={r.to} onChange={v => updateRotation(i, 'to', v)} placeholder="dd/mm/yyyy" />
                        </div>
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label style={{fontSize:11}}>المشرف على التكوين</label>
                        <input className="input" style={{fontSize:12}} value={r.supervisor} onChange={e => updateRotation(i, 'supervisor', e.target.value)} placeholder="المشرف" />
                      </div>
                    </div>
                  </div>
                  );
                })}
                <button className="btn btn-ghost sm" onClick={addRotation} style={{fontSize:11, marginTop:8}}>+ إضافة فترة</button>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{fontWeight:700, fontSize:13, display:'block', marginBottom:8}}>تقييم المتدرب</label>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:12.5}}>
                  <thead><tr style={{borderBottom:'1px solid var(--line)'}}>
                    <th style={{textAlign:'center', padding:'6px 4px', width:60}}>لا</th>
                    <th style={{textAlign:'center', padding:'6px 4px', width:60}}>نعم</th>
                    <th style={{textAlign:'right', padding:'6px 4px'}}>المعيار</th>
                  </tr></thead>
                  <tbody>
                    {EVAL_CRITERIA.map(c => {
                      const val = evalCriteria[c.key] || {yes:false, no:false};
                      return (
                        <tr key={c.key} style={{borderBottom:'1px solid var(--line)'}}>
                          <td style={{textAlign:'center', padding:'8px 4px'}}>
                            <input type="checkbox" checked={val.no} onChange={e => setEvalCriteria({...evalCriteria, [c.key]:{...val, no: e.target.checked}})} style={{width:18,height:18,cursor:'pointer'}} />
                          </td>
                          <td style={{textAlign:'center', padding:'8px 4px'}}>
                            <input type="checkbox" checked={val.yes} onChange={e => setEvalCriteria({...evalCriteria, [c.key]:{...val, yes: e.target.checked}})} style={{width:18,height:18,cursor:'pointer'}} />
                          </td>
                          <td style={{padding:'8px 4px', fontWeight:600}}>{c.label}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <TextArea label="ملاحظات" value={evalComments} onChange={e => setEvalComments(e.target.value)} placeholder="ملاحظات..." />
            </div>
            <div className="modal-foot" style={{justifyContent: 'flex-end'}}>
              <div style={{display:'flex', gap:8}}>
                <button className="btn btn-ghost" onClick={() => setShowEvalForm(false)}>إلغاء</button>
                <button className="btn btn-ink" onClick={saveEvaluation} disabled={savingEval}>
                  {savingEval ? 'جاري الحفظ...' : 'حفظ التقييم'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal" style={{maxWidth:480}}>
            <div className="modal-head" style={{padding:'14px 20px'}}>
              <h3 style={{fontSize:15}}>تأكيد قبول المتدرب</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowApproveModal(false)}><X size={14} /></button>
            </div>
            
            <div className="modal-body" style={{padding:'12px 20px'}}>
              <p style={{ color: 'var(--slate)', fontSize: '13px', margin: '0 0 16px', lineHeight:1.6 }}>
                أنت على وشك تنشيط حساب المتدرب وبدء فترة تدريبه. يرجى تأكيد تواريخ التدريب.
              </p>
              
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div className="form-group" style={{margin:0}}>
                  <label style={{fontSize:12}}>تاريخ البدء</label>
                  <input type="text" inputMode="numeric" className="input" style={{padding:'8px 11px', fontSize:13}} value={approveStartDisplay} onChange={e => handleStartDateChange(e.target.value)} placeholder="dd/mm/yyyy" />
                  <input type="date" ref={startDateRef} style={{display:'none'}} onChange={e => { setApproveStartDate(e.target.value); setApproveStartDisplay(formatDate(e.target.value)); }} />
                </div>
                <div className="form-group" style={{margin:0}}>
                  <label style={{fontSize:12}}>تاريخ الانتهاء</label>
                  <input type="text" inputMode="numeric" className="input" style={{padding:'8px 11px', fontSize:13}} value={approveEndDisplay} onChange={e => handleEndDateChange(e.target.value)} placeholder="dd/mm/yyyy" />
                  <input type="date" ref={endDateRef} style={{display:'none'}} onChange={e => { setApproveEndDate(e.target.value); setApproveEndDisplay(formatDate(e.target.value)); }} />
                </div>
              </div>

              {durationStr && (
                <div style={{ background:'var(--paper)', padding:'10px 14px', borderRadius:8, border:'1px solid var(--line)', marginTop:12, display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:13 }}>
                  <span style={{ color:'var(--slate)' }}>مدة التدريب المحسوبة:</span>
                  <span style={{ fontWeight:700, color:'var(--gold-dark)' }}>{durationStr}</span>
                </div>
              )}
            </div>
            
            <div className="modal-foot" style={{padding:'12px 20px'}}>
              <button className="btn btn-ghost" style={{padding:'7px 16px', fontSize:13}} onClick={() => setShowApproveModal(false)}>
                إلغاء
              </button>
              <button className="btn btn-success" style={{ background: 'var(--success)', color: '#fff', border: 'none', padding:'7px 16px', fontSize:13 }} onClick={confirmApprove}>
                تأكيد وبدء التدريب
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-head">
              <h3>رفع وثيقة موقعة</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowAssignModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>نوع الوثيقة</label>
                <select className="input" value={assignDocType} onChange={e => { setAssignDocType(e.target.value); setAssignCustomTitle(''); }} style={{marginBottom: 8}}>
                  <option value="CONVENTION_SIGNED">اتفاقية التدريب الموقعة</option>
                  <option value="CIN">بطاقة التعريف الوطنية (CIN)</option>
                  <option value="CV">السيرة الذاتية (CV)</option>
                  <option value="INSURANCE">التأمين (Assurance)</option>
                  <option value="DEMANDE">طلب التدريب (Demande)</option>
                  <option value="FINAL_REPORT">التقرير النهائي</option>
                  <option value="ATTESTATION_SIGNED">شهادة التدريب الموقعة</option>
                  <option value="OTHER">مستند إضافي</option>
                </select>
              </div>
              {assignDocType === 'OTHER' && (
              <div className="form-group">
                <label>اسم المستند / العنوان</label>
                <input type="text" className="input" value={assignCustomTitle} onChange={e => setAssignCustomTitle(e.target.value)} placeholder="اتفاقية التدريب المعدلة 2026" />
                <small style={{color:'var(--slate-light)',display:'block',marginTop:4}}>سيظهر هذا العنوان للمتدرب. إذا ترك فارغًا، سيتم استخدام اسم نوع الوثيقة تلقائيًا.</small>
              </div>
              )}
              <div className="form-group">
                <label>الملف الموقع (PDF)</label>
                <input type="file" className="input" accept=".pdf" onChange={e => setAssignFile(e.target.files?.[0] || null)} />
                <small style={{color:'var(--slate-light)',display:'block',marginTop:4}}>يجب أن يكون الملف بصيغة PDF وحجم أقل من 15 ميجابايت</small>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowAssignModal(false)}>إلغاء</button>
              <button className="btn btn-success" style={{background:'var(--success)',color:'#fff',border:'none'}} disabled={!assignFile} onClick={async () => {
                if (!assignFile) return;
                try {
                  await api.uploadSignedDocument(Number(id), assignDocType, assignFile, assignCustomTitle);
                  toast.success('تم رفع الوثيقة الموقعة بنجاح');
                  setShowAssignModal(false);
                  setAssignFile(null);
                  fetchDocsLifecycle();
                } catch (err) {
                  toast.error('فشل رفع الوثيقة الموقعة');
                }
              }}>
                رفع الوثيقة الموقعة
              </button>
            </div>
          </div>
        </div>
      )}

      {showRevisionModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modal-head">
              <h3>طلب إعادة رفع المستند</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowRevisionModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>سبب طلب إعادة الرفع</label>
                <textarea className="input" rows={4} value={revisionReason} onChange={e => setRevisionReason(e.target.value)} placeholder="يرجى توضيح سبب طلب إعادة الرفع للمتدرب..." style={{resize:'vertical'}} />
                <small style={{color:'var(--slate-light)',display:'block',marginTop:4}}>سيظهر السبب للمتدرب في لوحة المستندات الخاصة به</small>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowRevisionModal(false)}>إلغاء</button>
              <button className="btn btn-danger" style={{background:'var(--danger)',color:'#fff',border:'none'}} disabled={!revisionReason.trim() || !revisionDocId} onClick={async () => {
                if (!revisionDocId) return;
                try {
                  await api.rejectDocument(Number(id), revisionDocId, revisionReason);
                  toast.success('تم إرسال طلب إعادة الرفع');
                  setShowRevisionModal(false);
                  setRevisionReason('');
                  setRevisionDocId(null);
                  fetchDocsLifecycle();
                } catch (err) {
                  toast.error('فشل إرسال الطلب');
                }
              }}>
                إرسال طلب إعادة الرفع
              </button>
            </div>
          </div>
        </div>
      )}

      {showVaultModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal" style={{maxWidth:500}}>
            <div className="modal-head">
              <h3>إضافة من خزنة المستندات</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => { setShowVaultModal(false); setSelectedVaultDocs(new Set()); setVaultRequiresReturn(false); }}><X size={14} /></button>
            </div>
            <div className="modal-body">
              {vaultDocs.length === 0 && <div style={{textAlign:'center',padding:20,color:'var(--slate-light)'}}>الخزنة فارغة</div>}
              {vaultDocs.length > 0 && (
                <>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,padding:'6px 10px',background:'var(--paper)',borderRadius:8,border:'1px solid var(--line)'}}>
                    <label style={{display:'flex',alignItems:'center',gap:8,fontSize:12.5,cursor:'pointer',fontWeight:700,color:'var(--brand)'}}>
                      <input type="checkbox" checked={selectedVaultDocs.size === vaultDocs.length} onChange={e => setSelectedVaultDocs(e.target.checked ? new Set(vaultDocs.map(v => v.name)) : new Set())} />
                      تحديد الكل
                    </label>
                    <span style={{fontSize:11.5,color:'var(--slate-light)'}}>{selectedVaultDocs.size}/{vaultDocs.length} مُختار</span>
                  </div>
                  {vaultDocs.map((vd: any) => (
                    <label key={vd.name} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 4px',borderBottom:'1px solid var(--line)',cursor:'pointer',fontSize:13}}>
                      <input type="checkbox" checked={selectedVaultDocs.has(vd.name)} onChange={e => {
                        const next = new Set(selectedVaultDocs);
                        e.target.checked ? next.add(vd.name) : next.delete(vd.name);
                        setSelectedVaultDocs(next);
                      }} />
                      <FileText size={14} style={{flexShrink:0,color:'var(--slate-light)'}} />
                      <span style={{fontWeight:600}}>{vd.name}</span>
                    </label>
                  ))}
                  <label style={{display:'flex', alignItems:'center', gap:8, marginTop:12, padding:'8px 12px', background:'#FFF6E5', borderRadius:8, border:'1px solid #F2D49B', fontSize:12.5, cursor:'pointer'}}>
                    <input type="checkbox" checked={vaultRequiresReturn} onChange={e => setVaultRequiresReturn(e.target.checked)} disabled={selectedVaultDocs.size === 0} />
                    <ArrowsClockwise size={16} weight="bold" style={{color:'var(--gold-dark)'}} />
                    طلب تعبئة الوثيقة وإعادة رفعها من المتدرب
                  </label>
                </>
              )}
            </div>
            <div className="modal-foot" style={{display:'flex', gap:8, justifyContent:'space-between'}}>
              <button className="btn btn-ghost" onClick={() => { setShowVaultModal(false); setSelectedVaultDocs(new Set()); setVaultRequiresReturn(false); }}>إلغاء</button>
              <button className="btn btn-ink" disabled={selectedVaultDocs.size === 0} onClick={async () => {
                try {
                  const names = Array.from(selectedVaultDocs);
                  await Promise.all(names.map(name =>
                    api.post(`/interns/${id}/vault-attach`, { vault_name: name, doc_type: 'OTHER', requires_return: vaultRequiresReturn })
                  ));
                  toast.success(`تمت إضافة ${names.length} مستند${names.length > 1 ? 'ات' : ''} من الخزنة`);
                  setShowVaultModal(false);
                  setSelectedVaultDocs(new Set());
                  setVaultRequiresReturn(false);
                  fetchDocsLifecycle();
                } catch (err) {
                  toast.error('فشلت الإضافة من الخزنة');
                }
              }}>
                إضافة للمتدرب ({selectedVaultDocs.size})
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
