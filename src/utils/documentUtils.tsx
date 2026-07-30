import React from 'react';

export type ViewerRole = 'ADMIN' | 'INTERN';

export interface DocumentRowType {
  id: string;
  status: string;
  action_type?: string;
  file_path?: string | null;
  returned_file_path?: string | null;
  requested_by?: string;
  uploaded_by?: string;
  source?: string;
  doc_type?: string;
  custom_title?: string;
  rejection_reason?: string;
  [key: string]: any;
}

export const getDocumentStatusLabel = (d: DocumentRowType, role: ViewerRole): string => {
  if (d.status === 'APPROVED_AND_SIGNED') return 'مقبول';
  if (d.status === 'REVISION_REQUESTED') return 'مطلوب إعادة';
  if (d.status === 'RETURNED') return role === 'ADMIN' ? 'بانتظار المراجعة' : 'تم الإرجاع';
  if (d.status === 'AWAITING_ADMIN') return 'بانتظار الإدارة';
  if (d.status === 'AWAITING_INTERN') return role === 'ADMIN' ? 'بانتظار المتدرب' : 'في انتظار قبولك';
  if (d.status === 'PENDING_REVIEW') return 'قيد المراجعة';
  
  if (d.status === 'MISSING') {
    if (d.file_path) return 'قيد المراجعة';
    return 'بانتظار الرفع';
  }
  
  if (d.status === 'AWAITING_RETURN' || (d.action_type === 'sign' || d.action_type === 'fill' || d.action_type === 'sign_fill')) {
    if (d.action_type === 'sign') return 'بانتظار التوقيع';
    if (d.action_type === 'fill') return 'بانتظار التعبئة';
    if (d.action_type === 'sign_fill') return 'بانتظار التوقيع والتعبئة';
  }
  
  return d.status || '—';
};

export const getDocumentBadge = (d: DocumentRowType, role: ViewerRole) => {
  const label = getDocumentStatusLabel(d, role);

  if (d.status === 'APPROVED_AND_SIGNED') return <span className="badge badge-success" style={{fontSize:11}}>{label}</span>;
  if (d.status === 'REVISION_REQUESTED') return <span className="badge badge-danger" style={{fontSize:11}}>{label}</span>;
  
  if (d.status === 'RETURNED') {
    return role === 'ADMIN' 
      ? <span className="badge badge-warning" style={{fontSize:11}}>{label}</span>
      : <span className="badge badge-success" style={{fontSize:11}}>{label}</span>; 
  }
  
  if (d.status === 'AWAITING_ADMIN') return <span className="badge badge-warning" style={{fontSize:11, background:'#FEF3C7', color:'#B45309'}}>{label}</span>;
  if (d.status === 'AWAITING_INTERN') return <span className="badge badge-warning" style={{fontSize:11}}>{label}</span>;
  if (d.status === 'PENDING_REVIEW') return <span className="badge badge-warning" style={{fontSize:11}}>{label}</span>;

  if (d.status === 'MISSING') {
    if (d.file_path) return <span className="badge badge-warning" style={{fontSize:11, background:'#FEF3C7', color:'#B45309'}}>{label}</span>;
    return <span className="badge" style={{fontSize:11, background:'var(--paper)', color:'var(--slate)'}}>{label}</span>;
  }
  
  if (d.action_type === 'sign' || d.action_type === 'fill' || d.action_type === 'sign_fill') {
    return <span className="badge badge-warning" style={{fontSize:11, background:'#FEF3C7', color:'#B45309'}}>{label}</span>;
  }
  
  return <span className="badge" style={{fontSize:11, background:'var(--paper)', color:'var(--slate)'}}>{label}</span>;
};

// Common Helpers
export const isSignFillAction = (actionType?: string) => {
  return actionType === 'sign' || actionType === 'fill' || actionType === 'sign_fill';
};

export const isTemplateDoc = (d: DocumentRowType) => d.source === 'TEMPLATE_VIEW';

export const isTemplateAdminPending = (d: DocumentRowType) => isTemplateDoc(d) && d.status === 'PENDING_REVIEW' && d.uploaded_by === 'ADMIN';

export const isTemplateInternPending = (d: DocumentRowType) => isTemplateDoc(d) && d.status === 'PENDING_REVIEW' && d.uploaded_by === 'INTERN';

// UI Helpers for Action Buttons
export const canAdminApprove = (d: DocumentRowType, canManageDocs: boolean) => {
  return canManageDocs && (d.status === 'RETURNED' || (d.status === 'PENDING_REVIEW' && !isTemplateAdminPending(d)));
};

export const canAdminRequestRevision = (d: DocumentRowType, canManageDocs: boolean) => {
  const isSignFill = isSignFillAction(d.action_type);
  return canManageDocs && (isSignFill || isTemplateInternPending(d)) && d.file_path && 
         d.status !== 'MISSING' && d.status !== 'APPROVED_AND_SIGNED' && 
         d.status !== 'AWAITING_RETURN' && d.status !== 'AWAITING_ADMIN' && 
         d.status !== 'PENDING_REVIEW' && d.status !== 'REVISION_REQUESTED' && 
         d.status !== 'AWAITING_INTERN';
};

export const canInternUpload = (d: DocumentRowType) => {
  const isSignFill = isSignFillAction(d.action_type);
  const isInternInitiatedSignFill = d.requested_by === 'INTERN' && isSignFill;
  const isView = d.action_type === 'view';
  const isReturned = !!d.returned_file_path;
  const isTemplatePendingAdmin = isTemplateAdminPending(d);

  return (!isInternInitiatedSignFill || d.status === 'REVISION_REQUESTED') && 
         d.status !== 'AWAITING_RETURN' && 
         !(d.status === 'REVISION_REQUESTED' && d.requested_by === 'ADMIN') && 
         ((!isView && !isReturned) || (d.status === 'REVISION_REQUESTED') || (d.status === 'MISSING' && !d.file_path) || isTemplatePendingAdmin);
};
