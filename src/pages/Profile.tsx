import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, PencilSimple, Trash, FileText, CheckCircle, DownloadSimple, Certificate, MicrosoftExcelLogo, FilePdf, Eye, UploadSimple, X, ArrowsClockwise, Package, ClipboardText, CalendarBlank, FileDoc, Folder } from '@phosphor-icons/react';
import { openFileInDefaultApp, handleViewFile } from '../utils/documentUtils';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api, API_BASE } from '../services/api';
import { useToast } from '../components/Toast';
import TextArea from '../components/TextArea';
import CoverageChart from '../components/CoverageChart';
import { LOGO_BASE64 } from '../utils/logoBase64';
import { AttestationModal } from '../components/AttestationModal';

const EVAL_CRITERIA = [
  { key: 'punctuality', label: 'المواظبة واحترام الوقت' },
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
  const location = useLocation();
  const toast = useToast();
  const [intern, setIntern] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEncadrant, setEditingEncadrant] = useState(false);
  const [encadrantInput, setEncadrantInput] = useState('');

  // Document Lifecycle Center
  const [docsLifecycle, setDocsLifecycle] = useState<any[]>([]);
  const [docFilter, setDocFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [assignDocType, setAssignDocType] = useState('CONVENTION_SIGNED');
  const [assignCustomTitle, setAssignCustomTitle] = useState('');
  const [assignFile, setAssignFile] = useState<File | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [revisionDocId, setRevisionDocId] = useState<number | null>(null);
  const [revisionReason, setRevisionReason] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showVaultActionModal, setShowVaultActionModal] = useState(false);
  const [selectedVaultDocName, setSelectedVaultDocName] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestActionTypes, setRequestActionTypes] = useState<Set<string>>(new Set(['view']));
  const [selectedVaultDocs, setSelectedVaultDocs] = useState<string[]>([]);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [requestFiles, setRequestFiles] = useState<File[]>([]);


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
  const [showAttestationModal, setShowAttestationModal] = useState(false);
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
  const canManageDocs = isAdmin || (user?.role === 'Manager' && user?.can_manage_documents);
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
    if (location.search.includes('tab=evaluation') && intern?.status === 'نشط') {
      setTimeout(() => {
        const evalSection = document.getElementById('evaluation-section');
        if (evalSection) {
          evalSection.scrollIntoView({ behavior: 'smooth' });
          if (!intern.evaluation?.criteria) {
             setShowEvalForm(true);
          }
        }
      }, 500);
    }
  }, [location.search, intern?.status, intern?.evaluation?.criteria]);

  useEffect(() => {
    if (showAssignModal && assignDocType && !assignCustomTitle) {
      setAssignCustomTitle(assignDocType === 'OTHER' ? '' : assignDocType);
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
    const crit = Object.keys(evalCriteria).length > 0 ? evalCriteria : (ev.criteria || {});
    const rots = evalRotations.length > 0 ? evalRotations : (ev.rotations || []);
    const pFromStr = evalPeriodFrom || ev.period_from || intern?.start_date || '';
    const pToStr = evalPeriodTo || ev.period_to || intern?.end_date || '';
    const pFrom = pFromStr ? formatDate(pFromStr) : '';
    const pTo = pToStr ? formatDate(pToStr) : '';
    const comments = evalComments || ev.comments || '';

    return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="utf-8">
  <title>بطاقة تقييم المتدرب</title>
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
      display: flex;
      page-break-inside: avoid;
    }
    .notes-right {
      flex: 1;
      padding: 15px;
      display: flex;
      flex-direction: column;
    }
    .notes-left {
      width: 35%;
      border-right: 2px solid #000;
      padding: 15px;
      display: flex;
      flex-direction: column;
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

  <h1>بطاقة تقييم المتدرب</h1>

  <table>
    <tr class="bg-yellow">
      <td style="width: 15%;">الاسم الكامل</td>
      <td style="width: 35%;">${intern?.name || ''}</td>
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
    <div class="notes-right">
      <div style="font-weight: bold; font-size: 18px; text-align: right;">ملاحظات</div>
      <div style="font-weight: normal; margin-top: 15px; flex-grow: 1; white-space: pre-wrap;">${comments || ''}</div>
      ${!comments ? `
      <div class="dotted-line"></div>
      <div class="dotted-line"></div>
      <div class="dotted-line"></div>
      <div class="dotted-line"></div>
      ` : ''}
    </div>
    <div class="notes-left">
      <div style="font-weight: bold; font-size: 18px; text-align: center;">توقيع المسؤول الإداري</div>
    </div>
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
      const crit = Object.keys(evalCriteria).length > 0 ? evalCriteria : (ev.criteria || {});
      const rots = evalRotations.length > 0 ? evalRotations : (ev.rotations || []);
      const pFrom = evalPeriodFrom || ev.period_from || (intern?.start_date ? formatDate(intern.start_date) : '');
      const pTo = evalPeriodTo || ev.period_to || (intern?.end_date ? formatDate(intern.end_date) : '');
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

      const formattedRots = (rots.length > 0 ? rots : [{ supervisor: '', department: '', from: '', to: '' }]).map((r: any, idx: number) => ({
        num: idx + 1,
        department: r.department || '—',
        supervisor: r.supervisor || '—',
        from: r.from ? formatDate(r.from) : '—',
        to: r.to ? formatDate(r.to) : '—'
      }));
      
      doc.render({
        name: intern?.name || '',
        from: pFrom,
        to: pTo,
        rots: formattedRots,
        
        c1_no: crit['punctuality']?.no ? '☑' : '☐',
        c1_yes: crit['punctuality']?.yes ? '☑' : '☐',
        c2_no: crit['conduct']?.no ? '☑' : '☐',
        c2_yes: crit['conduct']?.yes ? '☑' : '☐',
        c3_no: crit['seriousness']?.no ? '☑' : '☐',
        c3_yes: crit['seriousness']?.yes ? '☑' : '☐',
        
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
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
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

  const handleCompleteStage = async () => {
    if (!window.confirm('هل أنت متأكد من إنهاء التدريب؟ سيتم مراجعة الوثائق وإصدار شهادة التدريب.')) return;
    try {
      const res = await api.post(`/interns/${id}/complete-stage`, {});
      toast.success(res.msg || 'تم إنهاء التدريب بنجاح');
      fetchInternAndAttendance();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'فشل في إنهاء التدريب');
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
          <button title="تحميل شهادة التدريب" onClick={() => setShowAttestationModal(true)} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#e0e7ff', border: '1.5px solid #6366f1', color: '#1a1a1a', transition: 'all 0.2s' }}>
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
          {(isAdmin || user?.role === 'Manager') && (
            <button title="إنهاء التدريب" onClick={handleCompleteStage} style={{ width: 'auto', padding: '0 12px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--gold)', border: '1.5px solid #d4af37', color: '#fff', transition: 'all 0.2s', fontWeight: 'bold' }}>
              إنهاء التدريب
            </button>
          )}
          {isAdmin && (
            <button title="حذف" onClick={handleDelete} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fee2e2', border: '1.5px solid #ef4444', color: '#1a1a1a', transition: 'all 0.2s' }}>
              <Trash weight="bold" size={18} color="#1a1a1a" />
            </button>
          )}
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
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:16}}>
            <h3 style={{margin:0}}><FileText weight="bold" className="icon" /> مركز المستندات</h3>
          </div>

          {/* Filter tabs + add button */}
          <div style={{display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            {(['all', 'pending', 'completed'] as const).map(tab => {
              const counts = {
                all: docsLifecycle.length,
                pending: docsLifecycle.filter(d => d.status !== 'APPROVED_AND_SIGNED').length,
                completed: docsLifecycle.filter(d => d.status === 'APPROVED_AND_SIGNED').length
              };
              const labels = { all: 'الكل', pending: 'تحت الإجراء', completed: 'مكتمل' };
              return (
                <button key={tab} onClick={() => setDocFilter(tab)} style={{
                  padding:'6px 14px', borderRadius:20, border:'1px solid var(--line)', fontSize:12, fontWeight:600, cursor:'pointer',
                  background: docFilter === tab ? 'var(--ink)' : 'transparent',
                  color: docFilter === tab ? '#fff' : 'var(--slate)',
                  display:'flex', alignItems:'center', gap:6
                }}>
                  {labels[tab]}
                  {counts[tab] > 0 && <span style={{fontSize:10, background: docFilter === tab ? 'rgba(255,255,255,.2)' : 'var(--paper)', borderRadius:10, padding:'1px 7px'}}>{counts[tab]}</span>}
                </button>
              );
            })}
            </div>
            {canManageDocs && (
            <button className="btn btn-gold sm" onClick={async () => { setRequestTitle(''); setRequestActionTypes(new Set(['view'])); setRequestFiles([]); setSelectedVaultDocs([]); try { setVaultDocs(await api.get('/vault')); } catch {} setShowRequestModal(true); }} style={{fontSize:12, padding:'8px 16px'}}>
              + طلب مستند / إضافة ملف
            </button>
            )}
          </div>

          {/* Unified table */}
          {(() => {
            const filtered = docsLifecycle.filter(d => {
              if (docFilter === 'pending') return d.status !== 'APPROVED_AND_SIGNED';
              if (docFilter === 'completed') return d.status === 'APPROVED_AND_SIGNED';
              return true;
            }).sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
            return (
            <div style={{marginBottom:20}}>
              {filtered.length === 0 ? (
                <div className="empty-state" style={{padding:'32px 20px', border:'1px solid var(--line)', borderRadius:12}}>
                  <div className="empty-icon"><FileText size={24} /></div>
                  <h4>لا توجد مستندات</h4>
                  <p>لم يتم رفع أي مستندات بعد.</p>
                </div>
              ) : (
              <table className="table" style={{background:'white'}}>
                <thead>
                  <tr>
                    <th style={{textAlign:'right'}}>المستند</th>
                    <th style={{textAlign:'center', width:120}}>الحالة</th>
                    <th style={{textAlign:'center', width:120}}>تاريخ التحديث</th>
                    <th style={{textAlign:'left', width:180}}>إجراء</th>
                  </tr>
                </thead>
                <tbody>
              {(() => {
                const rows: any[] = [];
                const grouped = new Map<string, any[]>();
                filtered.forEach(d => {
                  const base = (d.custom_title || d.doc_type || '').replace(/\s*\(.*?\)\s*$/, '');
                  if (!grouped.has(base)) grouped.set(base, []);
                  grouped.get(base)!.push(d);
                });
for (const [base, docs] of grouped) {
                  const sign = docs.find(d => d.action_type === 'sign');
                  const fill = docs.find(d => d.action_type === 'fill');
                  const both = docs.find(d => d.action_type === 'sign_fill');
                  if (sign && fill) {
                    rows.push({ id: `combined-${base}`, isCombined: true, sign, fill, base });
                  } else if (both) {
                    // sign_fill is a single combined action - treat as combined row
                    rows.push({ id: `combined-${base}`, isCombined: true, sign: both, fill: both, base, isSignFill: true });
                  } else {
                    docs.forEach(d => rows.push(d));
                  }
                }
return rows.map(row => {
                  if (row.isCombined) {
                    const d = row.sign;
                    const fillDoc = row.fill;
                    const bothReturned = d.returned_file_path && fillDoc.returned_file_path;
                    const anyReturned = d.returned_file_path || fillDoc.returned_file_path;
                    const isSignFillRow = !!row.isSignFill;
                    return (
                    <tr key={row.id} style={{borderBottom:'1px solid var(--line)'}}>
                      <td style={{padding:'10px 8px'}}>
                        <div style={{fontWeight:600, color:'var(--ink)'}}>
                          {row.base}
                          <span style={{fontSize:10, color:'var(--slate-light)', marginRight:6}}>{isSignFillRow ? '(توقيع وتعبئة)' : '(توقيع) و (تعبئة وإرجاع)'}</span>
                        </div>
                        {anyReturned && (
                          <div style={{marginTop:4}}>
                            <span style={{display:'inline-flex', alignItems:'center', gap:4, background: bothReturned ? '#E7F8EE' : '#FFF6E5', color: bothReturned ? '#15803D' : '#B45309', fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:9999}}>
                              {bothReturned ? <CheckCircle size={10} weight="fill" /> : <ArrowsClockwise size={10} weight="bold" />}
                              {bothReturned ? 'تمت الإعادة (توقيع وتعبئة)' : 'جاري الإعادة'}
                            </span>
                          </div>
                        )}
                      </td>
<td style={{textAlign:'center', padding:'10px 8px'}}>
                        {bothReturned ? <span className="badge badge-success" style={{fontSize:11}}>مكتمل</span> :
                         anyReturned ? <span className="badge badge-warning" style={{fontSize:11}}>قيد الإجراء</span> :
                         (d.status === 'APPROVED_AND_SIGNED' && fillDoc.status === 'APPROVED_AND_SIGNED') ? <span className="badge badge-success" style={{fontSize:11}}>مكتمل</span> :
                         (d.status === 'PENDING_REVIEW' || fillDoc.status === 'PENDING_REVIEW') ? <span className="badge badge-warning" style={{fontSize:11}}>قيد المراجعة</span> :
                         (d.status === 'AWAITING_RETURN' || fillDoc.status === 'AWAITING_RETURN') ? <span className="badge" style={{fontSize:11, background:'var(--paper)', color:'var(--slate)'}}>بانتظار التوقيع والتعبئة</span> :
                         <span className="badge" style={{fontSize:11, background:'var(--paper)', color:'var(--slate)'}}>بانتظار الرفع</span>}
                      </td>
                      <td style={{textAlign:'center', padding:'10px 8px', color:'var(--slate)', fontSize:11}}>
                        {(d.file_path || fillDoc.file_path) ? formatDate((d.file_path ? d : fillDoc).updated_at || (d.file_path ? d : fillDoc).created_at) : '—'}
                      </td>
                      <td style={{textAlign:'left', padding:'10px 8px'}}>
                        <div style={{display:'flex', gap:4, justifyContent:'flex-end', flexWrap:'wrap'}}>
                          {/* View/download original */}
                          {(d.file_path || fillDoc.file_path) && (() => {
                            const fileDoc = d.file_path ? d : fillDoc;
                            return (
                              <>
                                <button className="btn btn-ghost sm" onClick={() => window.open(api.downloadDocument(fileDoc.id), '_blank')} title="معاينة الأصل" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                  <Eye size={14} />
                                </button>
                                <button className="btn btn-ghost sm" onClick={() => { const a = document.createElement('a'); a.href = api.downloadDocument(fileDoc.id); a.download = ''; a.click(); }} title="تحميل الأصل" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                  <DownloadSimple size={14} />
                                </button>
                              </>
                            );
                          })()}
                          {/* View returned file */}
                          {anyReturned && (() => {
                            const retDoc = d.returned_file_path ? d : fillDoc;
                            return (
                              <button className="btn btn-ghost sm" onClick={() => window.open(api.downloadDocument(retDoc.id) + '&returned=1', '_blank')} title="معاينة النسخة المعادة" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--success)'}}>
                                <Eye size={14} />
                              </button>
                            );
                          })()}
                          {/* Admin approve revision requests for combined doc logic doesn't fully apply here currently but kept structure */}
                        </div>
                      </td>
                    </tr>
                    );
                  }
                  
                  const d = row;
                  const isTemplate = d.source === 'TEMPLATE_VIEW';
                  const actionLabelMap: any = { 'view': 'عرض فقط', 'sign': 'توقيع', 'fill': 'تعبئة وإرجاع', 'sign_fill': 'توقيع وتعبئة' };
                  const actionLabel = isTemplate ? 'مستند مطلوب' : (actionLabelMap[d.action_type] || 'رفع');
                  const isSignFill = d.action_type === 'sign' || d.action_type === 'fill' || d.action_type === 'sign_fill';
                  const isView = d.action_type === 'view';
                  
// Determine status label based on action_type and status
                  const getStatusBadge = () => {
                    if (d.status === 'APPROVED_AND_SIGNED') return <span className="badge badge-success" style={{fontSize:11}}>مقبول</span>;
                    if (d.status === 'REVISION_REQUESTED') return <span className="badge badge-danger" style={{fontSize:11}}>مطلوب إعادة</span>;
                    if (d.status === 'RETURNED') return <span className="badge badge-warning" style={{fontSize:11}}>بانتظار المراجعة</span>;
                    if (d.status === 'PENDING_REVIEW') return <span className="badge badge-warning" style={{fontSize:11}}>قيد المراجعة</span>;

                    // For MISSING and AWAITING_RETURN, label depends on action_type
                    if (d.status === 'MISSING') {
                      if (d.file_path) return <span className="badge badge-warning" style={{fontSize:11, background:'#FEF3C7', color:'#B45309'}}>قيد المراجعة</span>;
                      return <span className="badge" style={{fontSize:11, background:'var(--paper)', color:'var(--slate)'}}>بانتظار الرفع</span>;
                    }
                    if (d.action_type === 'sign') return <span className="badge" style={{fontSize:11, background:'#FEF3C7', color:'#B45309'}}>بانتظار التوقيع</span>;
                    if (d.action_type === 'fill') return <span className="badge" style={{fontSize:11, background:'#FEF3C7', color:'#B45309'}}>بانتظار التعبئة</span>;
                    if (d.action_type === 'sign_fill') return <span className="badge" style={{fontSize:11, background:'#FEF3C7', color:'#B45309'}}>بانتظار التوقيع والتعبئة</span>;
                    return <span className="badge" style={{fontSize:11, background:'var(--paper)', color:'var(--slate)'}}>{d.status}</span>;
                  };
                  
                  const showViewDownload = !!d.file_path;
                  const showReturnedView = !!d.returned_file_path;
                  const showApprove = canManageDocs && (d.status === 'RETURNED' || d.status === 'PENDING_REVIEW');
                  const showRevisionRequest = canManageDocs && isSignFill && d.status !== 'MISSING' && d.status !== 'APPROVED_AND_SIGNED';

                  return (
                    <tr key={d.id} style={{borderBottom:'1px solid var(--line)'}}>
                      <td style={{padding:'10px 8px'}}>
                        <div style={{fontWeight:600, color:'var(--ink)'}}>
                          {d.custom_title || d.doc_type}
                          {actionLabel && <span style={{fontSize:10, color:'var(--slate-light)', marginRight:6}}>({actionLabel})</span>}
                        </div>
                      {d.rejection_reason && d.status === 'REVISION_REQUESTED' && (
                        <div style={{fontSize:11, color:'var(--danger)', marginTop:2, background:'#FFF0EE', padding:'3px 6px', borderRadius:4}}>
                          <span style={{fontWeight:600}}>ملاحظة الإدارة:</span> {d.rejection_reason}
                        </div>
                      )}
                      {isSignFill && d.file_path && !d.returned_file_path && (
                        <div style={{marginTop:4}}>
                          <span style={{display:'inline-flex', alignItems:'center', gap:4, background:'#FEF3C7', color:'#B45309', fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:9999}}>
                            في انتظار الرد من المتدرب
                          </span>
                        </div>
                      )}
                      {isSignFill && d.returned_file_path && (
                        <div style={{marginTop:4}}>
                          <span style={{display:'inline-flex', alignItems:'center', gap:4, background:'#E7F8EE', color:'#15803D', fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:9999}}>
                            <CheckCircle size={10} weight="fill" /> تمت الإعادة
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{textAlign:'center', padding:'10px 8px'}}>
                      {getStatusBadge()}
                    </td>
                    <td style={{textAlign:'center', padding:'10px 8px', color:'var(--slate)', fontSize:11}}>
                      {d.file_path ? formatDate(d.updated_at || d.created_at) : '—'}
                    </td>
                    <td style={{textAlign:'left', padding:'10px 8px'}}>
                      <div style={{display:'flex', gap:4, justifyContent:'flex-end'}}>
                        {showViewDownload && (
                          <>
                            <button className="btn btn-ghost sm" onClick={() => window.open(api.downloadDocument(d.id), '_blank')} title="معاينة" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <Eye size={14} />
                            </button>
                            <button className="btn btn-ghost sm" onClick={() => { const a = document.createElement('a'); a.href = api.downloadDocument(d.id); a.download = ''; a.click(); }} title="تحميل" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <DownloadSimple size={14} />
                            </button>
                          </>
                        )}
                        {showReturnedView && (
                          <button className="btn btn-ghost sm" onClick={() => window.open(api.downloadDocument(d.id) + '&returned=1', '_blank')} title="معاينة النسخة المعادة" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--success)'}}>
                            <Eye size={14} />
                          </button>
                        )}
                        {showApprove && (
                          <button className="btn btn-ghost sm" onClick={() => api.approveDocument(Number(id), d.id).then(() => fetchDocsLifecycle())} title="قبول" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--success)'}}>
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {showRevisionRequest && (
                          <button className="btn btn-ghost sm" onClick={() => { setRevisionDocId(d.id); setRevisionReason(''); setShowRevisionModal(true); }} title="طلب إعادة" style={{width:28,height:28,padding:0,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gold-dark)'}}>
                            <ArrowsClockwise size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                });
              })()}
                </tbody>
              </table>
              )}
            </div>
            );
          })()}

            {/* ZIP archive */}
            <div style={{borderTop:'1px solid var(--line)', paddingTop:16}}>
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
              <Package size={16} style={{marginLeft:6}} /> تحميل أرشيف ZIP لجميع ملفات المتدرب
            </button>
          </div>
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
        <div id="evaluation-section" className="card" style={{ padding: '28px', marginTop: '24px', borderTop: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 'bold' }}>بطاقة تقييم المتدرب</h3>
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
                <b>الفترة:</b> من {formatDate(intern.evaluation.period_from || intern.start_date)} إلى {formatDate(intern.evaluation.period_to || intern.end_date)}
              </div>
              {intern.evaluation.rotations?.length > 0 && (
                <div style={{marginBottom:14, fontSize:12.5}}>
                  <div style={{fontWeight:700, marginBottom:6}}>فترات التدريب:</div>
                  {intern.evaluation.rotations.map((r: any, i: number) => (
                    <div key={i} style={{background:'var(--paper)', padding:'6px 10px', borderRadius:6, marginBottom:4, border:'1px solid var(--line)'}}>
                      <b>{(r as any).label || ('الفترة '+(i+1))}</b> — {r.supervisor} | {r.department} | من {formatDate(r.from)} إلى {formatDate(r.to)}
                    </div>
                  ))}
                </div>
              )}
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:12.5, marginBottom:12}}>
                <thead><tr style={{borderBottom:'1px solid var(--line)'}}>
                  <th style={{textAlign:'right', padding:'6px 4px', width: 200}}>المعيار</th>
                  <th style={{textAlign:'center', padding:'6px 4px', width:60}}>نعم</th>
                  <th style={{textAlign:'center', padding:'6px 4px', width:60}}>لا</th>
                  <th style={{width: 'auto'}}></th>
                </tr></thead>
                <tbody>
                  {EVAL_CRITERIA.map(c => {
                    const val = intern.evaluation.criteria?.[c.key] || {yes:false, no:false};
                    return (
                      <tr key={c.key} style={{borderBottom:'1px solid var(--line)'}}>
                        <td style={{padding:'8px 4px', fontWeight:600}}>{c.label}</td>
                        <td style={{textAlign:'center', padding:'8px 4px', color: val.yes ? 'var(--success)' : 'var(--slate-light)'}}>{val.yes ? '✓' : '—'}</td>
                        <td style={{textAlign:'center', padding:'8px 4px', color: val.no ? 'var(--danger)' : 'var(--slate-light)'}}>{val.no ? '✓' : '—'}</td>
                        <td></td>
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

      {/* Exit Docs & Archive */}
      {(intern.status === 'نشط' || intern.status === 'مكتمل') && (
        <div className="card" style={{ padding: '28px', marginTop: '24px', borderTop: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 'bold' }}>ختام التدريب والأرشيف</h3>
              <p style={{ margin: 0, color: 'var(--slate)', fontSize: '0.95rem' }}>إصدار شهادة التدريب وتحميل الأرشيف الكامل لملفات المتدرب.</p>
            </div>
            <div style={{display:'flex', gap:8}}>
              <a href={api.exportInternZip(intern.id)} download className="btn btn-ghost" style={{ padding: '10px 20px', fontWeight: 'bold', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <Package size={18} weight="fill" /> تحميل أرشيف الملفات ZIP
              </a>
              <button className="btn btn-primary" onClick={() => setShowAttestationModal(true)} style={{ padding: '10px 20px', fontWeight: 'bold', fontSize: '13px', borderRadius: '8px', background: 'var(--danger)', color: '#fff', border: 'none' }}>
                <Certificate size={18} weight="fill" /> إصدار شهادة التدريب
              </button>
            </div>
          </div>
        </div>
      )}
      <AttestationModal 
        isOpen={showAttestationModal} 
        onClose={() => setShowAttestationModal(false)} 
        intern={intern} 
      />

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
              <h3>بطاقة تقييم المتدرب</h3>
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
                      <b style={{fontSize:12}}>{(r as any).label || ('الفترة '+(i+1))}</b>
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
                    <th style={{textAlign:'right', padding:'6px 4px', width: 200}}>المعيار</th>
                    <th style={{textAlign:'center', padding:'6px 4px', width:60}}>نعم</th>
                    <th style={{textAlign:'center', padding:'6px 4px', width:60}}>لا</th>
                    <th style={{width: 'auto'}}></th>
                  </tr></thead>
                  <tbody>
                    {EVAL_CRITERIA.map(c => {
                      const val = evalCriteria[c.key] || {yes:false, no:false};
                      return (
                        <tr key={c.key} style={{borderBottom:'1px solid var(--line)'}}>
                          <td style={{padding:'8px 4px', fontWeight:600}}>{c.label}</td>
                          <td style={{textAlign:'center', padding:'8px 4px'}}>
                            <input type="checkbox" checked={val.yes} onChange={e => setEvalCriteria({...evalCriteria, [c.key]:{...val, yes: e.target.checked}})} style={{width:18,height:18,cursor:'pointer'}} />
                          </td>
                          <td style={{textAlign:'center', padding:'8px 4px'}}>
                            <input type="checkbox" checked={val.no} onChange={e => setEvalCriteria({...evalCriteria, [c.key]:{...val, no: e.target.checked}})} style={{width:18,height:18,cursor:'pointer'}} />
                          </td>
                          <td></td>
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
                  <input type="text" inputMode="numeric" className="input" style={{padding:'8px 11px', fontSize:13}} value={approveStartDisplay} onChange={e => setApproveStartDisplay(e.target.value)} placeholder="dd/mm/yyyy" />
                  <input type="date" ref={startDateRef} style={{display:'none'}} onChange={e => { setApproveStartDate(e.target.value); setApproveStartDisplay(formatDate(e.target.value)); }} />
                </div>
                <div className="form-group" style={{margin:0}}>
                  <label style={{fontSize:12}}>تاريخ الانتهاء</label>
                  <input type="text" inputMode="numeric" className="input" style={{padding:'8px 11px', fontSize:13}} value={approveEndDisplay} onChange={e => setApproveEndDisplay(e.target.value)} placeholder="dd/mm/yyyy" />
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
                <TextArea value={revisionReason} onChange={e => setRevisionReason(e.target.value)} placeholder="يرجى توضيح سبب طلب إعادة الرفع للمتدرب..." />
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

      {showRequestModal && (
        <div className="overlay on" style={{ display: 'flex' }}>
          <div className="modal" style={{maxWidth:600}}>
            <div className="modal-head">
              <h3>طلب مستند / إضافة ملف</h3>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowRequestModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              {showRequestModal && vaultDocs.length === 0 && (
                <div style={{marginBottom:16, padding:'10px 14px', background:'#EFF6FF', borderRadius:8, border:'1px solid #BFDBFE', fontSize:13, color:'#1E40AF'}}>
                  جارٍ تحميل المستندات من الخزنة...
                </div>
              )}

              <div className="form-group">
                <label>اسم المستند</label>
                <input type="text" className="input" value={requestTitle} onChange={e => setRequestTitle(e.target.value)} placeholder="اتفاقية التدريب المعدلة 2026" />
                {requestFiles.length === 0 && selectedVaultDocs.length === 0 && <small style={{color:'var(--slate-light)',display:'block',marginTop:4}}>إذا لم تختر ملفًا، سيتم إنشاء طلب للمتدرب لرفع المستند</small>}
              </div>

              <div className="form-group">
                <label>الملف</label>
                <div style={{display:'flex', gap:8, alignItems:'flex-start'}}>
                    <div style={{flex:1}}>
                        <input type="file" className="input" id="file-upload-input" multiple accept=".pdf,.doc,.docx" onChange={e => {
                          if (e.target.files) {
                            const files = Array.from(e.target.files);
                            setRequestFiles(files);
                            if (!requestTitle.trim() && files.length > 0) {
                              setRequestTitle(files[0].name.replace(/\.\w+$/, ''));
                            }
                          }
                        }} style={{display:'none'}} />
                        <button type="button" className="btn btn-ghost" onClick={() => document.getElementById('file-upload-input')?.click()} style={{width:'100%', justifyContent:'center', padding:'10px', fontSize:13, border:'1.5px dashed var(--line)', borderRadius:8}}>
                          <UploadSimple size={16} /> {requestFiles.length > 0 ? 'تغيير الملفات' : 'اختيار ملف من الجهاز'}
                        </button>
                        {requestFiles.map((f, i) => (
                          <div key={i} style={{marginTop:6, padding:'6px 10px', background:'#EFF6FF', borderRadius:6, border:'1px solid #BFDBFE', fontSize:12, display:'flex', alignItems:'center', gap:6}}>
                            <FileText size={14} color="#2563EB" />
                            <span style={{fontWeight:600}}>{f.name}</span>
                            <button className="btn btn-ghost sm" onClick={() => setRequestFiles(prev => prev.filter((_, j) => j !== i))} style={{marginRight:'auto', padding:2}}><X size={14} /></button>
                          </div>
                        ))}
                        {selectedVaultDocs.map((vd, i) => (
                          <div key={'vd'+i} style={{marginTop:6, padding:'6px 10px', background:'#F5F3EE', borderRadius:6, border:'1px solid #E5DDD0', fontSize:12, display:'flex', alignItems:'center', gap:6}}>
                            <FileText size={14} color="#9B8B6B" weight="fill" />
                            <span style={{fontWeight:600}}>{vd}</span>
                            <button className="btn btn-ghost sm" onClick={() => setSelectedVaultDocs(prev => prev.filter(v => v !== vd))} style={{marginRight:'auto', padding:2}}><X size={14} /></button>
                          </div>
                        ))}
                    </div>
                    <button type="button" className="btn btn-gold" onClick={() => setShowVaultModal(true)} style={{padding:'10px 14px', fontSize:13, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', gap:6}}>
                      <Folder size={16} /> إضافة من الخزنة
                    </button>
                </div>
              </div>

              <div className="form-group" style={{marginTop:16}}>
                <label>نوع الطلب للملفات المرفوعة</label>
                <div style={{display:'flex', flexDirection:'column', gap:8, padding:'8px 12px', background:'var(--paper)', borderRadius:8, border:'1px solid var(--line)'}}>
                   {(['view','sign','fill'] as const).map(type => {
                      const viewLocked = type === 'view' && (requestActionTypes.has('sign') || requestActionTypes.has('fill'));
                      return (
                      <label key={type} style={{display:'flex', alignItems:'center', gap:10, cursor: viewLocked ? 'not-allowed' : 'pointer', fontSize:13, padding:'4px 0', opacity: viewLocked ? 0.5 : 1}}>
                        <input type="checkbox" checked={requestActionTypes.has(type)} disabled={viewLocked} onChange={e => {
                          const next = new Set(requestActionTypes);
                          if (type === 'sign' || type === 'fill') next.delete('view');
                          e.target.checked ? next.add(type) : next.delete(type);
                          if (next.size === 0) next.add('view');
                          setRequestActionTypes(next);
                        }} style={{width:18,height:18,cursor: viewLocked ? 'not-allowed' : 'pointer', accentColor:'var(--gold-dark)'}} />
                        <span style={{fontWeight: requestActionTypes.has(type) ? 600 : 400}}>
                          {type === 'view' ? 'عرض فقط — المتدرب يرى ويحمل المستند' : ''}
                          {type === 'sign' ? 'توقيع — المتدرب يوقع ويعيد النسخة' : ''}
                          {type === 'fill' ? 'تعبئة وإرجاع — المتدرب يعبي النموذج ويعيده' : ''}
                        </span>
                      </label>
                      );
                   })}
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowRequestModal(false)}>إلغاء</button>
              <button className="btn btn-gold" disabled={
                !requestTitle.trim() && requestFiles.length === 0
              } onClick={async () => {
                try {
                  let total = 0;
                  let types = Array.from(requestActionTypes);
                  if (types.includes('sign') && types.includes('fill')) types = ['sign_fill'];
                  const primaryType = types[0] || 'view';

                  if (requestFiles.length > 0) {
                    for (const file of requestFiles) {
                      const title = requestTitle.trim() || file.name.replace(/\.\w+$/, '') || 'مستند';
                      await api.uploadSignedDocument(Number(id), 'OTHER', file, title, primaryType);
                      for (let i = 1; i < types.length; i++) {
                        await api.post(`/interns/${id}/document-lifecycle`, { document_type: 'OTHER', custom_title: title, action_type: types[i] });
                      }
                    }
                    total += requestFiles.length;
                  } else if (requestTitle.trim()) {
                    const title = requestTitle.trim();
                    for (const t of types) {
                      await api.post(`/interns/${id}/document-lifecycle`, { document_type: 'OTHER', custom_title: title, action_type: t });
                    }
                    total += 1;
                  }

                  if (total > 0) toast.success(`تم إرسال ${total} مستند${total > 1 ? 'ات' : ''} بنجاح`);
                  setShowRequestModal(false);
                  setRequestFiles([]);
                  setRequestActionTypes(new Set(['view']));
                  fetchDocsLifecycle();
                } catch (err) {
                  toast.error('فشل إرسال الطلب');
                }
              }}>
                إرسال{requestFiles.length > 1 || requestActionTypes.size > 1 ? ` (${requestFiles.length || 1})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vault Multiple Selection Modal */}
      {showVaultModal && (
        <div className="overlay on" style={{display:'flex', zIndex:50}}>
          <div className="modal" style={{maxWidth:'800px', width:'90%'}}>
            <div className="modal-head" style={{borderBottom:'1px solid #E5E7EB', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderRadius:'16px 16px 0 0'}}>
              <div>
                <h3 style={{margin:0, fontSize:'16px', fontWeight:'bold', color:'#111827'}}>اختيار مستندات من الخزنة</h3>
              </div>
              <button className="btn-close" onClick={() => setShowVaultModal(false)} style={{background:'#F3F4F6', border:'none', width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#4B5563'}}>
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="modal-body" style={{padding:'24px', maxHeight:'65vh', overflowY:'auto', background:'#F9FAFB'}}>
              {vaultDocs.length === 0 ? (
                <div style={{textAlign:'center',padding:'24px 20px',color:'var(--slate-light)',fontSize:13}}>لا توجد مستندات في الخزنة</div>
              ) : (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16}}>
                  {vaultDocs.map((vd: any) => {
                    const isSelected = selectedVaultDocs.includes(vd.name);
                    const isPdf = vd.name.toLowerCase().endsWith('.pdf');
                    const sizeStr = vd.size ? (vd.size / 1024).toFixed(1) + ' KB' : 'مستند من الخزنة';
                    return (
                      <div key={vd.name} onClick={() => {
                          if (isSelected) setSelectedVaultDocs(prev => prev.filter(v => v !== vd.name));
                          else setSelectedVaultDocs(prev => [...prev, vd.name]);
                        }} style={{
                        display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 20px', 
                        border: isSelected ? '2px solid var(--gold-dark)' : '1px solid #E5E7EB',
                        borderRadius:16, background: '#fff', cursor:'pointer', transition:'all 0.15s',
                        position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}>
                        {/* Checkbox at top-right for RTL */}
                        <div style={{position:'absolute', top:16, right:16}}>
                          <input type="checkbox" checked={isSelected} onChange={() => {}} style={{width:18, height:18, cursor:'pointer', accentColor:'var(--gold-dark)'}} />
                        </div>
                        
                        {/* File Icon */}
                        <div style={{
                          width:72, height:72, borderRadius:20, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                          background: isPdf ? '#FCE8E8' : '#E0F2FE', color: isPdf ? '#DC2626' : '#0284C7', marginBottom:20
                        }}>
                          {isPdf ? <FilePdf size={32} weight="fill" /> : <FileDoc size={32} weight="fill" />}
                          <span style={{fontSize:12, fontWeight:800, marginTop:4}}>{isPdf ? 'PDF' : 'DOC'}</span>
                        </div>

                        {/* Text */}
                        <h4 style={{margin:'0 0 8px 0', fontSize:15, fontWeight:700, color:'#111827', textAlign:'center', width:'100%', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={vd.name}>
                          {vd.name.includes('.') ? vd.name.split('.').slice(0, -1).join('.') : vd.name}
                        </h4>
                        <div style={{fontSize:12, color:'#6B7280', marginBottom:20}}>
                          {sizeStr}
                        </div>

                        {/* Actions */}
                        <div style={{display:'flex', width:'100%', marginTop:'auto'}} onClick={e => e.stopPropagation()}>
                          <button className="btn" style={{flex:1, padding:'8px 0', background:'#fff', color:'#111827', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6}} onClick={() => {
                            const url = API_BASE + '/vault/' + encodeURIComponent(vd.name);
                            toast.info('جاري إعداد المستند للعرض...');
                            handleViewFile(url, vd.name).catch(() => toast.error('حدث خطأ أثناء الفتح'));
                          }}>
                            <Eye size={16} /> عرض
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-foot" style={{background:'#F9FAFB', borderTop:'1px solid #E5E7EB', padding:'16px 24px', borderRadius:'0 0 16px 16px', display:'flex', justifyContent:'center'}}>
              <button className="btn btn-gold" style={{width:'100%', display:'flex', justifyContent:'center', alignItems:'center'}} onClick={() => {
                if (selectedVaultDocs.length > 0 && !requestTitle.trim()) {
                  const docName = selectedVaultDocs[0];
                  const title = docName.includes('.') ? docName.split('.').slice(0, -1).join('.') : docName;
                  setRequestTitle(title);
                }
                setShowVaultModal(false);
              }}>
                تأكيد الاختيار {selectedVaultDocs.length > 0 ? '(' + selectedVaultDocs.length + ')' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vault action type modal */}
      {showVaultActionModal && selectedVaultDocName && (
        <div className="overlay on" style={{display:'flex', zIndex:50}}>
          <div className="modal" style={{maxWidth:'480px'}}>
            <div className="modal-head" style={{borderBottom:'1px solid #E5E7EB', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderRadius:'16px 16px 0 0'}}>
              <div>
                <h3 style={{margin:0, fontSize:'18px', fontWeight:'bold', color:'#111827'}}>إضافة مستند من الخزنة</h3>
                <p style={{margin:'4px 0 0 0', fontSize:'14px', color:'#6B7280'}}>اختر نوع الطلب للمستند</p>
              </div>
              <button className="btn-close" onClick={() => setShowVaultActionModal(false)} style={{background:'#F3F4F6', border:'none', width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#4B5563'}}>
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="modal-body" style={{padding:'24px'}}>
              <div style={{marginBottom:20, padding:'12px 16px', background:'#F5F3EE', borderRadius:10, border:'1px solid #E5DDD0'}}>
                <div style={{fontWeight:700, fontSize:14, color:'#9B8B6B'}}>{selectedVaultDocName}</div>
                <div style={{fontSize:12, color:'#6B7280', marginTop:2}}>مستند من الخزنة</div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
                {(['view','sign','sign_fill','fill'] as const).map(type => {
                  const labels = {
                    view: { title: 'عرض فقط', desc: 'المتدرب يرى ويحمل المستند', icon: 'Eye', color: '#0284C7', bg: '#E0F2FE' },
                    sign: { title: 'توقيع', desc: 'المتدرب يوقع ويعيد النسخة', icon: 'Pen', color: '#7C3AED', bg: '#EDE9FE' },
                    sign_fill: { title: 'توقيع وتعبئة', desc: 'المتدرب يوقع ويعبي النموذج ويعيده', icon: 'ClipboardText', color: '#B45309', bg: '#FEF3C7' },
                    fill: { title: 'تعبئة وإرجاع', desc: 'المتدرب يعبي النموذج ويعيده', icon: 'ClipboardText', color: '#DC2626', bg: '#FCE8E8' },
                  }[type];
                  return (
                    <button key={type} onClick={async () => {
                      try {
                        await api.post(`/interns/${id}/vault-attach`, {
                          vault_name: selectedVaultDocName, doc_type: 'OTHER',
                          custom_title: selectedVaultDocName, action_type: type
                        });
                        toast.success(`تمت إضافة المستند من الخزنة (${labels.title})`);
                        setShowVaultActionModal(false);
                        setSelectedVaultDocName('');
                        fetchDocsLifecycle();
                      } catch {
                        toast.error('فشلت الإضافة من الخزنة');
                      }
                    }} style={{
                      width:'100%', display:'flex', alignItems:'center', gap:14,
                      padding:'16px 18px', borderRadius:12, border:'1px solid #E5E7EB',
                      background:'#fff', cursor:'pointer', textAlign:'right',
                      transition:'all 0.15s', boxShadow:'0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:labels.bg, color:labels.color, flexShrink:0}}>
                        <FileText size={22} weight="fill" />
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700, fontSize:14, color:'#111827'}}>{labels.title}</div>
                        <div style={{fontSize:12, color:'#6B7280', marginTop:2}}>{labels.desc}</div>
                      </div>
                      <div style={{color:'var(--gold-dark)', fontSize:13}}>+</div>
                    </button>
                  );
                })}
              </div>
              <button className="btn btn-ghost" onClick={() => { window.open(`/api/vault/open/${selectedVaultDocName}`, '_blank'); }} style={{width:'100%', justifyContent:'center', marginTop:16, fontSize:13}}>
                <Eye size={16} /> معاينة المستند
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
