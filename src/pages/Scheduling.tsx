import React, { useState, useEffect, useMemo } from 'react';
import { MagnifyingGlass, Calendar, Users, X } from '@phosphor-icons/react';
import { api } from '../services/api';

type Intern = {
  id: number;
  name: string;
  status: string;
  photo_path?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  department?: string | null;
};

const PALETTE = [
  '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#0ea5e9', '#84cc16',
  '#e11d48', '#7c3aed',
];

const STATUS_META: Record<string, { label: string; color: string; group: 'accepted' | 'waiting' | 'other' }> = {
  'نشط': { label: 'نشط', color: 'var(--success)', group: 'accepted' },
  'قيد المراجعة': { label: 'قيد المراجعة', color: 'var(--warning)', group: 'waiting' },
  'مستندات ناقصة': { label: 'مستندات ناقصة', color: 'var(--danger)', group: 'waiting' },
  'منتهي': { label: 'منتهي', color: 'var(--slate)', group: 'other' },
  'مرفوض': { label: 'مرفوض', color: 'var(--danger)', group: 'other' },
};

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const v = value.trim();
  let m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function fmt(d: Date): string {
  return d.toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function overlaps(aS: Date, aE: Date, bS: Date, bE: Date): boolean {
  return aS <= bE && bS <= aE;
}

export function Scheduling() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [compared, setCompared] = useState<number[]>([]);
  const [zoomPhoto, setZoomPhoto] = useState<{ src: string; name: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/interns');
        setInterns(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const from = fromFilter ? new Date(fromFilter) : null;
    const to = toFilter ? new Date(toFilter) : null;
    return interns.filter(i => {
      if (query && !i.name?.toLowerCase().includes(query.toLowerCase())) return false;
      if (statusFilter && i.status !== statusFilter) return false;
      const s = parseDate(i.start_date);
      const e = parseDate(i.end_date);
      if (from && e && e < from) return false;
      if (to && s && s > to) return false;
      return true;
    });
  }, [interns, query, statusFilter, fromFilter, toFilter]);

  const colorMap = useMemo(() => {
    const map: Record<number, string> = {};
    compared.forEach((id, idx) => { map[id] = PALETTE[idx % PALETTE.length]; });
    return map;
  }, [compared]);

  const comparedInterns = useMemo(
    () => compared.map(id => interns.find(i => i.id === id)).filter(Boolean) as Intern[],
    [compared, interns]
  );

  const withDates = useMemo(
    () => comparedInterns
      .map(i => ({ intern: i, start: parseDate(i.start_date), end: parseDate(i.end_date) }))
      .filter(x => x.start && x.end) as { intern: Intern; start: Date; end: Date }[],
    [comparedInterns]
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

  const overlapGroups = useMemo(() => {
    const result: { members: Intern[]; start: Date; end: Date }[] = [];
    for (let a = 0; a < withDates.length; a++) {
      for (let b = a + 1; b < withDates.length; b++) {
        const x = withDates[a], y = withDates[b];
        if (overlaps(x.start, x.end, y.start, y.end)) {
          result.push({
            members: [x.intern, y.intern],
            start: new Date(Math.max(x.start.getTime(), y.start.getTime())),
            end: new Date(Math.min(x.end.getTime(), y.end.getTime())),
          });
        }
      }
    }
    return result;
  }, [withDates]);

  const summary = useMemo(() => {
    const crossedIds = new Set<number>();
    overlapGroups.forEach(g => g.members.forEach(m => crossedIds.add(m.id)));
    const crossed = withDates.filter(x => crossedIds.has(x.intern.id));
    const accepted = crossed.filter(x => STATUS_META[x.intern.status]?.group === 'accepted').length;
    const waiting = crossed.filter(x => STATUS_META[x.intern.status]?.group === 'waiting').length;
    const other = crossed.length - accepted - waiting;
    return { crossedCount: crossed.length, accepted, waiting, other, nonCrossed: withDates.length - crossed.length };
  }, [overlapGroups, withDates]);

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const photoSrc = (i: Intern) => i.photo_path || `https://i.pravatar.cc/150?u=${i.id}`;

  const clearFilters = () => {
    setQuery(''); setStatusFilter(''); setFromFilter(''); setToFilter('');
  };

  return (
    <div>
      <div className="section-head" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>
            <Calendar weight="bold" style={{ verticalAlign: 'middle', marginLeft: '8px' }} />
            جدولة وتقاطع المتدربين
          </h1>
          <p style={{ color: 'var(--slate)' }}>اختر المتدربين لمقارنة فترات تدريبهم واكتشاف التقاطعات الزمنية.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', color: 'var(--slate)', display: 'block', marginBottom: '4px' }}>بحث بالاسم</label>
          <div style={{ position: 'relative' }}>
            <MagnifyingGlass size={16} style={{ position: 'absolute', right: '10px', top: '11px', color: 'var(--slate)' }} />
            <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="اسم المتدرب..." style={{ paddingRight: '32px' }} />
          </div>
        </div>
        <div style={{ flex: '0 1 180px' }}>
          <label style={{ fontSize: '12px', color: 'var(--slate)', display: 'block', marginBottom: '4px' }}>الحالة</label>
          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">كل الحالات</option>
            {Object.keys(STATUS_META).map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
        </div>
        <div style={{ flex: '0 1 150px' }}>
          <label style={{ fontSize: '12px', color: 'var(--slate)', display: 'block', marginBottom: '4px' }}>من تاريخ</label>
          <input type="date" className="input" value={fromFilter} onChange={e => setFromFilter(e.target.value)} />
        </div>
        <div style={{ flex: '0 1 150px' }}>
          <label style={{ fontSize: '12px', color: 'var(--slate)', display: 'block', marginBottom: '4px' }}>إلى تاريخ</label>
          <input type="date" className="input" value={toFilter} onChange={e => setToFilter(e.target.value)} />
        </div>
        <button className="btn btn-ghost" onClick={clearFilters}>مسح الفلاتر</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '20px', alignItems: 'start' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}><Users weight="bold" style={{ verticalAlign: 'middle', marginLeft: '6px' }} />المتدربون ({filtered.length})</h3>
            {selected.length > 0 && (
              <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setSelected([])}>إلغاء التحديد</button>
            )}
          </div>

          <div style={{ maxHeight: '520px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--slate)', padding: '20px' }}>جاري التحميل...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--slate)', padding: '20px' }}>لا توجد نتائج</div>
            ) : filtered.map(i => {
              const isSel = selected.includes(i.id);
              const meta = STATUS_META[i.status];
              return (
                <div
                  key={i.id}
                  onClick={() => toggleSelect(i.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '10px',
                    cursor: 'pointer', border: `1.5px solid ${isSel ? 'var(--gold)' : 'var(--line)'}`,
                    background: isSel ? 'var(--paper)' : 'transparent',
                  }}
                >
                  <input type="checkbox" checked={isSel} readOnly style={{ pointerEvents: 'none' }} />
                  <img
                    src={photoSrc(i)}
                    alt={i.name}
                    onClick={e => { e.stopPropagation(); setZoomPhoto({ src: photoSrc(i), name: i.name }); }}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', cursor: 'zoom-in', border: colorMap[i.id] ? `2px solid ${colorMap[i.id]}` : '1px solid var(--line)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.name}</div>
                    <div style={{ fontSize: '11px', color: meta?.color || 'var(--slate)' }}>{meta?.label || i.status}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px', fontWeight: 'bold' }}
            disabled={selected.length < 1}
            onClick={() => setCompared([...selected])}
          >
            مقارنة ({selected.length})
          </button>
        </div>

        <div className="card" style={{ padding: '20px', minHeight: '400px' }}>
          {compared.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--slate)', padding: '80px 20px' }}>
              <Calendar size={56} weight="duotone" style={{ opacity: 0.4, marginBottom: '16px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--ink)' }}>حدد المتدربين ثم اضغط "مقارنة"</div>
              <p style={{ marginTop: '8px' }}>سيظهر هنا مخطط زمني يوضح تقاطع فترات التدريب.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <StatCard label="متقاطعون" value={summary.crossedCount} color="var(--danger)" />
                <StatCard label="مقبولون (نشط)" value={summary.accepted} color="var(--success)" />
                <StatCard label="قيد الانتظار" value={summary.waiting} color="var(--warning)" />
                <StatCard label="غير متقاطعين" value={summary.nonCrossed} color="var(--slate)" />
              </div>

              {range && (
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--slate)' }}>
                  <span>{fmt(range.min)}</span>
                  <span>{fmt(range.max)}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {withDates.length === 0 && (
                  <div style={{ color: 'var(--slate)', textAlign: 'center', padding: '20px' }}>
                    المتدربون المحددون لا يملكون تواريخ بداية/نهاية صالحة.
                  </div>
                )}
                {range && withDates.map(({ intern, start, end }) => {
                  const left = ((start.getTime() - range.min.getTime()) / range.span) * 100;
                  const width = Math.max(1.5, ((end.getTime() - start.getTime()) / range.span) * 100);
                  const meta = STATUS_META[intern.status];
                  return (
                    <div key={intern.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={photoSrc(intern)}
                        alt={intern.name}
                        onClick={() => setZoomPhoto({ src: photoSrc(intern), name: intern.name })}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', cursor: 'zoom-in', border: `2px solid ${colorMap[intern.id]}` }}
                      />
                      <div style={{ width: '110px', fontSize: '12.5px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={intern.name}>
                        {intern.name}
                        <div style={{ fontSize: '10.5px', fontWeight: 'normal', color: meta?.color }}>{meta?.label}</div>
                      </div>
                      <div style={{ flex: 1, position: 'relative', height: '26px', background: 'var(--paper)', borderRadius: '6px' }}>
                        <div
                          title={`${fmt(start)} → ${fmt(end)}`}
                          style={{
                            position: 'absolute', top: 0, bottom: 0, right: `${left}%`, width: `${width}%`,
                            background: colorMap[intern.id], borderRadius: '6px', opacity: 0.85,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '10px', fontWeight: 'bold', overflow: 'hidden', whiteSpace: 'nowrap',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {overlapGroups.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>التقاطعات المكتشفة ({overlapGroups.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {overlapGroups.map((g, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--danger-bg)', borderRadius: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex' }}>
                          {g.members.map(m => (
                            <img key={m.id} src={photoSrc(m)} alt={m.name} title={m.name}
                              onClick={() => setZoomPhoto({ src: photoSrc(m), name: m.name })}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${colorMap[m.id]}`, marginRight: '-8px', cursor: 'zoom-in' }} />
                          ))}
                        </div>
                        <span style={{ fontSize: '12.5px', fontWeight: 'bold' }}>
                          {g.members.map(m => m.name).join(' × ')}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--danger)', marginRight: 'auto' }}>
                          {fmt(g.start)} → {fmt(g.end)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {zoomPhoto && (
        <div className="overlay on" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setZoomPhoto(null)}>
          <div style={{ position: 'relative', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setZoomPhoto(null)} style={{ position: 'absolute', top: '-14px', left: '-14px', background: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <X weight="bold" />
            </button>
            <img src={zoomPhoto.src} alt={zoomPhoto.name} style={{ maxWidth: '80vw', maxHeight: '75vh', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
            <div style={{ color: '#fff', marginTop: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>{zoomPhoto.name}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: '1 1 120px', background: 'var(--paper)', borderRadius: '10px', padding: '12px 16px', borderRight: `4px solid ${color}` }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--slate)' }}>{label}</div>
    </div>
  );
}
