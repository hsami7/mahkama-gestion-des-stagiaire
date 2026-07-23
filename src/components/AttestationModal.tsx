import React from 'react';
import { X, FilePdf, FileDoc } from '@phosphor-icons/react';
import { useToast } from './Toast';
import { LOGO_BASE64 } from '../utils/logoBase64';
import { DocumentCard } from './DocumentCard';
import { downloadHtmlAsPdf, viewHtmlAsPdf, downloadDocx, viewDocx } from '../utils/documentUtils';

interface AttestationModalProps {
  isOpen: boolean;
  onClose: () => void;
  intern: any;
}

export function AttestationModal({ isOpen, onClose, intern }: AttestationModalProps) {
  const toast = useToast();

  if (!isOpen || !intern) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr.split('/').reverse().join('-'));
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const generateAttestationHtml = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const current_date = `${dd}/${mm}/${yyyy}`;

    return `<!DOCTYPE html>
<html dir="ltr">
<head>
  <meta charset="utf-8">
  <title>Attestation de stage</title>
  <style>
    @font-face {
      font-family: 'Tifinagh';
      src: local('Segoe UI Historic'), local('Noto Sans Tifinagh');
    }
    @page { margin: 15mm; }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
    }
    .header-text {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
    }
    .header-logo {
      width: 90px;
      height: 90px;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="header-text">
      Royaume du Maroc<br>
      Ministère de la Justice<br>
      Cour d'Appel Administrative<br>de Fès
    </div>
    <img src="${LOGO_BASE64}" class="header-logo" alt="Logo" />
    <div class="header-text" dir="rtl">
      المملكة المغربية<br>
      وزارة العدل<br>
      محكمة الإستئناف الإدارية<br>بفاس
    </div>
  </div>

  <h1 style="text-align: center; font-size: 28px; font-weight: bold; margin: 60px 0 40px 0; text-decoration: underline; text-transform: uppercase;">
    Attestation de Stage
  </h1>

  <p style="font-size: 18px; line-height: 2; margin-bottom: 30px; text-align: justify;">
    Le Secrétaire Général de la Cour d'Appel Administrative de Fès soussigné, atteste par la présente que :
  </p>

  <p style="font-size: 22px; font-weight: bold; text-align: center; margin: 40px 0;">
    Monsieur / Madame : ${intern?.name_fr || '......................'}
  </p>

  <p style="font-size: 18px; line-height: 2; text-align: justify;">
    Titulaire de la Carte Nationale d'Identité N° : <strong>${intern?.national_id || '............'}</strong>,<br><br>
    A effectué un stage pratique au sein des services de la Cour d'Appel Administrative de Fès,<br>
    durant la période allant du <strong>${intern?.start_date ? formatDate(intern.start_date) : '............'}</strong> au <strong>${intern?.end_date ? formatDate(intern.end_date) : '............'}</strong>.
  </p>

  <p style="font-size: 18px; line-height: 2; margin-top: 40px; text-align: justify;">
    Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.
  </p>

  <div style="margin-top: 80px; text-align: right; font-size: 18px; font-weight: bold;">
    Fait à Fès, le ${current_date}
  </div>
  <div style="margin-top: 30px; text-align: right; font-size: 18px; font-weight: bold; padding-right: 40px;">
    Signature et Cachet :
  </div>
</body>
</html>`;
  };

  const handleDownloadPdf = () => {
    try {
      const html = generateAttestationHtml();
      downloadHtmlAsPdf(html, `Attestation_de_stage_de_${intern?.name_fr || 'Stage'}.pdf`);
    } catch (e) {
      toast.error('حدث خطأ أثناء تحميل الشهادة PDF');
    }
  };

  const handleViewPdf = async () => {
    try {
      const html = generateAttestationHtml();
      await viewHtmlAsPdf(html);
    } catch (e) {
      toast.error('حدث خطأ أثناء عرض الشهادة PDF');
    }
  };

  const getDocxData = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return {
      name_fr: intern?.name_fr || '—',
      cni: intern?.national_id || '—',
      start_date: intern?.start_date ? formatDate(intern.start_date) : '—',
      end_date: intern?.end_date ? formatDate(intern.end_date) : '—',
      current_date: `${dd}/${mm}/${yyyy}`,
    };
  };

  const handleDownloadDocx = async () => {
    try {
      await downloadDocx('/attestation_template.docx', getDocxData(), `Attestation_de_stage_de_${intern?.name_fr || intern?.name || 'Intern'}.docx`);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحميل الشهادة Word');
    }
  };

  const handleViewDocx = async () => {
    try {
      toast.info('جاري إعداد المستند للعرض...');
      await viewDocx('/attestation_template.docx', getDocxData());
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء عرض الشهادة أو خدمة عرض الملفات غير متوفرة حالياً');
    }
  };

  return (
    <div className="overlay on" style={{ display: 'flex' }}>
      <div className="modal" style={{ maxWidth: '640px', background: '#f8fafc' }}>
        <div className="modal-head" style={{ borderBottom: '1px solid #E5E7EB', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: '16px 16px 0 0' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>خيارات شهادة التدريب</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6B7280' }}>اختر الصيغة التي تفضلها لاستخراج شهادة المتدرب</p>
          </div>
          <button className="btn-close" onClick={onClose} style={{ background: '#F3F4F6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4B5563' }}>
            <X size={16} weight="bold" />
          </button>
        </div>
        
        <div className="modal-body" style={{ padding: '32px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            <DocumentCard
              title={`Attestation de stage de ${intern?.name_fr || ''}`}
              subtitle="صيغة جاهزة للطباعة"
              icon={<FilePdf size={40} weight="fill" />}
              iconBg="#FCE8E8"
              iconColor="#DC2626"
              onView={handleViewPdf}
              onDownload={handleDownloadPdf}
            />

            <DocumentCard
              title={`Attestation de stage de ${intern?.name_fr || ''}`}
              subtitle="صيغة قابلة للتعديل"
              icon={<FileDoc size={40} weight="fill" />}
              iconBg="#E0F2FE"
              iconColor="#0284C7"
              onView={handleViewDocx}
              onDownload={handleDownloadDocx}
            />

          </div>
        </div>
      </div>
    </div>
  );
}
