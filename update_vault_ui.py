import re

with open('src/pages/Profile.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = r'(<div className="modal-head" style=\{\{borderBottom:\'1px solid #E5E7EB\', padding:\'16px 24px\'.*?</div>).*?(<div className="modal-foot" style=\{\{background:\'#F9FAFB\')'
replacement = r'''\1
            <div className="modal-body" style={{padding:'24px', maxHeight:'65vh', overflowY:'auto', background:'#F9FAFB'}}>
              {vaultDocs.length === 0 ? (
                <div style={{textAlign:'center',padding:'24px 20px',color:'var(--slate-light)',fontSize:13}}>لا توجد مستندات في الخزنة</div>
              ) : (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16}}>
                  {vaultDocs.map((vd: any) => {
                    const isSelected = selectedVaultDocs.includes(vd.name);
                    const isPdf = vd.name.toLowerCase().endsWith('.pdf');
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
                          {vd.name.replace(/\.[^/.]+$/, "")}
                        </h4>
                        <div style={{fontSize:12, color:'#6B7280', marginBottom:20}}>
                          {vd.size ? `${(vd.size/1024).toFixed(1)} KB` : 'مستند من الخزنة'}
                        </div>

                        {/* Actions */}
                        <div style={{display:'flex', gap:8, width:'100%', marginTop:'auto'}} onClick={e => e.stopPropagation()}>
                          <button className="btn" style={{flex:1, padding:'8px 0', background:'#1F2937', color:'#fff', border:'none', borderRadius:8, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6}} onClick={() => window.open(`${API_BASE}/vault/${encodeURIComponent(vd.name)}`)}>
                            <DownloadSimple size={16} /> تحميل
                          </button>
                          <button className="btn" style={{flex:1, padding:'8px 0', background:'#fff', color:'#111827', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6}} onClick={() => window.open(`${API_BASE}/vault/${encodeURIComponent(vd.name)}`, '_blank')}>
                            <Eye size={16} /> عرض
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            \2'''
text = re.sub(pattern, replacement, text, flags=re.DOTALL)

with open('src/pages/Profile.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Vault selection UI updated to match screenshots.")
