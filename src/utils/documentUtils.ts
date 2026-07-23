import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';

// --- PDF Methods ---

export const printHTML = (html: string) => {
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
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    }, 500);
  };
};

export const downloadHtmlAsPdf = (html: string, filename: string, margin: number = 15) => {
  const container = document.createElement('div');
  container.innerHTML = html;
  const opt = {
    margin,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(container).save();
};

export const viewHtmlAsPdf = async (html: string) => {
  const container = document.createElement('div');
  container.innerHTML = html;
  const opt = {
    margin: 15,
    filename: 'document.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  // Generate blob and open in new tab
  const pdfBlob = await html2pdf().set(opt).from(container).output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, '_blank');
};

// --- DOCX Methods ---

export const generateDocxBlob = async (templateUrl: string, data: any): Promise<Blob> => {
  const res = await fetch(templateUrl);
  if (!res.ok) throw new Error('Template not found');
  const blobData = await res.blob();
  const content = await blobData.arrayBuffer();
  
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(data);

  return doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
};

export const downloadDocx = async (templateUrl: string, data: any, filename: string) => {
  const blob = await generateDocxBlob(templateUrl, data);
  saveAs(blob, filename);
};

export const viewDocx = async (templateUrl: string, data: any) => {
  const blob = await generateDocxBlob(templateUrl, data);
  const res = await fetch('https://docx-viewer.mahkamaplus.com/upload', {
    method: 'POST',
    body: blob
  });
  if (!res.ok) throw new Error('Failed to upload docx');
  const url = await res.text();
  if (url) {
    window.open(url, '_blank');
  } else {
    throw new Error('Viewer URL not returned');
  }
};
