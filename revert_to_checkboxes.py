import re

with open('src/pages/Profile.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. State: Change requestActionType back to requestActionTypes Set
state_old = "const [requestActionType, setRequestActionType] = useState<string>('view');"
state_new = "const [requestActionTypes, setRequestActionTypes] = useState<Set<string>>(new Set(['view']));"
text = text.replace(state_old, state_new)

# Fix the handler in the '+ طلب مستند / إضافة ملف' button 
# from setRequestActionType('view'); to setRequestActionTypes(new Set(['view']));
btn_old = "setRequestActionType('view');"
btn_new = "setRequestActionTypes(new Set(['view']));"
text = text.replace(btn_old, btn_new)

# 2. JSX: Replace radio buttons with checkboxes with logic
jsx_old_pattern = r'<div className="form-group" style=\{\{marginTop:16\}\}>\s*<label>نوع الطلب للملفات المرفوعة</label>\s*<div style=\{\{display:\'flex\', flexDirection:\'column\', gap:8, padding:\'8px 12px\', background:\'var\(--paper\)\', borderRadius:8, border:\'1px solid var\(--line\)\'\}\}>.*?</div>\s*</div>'
jsx_new = '''<div className="form-group" style={{marginTop:16}}>
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
              </div>'''
text = re.sub(jsx_old_pattern, jsx_new, text, flags=re.DOTALL)

# 3. Footer: Update loop to handle requestActionTypes array
footer_old_pattern = r'(try\s*\{\s*let total = 0;\s*const type = requestActionType;.*?setRequestActionType\(\'view\'\);)'
footer_new = r'''try {
                  const types = Array.from(requestActionTypes);
                  let total = 0;

                  if (requestFiles.length > 0) {
                    for (const file of requestFiles) {
                      const title = requestTitle.trim() || file.name.replace(/\.\\w+$/, '') || 'مستند';
                      await api.uploadSignedDocument(Number(id), 'OTHER', file, title, types[0]);
                      for (let i = 1; i < types.length; i++) {
                        await api.post(`/interns/${id}/document-lifecycle`, { document_type: 'OTHER', custom_title: title, action_type: types[i] });
                      }
                    }
                    total += requestFiles.length;
                  }

                  if (selectedVaultDocs.length > 0) {
                     for (const vd of selectedVaultDocs) {
                       const title = requestTitle.trim() || vd || 'مستند';
                       for (const t of types) {
                         await api.post(`/interns/${id}/vault-attach`, {
                           vault_name: vd, doc_type: 'OTHER', custom_title: title, action_type: t
                         });
                       }
                     }
                     total += selectedVaultDocs.length;
                  }

                  if (requestFiles.length === 0 && selectedVaultDocs.length === 0 && requestTitle.trim()) {
                    for (const t of types) {
                      await api.post(`/interns/${id}/document-lifecycle`, { document_type: 'OTHER', custom_title: requestTitle.trim(), action_type: t });
                    }
                    total += 1;
                  }

                  if (total > 0) toast.success(`تم إرسال ${total} مستند${total > 1 ? 'ات' : ''} بنجاح`);
                  setShowRequestModal(false);
                  setRequestFiles([]);
                  setSelectedVaultDocs([]);
                  setRequestActionTypes(new Set(['view']));'''
text = re.sub(footer_old_pattern, footer_new, text, flags=re.DOTALL)

with open('src/pages/Profile.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Checkboxes restored!")
