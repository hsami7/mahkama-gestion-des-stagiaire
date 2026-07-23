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

    return `
<div style="font-family: 'Arial', sans-serif; font-size: 16px; line-height: 1.8; color: #000; padding: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
    <div style="text-align: center; font-weight: bold; font-size: 13px; font-family: 'Tifinagh', sans-serif; line-height: 1.5;">
      ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ<br>
      ⵜⴰⵎⴰⵡⵙⵜ ⵏ ⵜⵥⵔⴼⵜ<br>
      ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ<br>ⴷⵉ ⴼⴰⵙ
    </div>
    <img src="${LOGO_BASE64}" style="width: 80px; height: auto; object-fit: contain;" alt="Logo" />
    <div dir="rtl" style="text-align: center; font-weight: bold; font-size: 15px; line-height: 1.5;">
      المملكة المغربية<br>
      وزارة العدل<br>
      المديرية الإقليمية<br>بفاس
    </div>
  </div>

  <div style="text-align: center; margin: 60px 0 40px 0;">
    <h1 style="font-size: 26px; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin: 0 0 10px 0;">
      Attestation de Stage
    </h1>
    <div style="font-size: 14px; font-style: italic;">
      (Il ne sera délivré qu'un seul exemplaire de cette attestation)
    </div>
  </div>

  <p style="font-size: 18px; margin-bottom: 25px; text-align: justify;">
    Le Chef de Service des Stages atteste que Mlle/Mr. <strong>${intern?.name_fr || '......................'}</strong>
  </p>

  <p style="font-size: 18px; margin-bottom: 25px; text-align: justify;">
    titulaire de la C.N.I.N° : <strong>${intern?.national_id || '............'}</strong> a effectué un stage pratique au sein de la
  </p>

  <p style="font-size: 18px; font-weight: bold; margin-bottom: 25px; text-align: justify;">
    Cour Administrative d'Appel de Fès (Ministère de la Justice) <span style="font-weight: normal;">et ce</span>
  </p>

  <p style="font-size: 18px; margin-bottom: 10px; text-align: justify;">
    du :
  </p>

  <p style="font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0 35px 0;">
    ${intern?.start_date ? formatDate(intern.start_date) : '............'} Au ${intern?.end_date ? formatDate(intern.end_date) : '............'}
  </p>

  <p style="font-size: 18px; margin-bottom: 25px; text-align: justify;">
    Pendant toute la période du stage, l'intéressé(e) a montré un grand intérêt pour son travail qu'il/elle a mené avec sérieux et assiduité.
  </p>

  <p style="font-size: 18px; margin-bottom: 60px; text-align: justify;">
    Cette attestation est délivrée à l'intéressé(e), sur sa demande, pour servir et valoir ce que de droit.
  </p>

  <div style="text-align: center; font-size: 18px; margin-bottom: 20px;">
    Fait à Fès, le ${current_date}
  </div>
</div>`;
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
      await viewDocx('/attestation_template.docx', getDocxData(), `Attestation_de_stage_de_${intern?.name_fr || intern?.name || 'Intern'}.docx`);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء عرض الشهادة');
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
