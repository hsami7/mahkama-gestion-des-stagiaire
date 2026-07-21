import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, X, MagnifyingGlass } from '@phosphor-icons/react';
import { api } from '../services/api';

interface Intern {
  id: number;
  name: string;
  status: string;
  photo_path?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const v = value.trim();
  let m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return null;
}

function fmt(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function overlaps(aS: Date, aE: Date, bS: Date, bE: Date): boolean {
  return aS <= bE && bS <= aE;
}

const PALETTE = [
  '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#0ea5e9', '#84cc16',
];

interface CoverageChartProps {
  internId: number;
}

export default function CoverageChart({ internId }: CoverageChartProps) {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [selected, setSelected] = useState<number[]>([internId]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/interns').then(setInterns).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected.includes(internId)) {
      setSelected(prev => [...prev, internId]);
    }
  }, [internId]);

  const colorMap = useMemo(() => {
    const map: Record<number, string> = {};
    selected.forEach((id, idx) => { map[id] = PALETTE[idx % PALETTE.length]; });
    return map;
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return interns;
    return interns.filter(i => i.name.toLowerCase().includes(q));
  }, [interns, query]);

  const withDates = useMemo(
    () => selected
      .map(id => interns.find(i => i.id === id))
      .filter((i): i is Intern => !!i)
      .map(i => ({ intern: i, start: parseDate(i.start_date), end: parseDate(i.end_date) }))
      .filter(x => x.start && x.end) as { intern: Intern; start: Date; end: Date }[],
    [selected, interns]
  );

  const range = useMemo(() => {
    if (withDates.length === 0) return null;
    let min = withDates[0].start.getTime();
    let max = withDates[0].end.getTime();
    withDates.forEach(x => {
      min = Math.min(min, x.start.getTime());
      max = Math.max(max, x.end.getTime());
    });
    return { min: new Date(min), max: new Date(max), span: Math.max(1, max - min) };
  }, [withDates]);

  const overlapCount = useMemo(() => {
    if (withDates.length === 0) return 0;
    let count = 0;
    for (let a = 0; a < withDates.length; a++) {
      for (let b = a + 1; b < withDates.length; b++) {
        if (overlaps(withDates[a].start, withDates[a].end, withDates[b].start, withDates[b].end)) {
          count++;
        }
      }
    }
    return count;
  }, [withDates]);

  const showIntern = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="card" style={{padding:20, marginTop:16}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
        <h4 style={{margin:0, fontSize:14, display:'flex', alignItems:'center', gap:6}}>
          <Calendar weight="bold" size={18} /> مخطط تغطية المتدربين
        </h4>
        {range && (
          <span style={{fontSize:11, color:'var(--slate)'}}>
            {withDates.length} متدرب{overlapCount > 0 ? ` · ${overlapCount} تقاطع` : ''}
          </span>
        )}
      </div>

      {interns.length > 6 && (
        <div style={{position:'relative', marginBottom:10}}>
          <MagnifyingGlass size={14} style={{position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'var(--slate-light)'}} />
          <input className="input" style={{padding:'7px 32px 7px 10px', fontSize:12, width:'100%'}} placeholder="بحث بالاسم..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      )}

      <div style={{display:'flex', gap:4, flexWrap:'wrap', marginBottom:12}}>
        {filtered.filter(i => i.status !== 'مرفوض' && i.start_date && i.end_date).slice(0, 30).map(i => {
          const isOn = selected.includes(i.id);
          return (
            <button key={i.id} onClick={() => showIntern(i.id)}
              style={{
                fontSize:11, padding:'3px 10px', borderRadius:9999, border: `1.5px solid ${isOn ? (i.id === internId ? '#6366f1' : 'var(--success)') : 'var(--line)'}`,
                background: isOn ? (i.id === internId ? '#EEF0FF' : '#E7F8EE') : 'transparent',
                color: isOn ? (i.id === internId ? '#6366f1' : '#15803D') : 'var(--slate)',
                fontWeight: isOn ? 700 : 400, cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', gap:3,
              }}>
              {isOn && <X size={10} weight="bold" style={{cursor:'pointer'}} onClick={(e) => { e.stopPropagation(); setSelected(prev => prev.filter(x => x !== i.id)); }} />}
              {i.name.length > 14 ? i.name.slice(0, 14) + '…' : i.name}
            </button>
          );
        })}
      </div>

      {!range ? (
        <div style={{textAlign:'center', padding:'32px 16px', color:'var(--slate-light)', fontSize:13}}>
          اختر متدربين من القائمة أعلاه لعرض مخطط التغطية
        </div>
      ) : (
        <>
          <div style={{marginBottom:4, display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--slate)'}}>
            <span>{fmt(range.min)}</span>
            <span>{fmt(range.max)}</span>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:6}}>
            {withDates.map(({ intern, start, end }) => {
              const left = ((start.getTime() - range.min.getTime()) / range.span) * 100;
              const width = Math.max(1.5, ((end.getTime() - start.getTime()) / range.span) * 100);
              const isCurrent = intern.id === internId;
              return (
                <div key={intern.id} style={{display:'flex', alignItems:'center', gap:8}}>
                  <div style={{width:90, fontSize:11.5, fontWeight: isCurrent ? 700 : 600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color: isCurrent ? '#6366f1' : 'var(--ink)'}}>
                    {intern.name}
                    <div style={{fontSize:10, fontWeight:400, color:'var(--slate-light)'}}>{fmt(start)} → {fmt(end)}</div>
                  </div>
                  <div style={{flex:1, position:'relative', height:22, background:'var(--paper)', borderRadius:4, overflow:'hidden'}}>
                    <div style={{
                      position:'absolute', top:0, bottom:0, right:`${left}%`, width:`${width}%`,
                      background: colorMap[intern.id],
                      borderRadius:4, opacity: isCurrent ? 1 : 0.75,
                      border: isCurrent ? '2px solid #4f46e5' : 'none',
                      boxShadow: isCurrent ? '0 0 0 1px rgba(99,102,241,0.4)' : 'none',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
