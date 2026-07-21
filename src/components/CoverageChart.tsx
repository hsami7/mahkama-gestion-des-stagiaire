import React, { useState, useEffect, useMemo } from 'react';
import { Users, MagnifyingGlass, Funnel, X, CaretLeft, CaretRight, CalendarBlank, Check, Warning } from '@phosphor-icons/react';
import { api } from '../services/api';

const COLORS = [
  '#2563EB', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444',
  '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#7C3AED',
  '#0D9488', '#CA8A04', '#DC2626', '#4F46E5', '#059669'
];

const WEEKDAYS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

const NF = new Intl.NumberFormat('en-US');
const num = (n: number | string) => (typeof n === 'number' ? NF.format(n) : n);

function parseDate(value?: string): Date | null {
  if (!value || value.trim() === '') return null;
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + 'T00:00:00');
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
  return null;
}

function fmtRange(d?: Date | null): string {
  if (!d) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function monthLabel(y: number, m: number): string {
  const mm = String(m + 1).padStart(2, '0');
  return `${mm}/${y}`;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;

function buildMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startPad = mondayIndex(first);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return { y: year, m: month, first, cells, label: monthLabel(year, month) };
}

const STATUS_OPTIONS = ['نشط', 'قيد المراجعة', 'مستندات ناقصة', 'مرفوض', 'منتهي'];

function statusBadge(status?: string) {
  const s = status || 'قيد المراجعة';
  const map: Record<string, { bg: string; fg: string }> = {
    'نشط': { bg: '#E7F8EE', fg: '#15803D' },
    'قيد المراجعة': { bg: '#FEF3C7', fg: '#B45309' },
    'مستندات ناقصة': { bg: '#FEF3C7', fg: '#B45309' },
    'مرفوض': { bg: '#FCE8E6', fg: '#B91C1C' },
    'منتهي': { bg: '#EEF1F5', fg: '#64748B' },
  };
  const c = map[s] || map['قيد المراجعة'];
  return { s, ...c };
}

function DateInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const commit = (raw: string) => {
    let clean = raw.replace(/[^\d]/g, '').slice(0, 8);
    if (clean.length > 2) clean = clean.slice(0, 2) + '/' + clean.slice(2);
    if (clean.length > 5) clean = clean.slice(0, 5) + '/' + clean.slice(5);
    setText(clean);
    const parts = clean.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      const iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
      if (!isNaN(new Date(iso).getTime())) onChange(iso);
      else onChange('');
    } else onChange('');
  };
  return (
    <input type="text" inputMode="numeric" placeholder={placeholder} value={text}
      onChange={e => commit(e.target.value)} onBlur={e => commit(e.target.value)}
      style={{ fontSize: 12.5, fontFamily: "'Cairo', sans-serif", padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 9, background: 'var(--paper)', color: 'var(--ink)', outline: 'none', width: '100%' }}
    />
  );
}

interface CoverageChartProps {
  internId: number;
}

export default function CoverageChart({ internId }: CoverageChartProps) {
  const [interns, setInterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedIds, setSelectedIds] = useState<number[]>([internId]);
  const [anchor, setAnchor] = useState<{ y: number; m: number }>(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [hover, setHover] = useState<{ key: string; x: number; y: number; list: any[] } | null>(null);

  useEffect(() => {
    api.get('/interns').then(data => { setInterns(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedIds.includes(internId)) {
      setSelectedIds(prev => [...prev, internId]);
    }
  }, [internId]);

  const filtered = useMemo(() => interns.filter((i: any) => {
    const matchName = !search || (i.name && i.name.toLowerCase().includes(search.toLowerCase())) ||
      (i.national_id && i.national_id.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = !statusFilter || i.status === statusFilter;
    const s = parseDate(i.start_date), e = parseDate(i.end_date);
    const f = parseDate(fromDate), t = parseDate(toDate);
    let matchDate = true;
    if (f || t) {
      if (!s || !e) matchDate = false;
      else { if (f && e < f) matchDate = false; if (t && s > t) matchDate = false; }
    }
    return matchName && matchStatus && matchDate;
  }), [interns, search, statusFilter, fromDate, toDate]);

  const colored = useMemo(
    () => filtered.filter((i: any) => selectedIds.includes(i.id)).map((i: any, idx: number) => ({ ...i, color: COLORS[idx % COLORS.length] })),
    [filtered, selectedIds]
  );

  const coverage = useMemo(() => {
    const map: Record<string, any[]> = {};
    colored.forEach((c: any) => {
      const s = parseDate(c.start_date), e = parseDate(c.end_date);
      if (!s || !e) return;
      const cur = new Date(s.getTime());
      while (cur <= e) {
        const k = dayKey(cur);
        if (!map[k]) map[k] = [];
        map[k].push(c);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [colored]);

  const monthsToShow = useMemo(() => {
    let min: Date | null = null, max: Date | null = null;
    colored.forEach((c: any) => {
      const s = parseDate(c.start_date), e = parseDate(c.end_date);
      if (!s || !e) return;
      if (!min || s.getTime() < min.getTime()) min = s;
      if (!max || e.getTime() > max.getTime()) max = e;
    });
    if (!min || !max) {
      return [buildMonth(anchor.y, anchor.m), buildMonth(anchor.m === 11 ? anchor.y + 1 : anchor.y, (anchor.m + 1) % 12)];
    }
    const start = new Date(min.getFullYear(), min.getMonth(), 1);
    const end = new Date(max.getFullYear(), max.getMonth(), 1);
    const out: ReturnType<typeof buildMonth>[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      out.push(buildMonth(cur.getFullYear(), cur.getMonth()));
      cur.setMonth(cur.getMonth() + 1);
    }
    return out;
  }, [colored, anchor]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const move = (dir: number) => {
    let m = anchor.m + dir, y = anchor.y;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setAnchor({ y, m });
    setHover(null);
  };

  const pairs = useMemo(() => {
    const res: any[] = [];
    for (let a = 0; a < colored.length; a++)
      for (let b = a + 1; b < colored.length; b++) {
        const A = colored[a], B = colored[b];
        const as = parseDate(A.start_date), ae = parseDate(A.end_date);
        const bs = parseDate(B.start_date), be = parseDate(B.end_date);
        if (!as || !ae || !bs || !be) continue;
        const start = as > bs ? as : bs, end = ae < be ? ae : be;
        if (start <= end) res.push({ a: A, b: B, start, end, days: Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1 });
      }
    return res;
  }, [colored]);

  const peak = useMemo(() => {
    if (!colored.length) return 0;
    const ev: { t: number; d: number }[] = [];
    colored.forEach((i: any) => {
      const s = parseDate(i.start_date), e = parseDate(i.end_date);
      if (!s || !e) return;
      ev.push({ t: s.getTime(), d: 1 });
      ev.push({ t: e.getTime() + 86400000, d: -1 });
    });
    ev.sort((x, y) => x.t - y.t);
    let cur = 0, max = 0;
    ev.forEach(x => { cur += x.d; if (cur > max) max = cur; });
    return max;
  }, [colored]);

  const acceptedCount = colored.filter((i: any) => i.status === 'نشط').length;

  const renderMonth = (mo: ReturnType<typeof buildMonth>) => (
    <div key={`${mo.y}-${mo.m}`} style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow)' }}>
      <h3 style={{ fontFamily: "'Cairo', sans-serif", margin: '0 0 12px', fontSize: 17, fontWeight: 700, textAlign: 'center' }}>{mo.label}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--slate)', fontWeight: 700, padding: '4px 0' }}>{w}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {mo.cells.map((d, di) => {
          if (!d) return <div key={di} style={{ aspectRatio: '1 / 1' }} />;
          const k = dayKey(d);
          const active = coverage[k] || [];
          const isOverlap = active.length > 1;
          const today = dayKey(new Date()) === k;

          const bandRows = active.map((c: any, idx: number) => {
            const isStart = dayKey(parseDate(c.start_date)!) === k;
            const isEnd = dayKey(parseDate(c.end_date)!) === k;
            const radius = isStart && !isOverlap ? '0 7px 7px 0' : isEnd && !isOverlap ? '7px 0 0 7px' : '7px';
            return (
              <span key={c.id} style={{
                position: 'absolute', left: 4, right: 4, height: 7, borderRadius: radius,
                background: c.color, opacity: isOverlap ? 0.92 : 0.85, bottom: 5 + idx * 9, zIndex: 1
              }} />
            );
          });

          return (
            <div key={di}
              onMouseEnter={e => active.length ? setHover({ key: k, x: e.clientX, y: e.clientY, list: active }) : setHover(null)}
              onMouseLeave={() => setHover(null)}
              style={{
                position: 'relative', aspectRatio: '1 / 1', borderRadius: 8,
                border: today ? '2px solid var(--gold)' : '1px solid var(--line-soft)',
                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12.5, fontWeight: 700, fontFamily: "'Cairo', sans-serif", color: 'var(--ink)',
                cursor: active.length ? 'pointer' : 'default'
              }}
            >
              <span style={{ zIndex: 2 }}>{num(d.getDate())}</span>
              {bandRows}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Tajawal', sans-serif", marginTop: 16 }}>
      <div className="card" style={{padding:20}}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>مخطط تغطية المتدربين</h3>
            <p style={{ margin: 0, color: 'var(--slate)', fontSize: 13 }}>تقويم حجز مرئي لعرض جداول المتدربين وكشف التداخلات</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--slate)' }}>محدد</div>
              <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 18, fontWeight: 800 }}>{num(colored.length)}</div>
            </div>
            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--slate)' }}>ذروة التداخل</div>
              <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 18, fontWeight: 800 }}>{num(peak)}</div>
            </div>
            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--slate)' }}>أزواج متداخلة</div>
              <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 18, fontWeight: 800 }}>{num(pairs.length)}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18, alignItems: 'start' }}>
          {/* SIDEBAR */}
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Users size={18} weight="bold" color="var(--ink)" />
              <h4 style={{ margin: 0, fontSize: 14 }}>المتدربون</h4>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 9, padding: '7px 10px', marginBottom: 8 }}>
              <MagnifyingGlass size={15} color="var(--slate)" />
              <input type="text" placeholder="بحث بالاسم أو الرقم..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: 12.5, fontFamily: 'inherit', color: 'var(--ink)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 9, padding: '7px 10px', marginBottom: 10 }}>
              <Funnel size={15} color="var(--slate)" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: 12.5, fontFamily: 'inherit', color: 'var(--ink)', cursor: 'pointer' }}>
                <option value="">جميع الحالات</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--slate)' }}>من تاريخ</span>
                <DateInput value={fromDate ? fmtRange(parseDate(fromDate)) : ''} onChange={setFromDate} placeholder="dd/mm/yyyy" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--slate)' }}>إلى تاريخ</span>
                <DateInput value={toDate ? fmtRange(parseDate(toDate)) : ''} onChange={setToDate} placeholder="dd/mm/yyyy" />
              </div>
            </div>

            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 4 }}>
              {loading && <div style={{ fontSize: 12, color: 'var(--slate)' }}>جاري التحميل...</div>}
              {!loading && filtered.length === 0 && <div style={{ fontSize: 12, color: 'var(--slate)', textAlign: 'center', padding: '16px 0' }}>لا توجد نتائج</div>}
              {filtered.map((i: any) => {
                const isSel = selectedIds.includes(i.id);
                const color = isSel ? COLORS[selectedIds.indexOf(i.id) % COLORS.length] : null;
                const sb = statusBadge(i.status);
                return (
                  <div key={i.id} onClick={() => toggleSelect(i.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 10,
                    cursor: 'pointer', border: `1.5px solid ${isSel ? color : 'var(--line)'}`, background: isSel ? '#FBFCFE' : '#fff', transition: '.15s'
                  }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${color || 'var(--line)'}`, background: color || 'transparent' }}>
                      {isSel && <Check size={12} weight="bold" color="#fff" />}
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: 3, background: color || 'transparent', border: color ? 'none' : '1px solid var(--line)', flexShrink: 0 }} />
                    <img src={i.photo_path || `https://i.pravatar.cc/150?u=${i.id}`} alt="" style={{ width: 26, height: 26, borderRadius: 7, objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.name}</div>
                      <span style={{ display: 'inline-block', fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: sb.bg, color: sb.fg, marginTop: 1 }}>{sb.s}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedIds.length > 0 && (
              <button onClick={() => setSelectedIds([])}
                style={{ marginTop: 10, width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--slate)', fontFamily: 'inherit' }}>
                <X size={13} /> إلغاء التحديد ({num(selectedIds.length)})
              </button>
            )}

            {colored.length > 0 && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', marginBottom: 8 }}>وسيلة الإيضاح</div>
                {colored.map((c: any) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, display: 'inline-block', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ color: 'var(--slate)', fontSize: 10 }}>{fmtRange(parseDate(c.start_date))} ← {fmtRange(parseDate(c.end_date))}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CALENDAR */}
          <div style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button onClick={() => move(-1)} style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)', background: 'var(--paper)', cursor: 'pointer' }}>
                <CaretRight size={18} />
              </button>
              <span style={{ fontSize: 12, color: 'var(--slate)', fontWeight: 700 }}>{num(monthsToShow.length)} شهر معروض</span>
              <button onClick={() => move(1)} style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)', background: 'var(--paper)', cursor: 'pointer' }}>
                <CaretLeft size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {monthsToShow.map(mo => renderMonth(mo))}
            </div>

            {colored.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--slate)' }}>
                <CalendarBlank size={38} weight="duotone" style={{ opacity: 0.5, marginBottom: 8 }} />
                <div style={{ fontSize: 13 }}>اختر متدربين من اللوحة الجانبية لعرض تغطيتهم على التقويم</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
