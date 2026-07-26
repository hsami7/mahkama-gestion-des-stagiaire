import re

with open('src/pages/InternPortal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('            {/* Card 1: الوثائق المطلوبة */}')
end_idx = text.find('          </>)}', start_idx)

new_html = """            {/* Unified Documents List */}
            <div className="card" style={{padding:24, marginTop:18}}>
              <div className="section-title" style={{marginBottom:16}}>
                <h3 style={{fontSize:15, margin:0}}>المستندات</h3>
              </div>
              
              {(() => {
                const reqDocs = lifecycleDocs.filter(d => d.status === 'REVISION_REQUESTED' && d.rejection_reason);
                if (reqDocs.length === 0) return null;
                return (
                  <div style={{background:'#FFF6E5', border:'1.5px solid #F2D49B', borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:12.5, color:'#9A6B00', fontWeight:600}}>
                    {reqDocs.map(d => (
                      <div key={d.id} style={{marginTop:d.rejection_reason ? 6 : 0}}>
                        <Warning size={14} weight="fill" style={{marginLeft:4}} /> ملاحظة الإدارة: {d.label || DOC_TYPE_LABELS[d.doc_type as keyof typeof DOC_TYPE_LABELS] || d.custom_title} — {d.rejection_reason}
                      </div>
                    ))}
                  </div>
                );
              })()}

              <table style={{width:'100%', borderCollapse:'collapse', fontSize:12.5}}>
                <thead>
                  <tr style={{borderBottom:'1px solid var(--line)'}}>
                    <th style={{textAlign:'right', padding:'8px 4px', color:'var(--slate-light)', fontWeight:600}}>المستند</th>
                    <th style={{textAlign:'center', padding:'8px 4px', color:'var(--slate-light)', fontWeight:600}}>النوع</th>
                    <th style={{textAlign:'center', padding:'8px 4px', color:'var(--slate-light)', fontWeight:600}}>الحالة</th>
                    <th style={{textAlign:'left', padding:'8px 4px', color:'var(--slate-light)', fontWeight:600}}>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Object.keys(DOC_TYPE_LABELS)].map(docType => {
                    const docsOfType = lifecycleDocs.filter(d => d.doc_type === docType);
                    const docs = docsOfType.length > 0 ? docsOfType : [{ doc_type: docType }];
                    
                    return docs.map((doc, idx) => {
                      const req = requests.find(r => r.document_type === docType);
                      let status = doc?.status === 'APPROVED_AND_SIGNED' ? 'approved' : doc?.status === 'REVISION_REQUESTED' ? 'rejected' : doc?.file_path ? 'pending' : 'missing';
                      if (docType === 'FINAL_REPORT' && !doc?.file_path) status = 'missing';
                      
                      const statusColor = status === 'approved' ? 'var(--success)' : status === 'rejected' ? 'var(--danger)' : status === 'pending' ? 'var(--gold)' : 'var(--slate-light)';
                      const docTitle = doc?.custom_title || DOC_TYPE_LABELS[docType as keyof typeof DOC_TYPE_LABELS];
                      const category = docType === 'FINAL_REPORT' ? 'نهاية التدريب' : docType === 'OTHER' ? 'مستند إضافي' : 'مستند أساسي';
                      if (docType === 'OTHER' && docsOfType.length === 0) return null;
                      
                      return (
                        <tr key={`${docType}-${idx}`} style={{borderBottom:'1px solid var(--line)'}}>
                          <td style={{padding:'10px 4px', fontWeight:600}}>
                            {docTitle}
                            {doc?.rejection_reason && status === 'rejected' && (
                              <div style={{fontSize:11, color:'var(--danger)', marginTop:2, background:'#FFF0EE', padding:'3px 6px', borderRadius:4}}>
                                <span style={{fontWeight:600}}><Warning size={12} weight="fill" style={{marginLeft:4}} /> ملاحظة الإدارة:</span> {doc.rejection_reason}
                              </div>
                            )}
                          </td>
                          <td style={{textAlign:'center', padding:'10px 4px', color:'var(--slate)', fontSize:11}}>{category}</td>
                          <td style={{textAlign:'center', padding:'10px 4px', color: statusColor, fontWeight:600, fontSize:12}}>
                            {status === 'approved' ? <>مقبول <CheckCircle size={12} weight="fill" style={{display:'inline'}} /></> : status === 'rejected' ? 'مطلوب إعادة الرفع' : status === 'pending' ? 'قيد المراجعة' : 'غير مرفوع'}
                          </td>
                          <td style={{textAlign:'left', padding:'10px 4px'}}>
                            <div style={{display:'flex', gap:4, justifyContent:'flex-end'}}>
                              {doc?.file_path && (
                                <a href={api.downloadDocument(doc.id)} target="_blank" rel="noreferrer" className="btn btn-ghost sm" title="معاينة" style={{padding:'4px 10px', fontSize:11, display:'flex', alignItems:'center', gap:4}}>
                                  <Eye size={14} /> معاينة
                                </a>
                              )}
                              {(status === 'missing' || status === 'rejected') && (
                                <>
                                  <input type="file" id={`doc-upload-${docType}-${idx}`} style={{display:'none'}} accept=".pdf" onChange={e => { if (e.target.files?.[0]) handleProactiveUpload(docType, e.target.files[0]); }} />
                                  <button className="btn btn-ink sm" style={{padding:'4px 10px', fontSize:11}} onClick={() => document.getElementById(`doc-upload-${docType}-${idx}`)?.click()} disabled={uploading === docType}>
                                    <UploadSimple size={14} /> {uploading === docType ? 'جاري...' : 'رفع'}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>"""

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + new_html + '\n' + text[end_idx:]
    with open('src/pages/InternPortal.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Successfully replaced multiple tables with a single table in InternPortal.tsx!")
else:
    print("Could not find start_idx or end_idx.")
