import React from 'react';
import { Eye, DownloadSimple } from '@phosphor-icons/react';

interface DocumentCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  onView: () => void;
  onDownload: () => void;
}

export function DocumentCard({ title, subtitle, icon, iconColor, iconBg, onView, onDownload }: DocumentCardProps) {
  return (
    <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: '16px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
      <div style={{ background: iconBg, width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, marginBottom: '24px' }}>
        {icon}
      </div>
      
      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', color: '#111827', direction: 'ltr' }}>
        {title}
      </h4>
      
      <div style={{ color: '#6B7280', fontSize: '13px', marginBottom: '32px', textAlign: 'center' }}>
        {subtitle}
      </div>
      
      <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: 'auto' }}>
        <button onClick={onView} style={{ flex: 1, background: '#fff', color: '#111827', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          عرض <Eye size={18} />
        </button>
        <button onClick={onDownload} style={{ flex: 1, background: '#1E293B', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          تحميل <DownloadSimple size={18} />
        </button>
      </div>
    </div>
  );
}
