import React, { useState, useEffect, useMemo } from 'react';
import { MagnifyingGlass, Funnel, X, Check, CaretLeft, CaretRight, CalendarBlank, Users, Warning, WarningCircle } from '@phosphor-icons/react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

const COLORS = [
  '#2563EB', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444',
  '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#7C3AED',
  '#0D9488', '#CA8A04', '#DC2626', '#4F46E5', '#059669'
];

const WEEKDAYS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

const NF = new Intl.NumberFormat('en-US');
const num = (n: number | string) => (typeof n === 'number' ? NF.format(n) : n);
const LATN = { numberingSystem: 'latn' as const };

function parseDate(value?: string): Date | null {
  if (!value || value.trim() === '') return null;
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + 'T00:00:00');
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
  return null;
}

// DD/MM/YYYY Western
function fmtRange(d?: Date | null): string {
  if (!d) return '—';
  return `${num(String(d.getDate()).padStart(2, '0'))}/${num(String(d.getMonth() + 1).padStart(2, '0'))}/${num(d.getFullYear())}`;
}

function monthLabel(y: number, m: number): string {
  const mm = String(m + 1).padStart(2, '0');
  return `${mm}/${y}`;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;

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

// Custom DD/MM/YYYY date input
function DateInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const commit = (raw: string) => {
    let clean = raw.replace(/[^\d]/g, '').slice(0, 8);
    if (clean.length > 2) clean = clean.slice(0, 2) + '/' + clean.slice(2);
    if (clean.length > 5) clean = clean.slice(0, 5) + '/' + clean.slice(5);
    setText(clean);
    // convert to yyyy-mm-dd for filtering
    const parts = clean.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      const iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
      if (!isNaN(new Date(iso).getTime())) onChange(iso);
      else onChange('');
    } else onChange('');
  };
  return (
    <input
      type="text" inputMode="numeric" placeholder={placeholder} value={text}
      onChange={e => commit(e.target.value)} onBlur={e => commit(e.target.value)}
      style={{ fontSize: 12.5, fontFamily: "'Cairo', sans-serif", padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 9, background: 'var(--paper)', color: 'var(--ink)', outline: 'none', width: '100%' }}
    />
  );
}

export function Timeline() {
  const toast = useToast();
  const [interns, setInterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [anchor, setAnchor] = useState<{ y: number; m: number }>(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [hover, setHover] = useState<{ key: string; x: number; y: number; list: any[] } | null>(null);

  useEffect(() => {
    const fetchInterns = async () => {
      try {
        const data = await api.get('/interns');
        setInterns(data);
      } catch (err) {
        console.error(err);
        toast.error('فشل تحميل المتدربين');
      } finally {
        setLoading(false);
      }
    };
    fetchInterns();
  }, []);

  const filtered = useMemo(() => interns.filter(i => {
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
    () => filtered.filter(i => selectedIds.includes(i.id)).map((i, idx) => ({ ...i, color: COLORS[idx % COLORS.length] })),
    [filtered, selectedIds]
  );

  const coverage = useMemo(() => {
    const map: Record<string, any[]> = {};
    colored.forEach(c => {
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

  // Determine which months to show: span of selected interns, else anchor month (+1)
  const monthsToShow = useMemo(() => {
    let min: Date | null = null, max: Date | null = null;
    colored.forEach(c => {
      const s = parseDate(c.start_date), e = parseDate(c.end_date);
      if (!s || !e) return;
      if (!min || s.getTime() < min.getTime()) min = s;
      if (!max || e.getTime() > max.getTime()) max = e;
    });
    if (!min || !max) {
      return [buildMonth(anchor.y, anchor.m), buildMonth(anchor.m === 11 ? anchor.y + 1 : anchor.y, (anchor.m + 1) % 12)];
    }
    const sMin: Date = min;
    const sMax: Date = max;
    const start = new Date(sMin.getFullYear(), sMin.getMonth(), 1);
    const end = new Date(sMax.getFullYear(), sMax.getMonth(), 1);
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
    // shift the whole visible window by one month (keep span centered on anchor)
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
    colored.forEach(i => {
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

  const acceptedCount = colored.filter(i => i.status === 'نشط').length;

  // Render one standalone Month Card (own header + weekday row + grid)
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
            <div
              key={di}
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
    <div style={{ fontFamily: "'Tajawal', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Cairo', sans-serif", margin: 0, fontSize: 26, fontWeight: 800 }}>مخطط تغطية المتدربين</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--slate)', fontSize: 14 }}>تقويم حجز مرئي لعرض جداول المتدربين وكشف التداخلات</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 14, padding: '10px 16px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 11, color: 'var(--slate)' }}>محدد</div>
            <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 20, fontWeight: 800 }}>{num(colored.length)}</div>
          </div>
          <div style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 14, padding: '10px 16px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 11, color: 'var(--slate)' }}>ذروة التداخل</div>
            <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 20, fontWeight: 800 }}>{num(peak)}</div>
          </div>
          <div style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 14, padding: '10px 16px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 11, color: 'var(--slate)' }}>أزواج متداخلة</div>
            <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 20, fontWeight: 800 }}>{num(pairs.length)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 22, alignItems: 'start' }}>
        {/* SIDEBAR */}
        <div style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 16, padding: 18, position: 'sticky', top: 18, boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Users size={18} weight="bold" color="var(--ink)" />
            <h3 style={{ fontFamily: "'Cairo', sans-serif", margin: 0, fontSize: 16 }}>المتدربون</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 10, padding: '9px 12px', marginBottom: 10 }}>
            <MagnifyingGlass size={16} color="var(--slate)" />
            <input type="text" placeholder="بحث بالاسم أو الرقم..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: 13.5, fontFamily: 'inherit', color: 'var(--ink)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 10, padding: '9px 12px', marginBottom: 12 }}>
            <Funnel size={16} color="var(--slate)" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: 13.5, fontFamily: 'inherit', color: 'var(--ink)', cursor: 'pointer' }}>
              <option value="">جميع الحالات</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 11, color: 'var(--slate)' }}>من تاريخ</span>
              <DateInput value={fromDate ? fmtRange(parseDate(fromDate)) : ''} onChange={setFromDate} placeholder="01/07/2026" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 11, color: 'var(--slate)' }}>إلى تاريخ</span>
              <DateInput value={toDate ? fmtRange(parseDate(toDate)) : ''} onChange={setToDate} placeholder="01/08/2026" />
            </div>
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 4 }}>
            {loading && <div style={{ fontSize: 13, color: 'var(--slate)' }}>جاري التحميل...</div>}
            {!loading && filtered.length === 0 && <div style={{ fontSize: 13, color: 'var(--slate)', textAlign: 'center', padding: '20px 0' }}>لا توجد نتائج</div>}
            {filtered.map(i => {
              const isSel = selectedIds.includes(i.id);
              const color = isSel ? COLORS[selectedIds.indexOf(i.id) % COLORS.length] : null;
              const sb = statusBadge(i.status);
              return (
                <div key={i.id} onClick={() => toggleSelect(i.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 12,
                  cursor: 'pointer', border: `1.5px solid ${isSel ? color : 'var(--line)'}`, background: isSel ? '#FBFCFE' : '#fff', transition: '.15s'
                }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${color || 'var(--line)'}`, background: color || 'transparent' }}>
                    {isSel && <Check size={14} weight="bold" color="#fff" />}
                  </div>
                  <div style={{ width: 9, height: 9, borderRadius: 3, background: color || 'transparent', border: color ? 'none' : '1px solid var(--line)', flexShrink: 0 }} />
                  <img src={i.photo_path || `https://i.pravatar.cc/150?u=${i.id}`} alt="" style={{ width: 30, height: 30, borderRadius: 9, objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.name}</div>
                    <span style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sb.bg, color: sb.fg, marginTop: 2 }}>{sb.s}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedIds.length > 0 && (
            <button onClick={() => setSelectedIds([])}
              style={{ marginTop: 12, width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 10, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--slate)', fontFamily: 'inherit' }}>
              <X size={14} /> إلغاء التحديد ({num(selectedIds.length)})
            </button>
          )}

          {colored.length > 0 && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', marginBottom: 10 }}>وسيلة الإيضاح</div>
              {colored.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 9 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: c.color, display: 'inline-block', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ color: 'var(--slate)', fontSize: 11, fontFamily: "'Cairo', sans-serif" }}>{fmtRange(parseDate(c.start_date))} ← {fmtRange(parseDate(c.end_date))}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CALENDAR + SUMMARY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 16, padding: 18, boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button onClick={() => move(-1)} style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)', background: 'var(--paper)', cursor: 'pointer' }}>
                <CaretRight size={20} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--slate)', fontWeight: 700 }}>
                {num(monthsToShow.length)} شهر معروض
              </div>
              <button onClick={() => move(1)} style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)', background: 'var(--paper)', cursor: 'pointer' }}>
                <CaretLeft size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {monthsToShow.map(mo => renderMonth(mo))}
            </div>

            {colored.length === 0 && (
              <div style={{ textAlign: 'center', padding: '44px 20px', color: 'var(--slate)' }}>
                <CalendarBlank size={42} weight="duotone" style={{ opacity: 0.5, marginBottom: 10 }} />
                <div style={{ fontSize: 14 }}>اختر متدربين من اللوحة الجانبية لعرض تغطيتهم على التقويم</div>
              </div>
            )}
          </div>

          {/* EXECUTIVE SUMMARY */}
          {colored.length > 0 && (
            <div style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Warning size={18} weight="bold" color="var(--ink)" />
                <h3 style={{ fontFamily: "'Cairo', sans-serif", margin: 0, fontSize: 16 }}>ملخص التداخل والتحليلات</h3>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                <span style={{ background: '#EFF4FF', color: '#1D4ED8', borderRadius: 999, padding: '6px 14px', fontSize: 12.5, fontWeight: 700 }}>إجمالي المحدد: {num(colored.length)}</span>
                <span style={{ background: '#ECFDF5', color: '#15803D', borderRadius: 999, padding: '6px 14px', fontSize: 12.5, fontWeight: 700 }}>مقبول: {num(acceptedCount)}</span>
                <span style={{ background: '#FEF3C7', color: '#B45309', borderRadius: 999, padding: '6px 14px', fontSize: 12.5, fontWeight: 700 }}>غير مكتمل: {num(colored.length - acceptedCount)}</span>
                <span style={{ background: pairs.length ? '#FEE2E2' : '#ECFDF5', color: pairs.length ? '#B91C1C' : '#15803D', borderRadius: 999, padding: '6px 14px', fontSize: 12.5, fontWeight: 700 }}>أزواج متداخلة: {num(pairs.length)}</span>
              </div>

              {pairs.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ECFDF5', color: '#15803D', padding: '14px 16px', borderRadius: 12, fontSize: 13.5 }}>
                  <WarningCircle size={20} weight="bold" /> لا يوجد أي تداخل — جداول المتدربين متباعدة وزمن التغطية متفرّق.
                </div>
              )}

              {pairs.map((o, idx) => {
                const accepted = [o.a.status, o.b.status].filter((s: string) => s === 'نشط').length;
                return (
                  <div key={idx} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span style={{ width: 13, height: 13, borderRadius: 4, background: o.a.color, display: 'inline-block' }} />
                      <b style={{ fontSize: 13.5 }}>{o.a.name}</b>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: statusBadge(o.a.status).bg, color: statusBadge(o.a.status).fg }}>({statusBadge(o.a.status).s})</span>
                      <span style={{ color: 'var(--slate)' }}>×</span>
                      <span style={{ width: 13, height: 13, borderRadius: 4, background: o.b.color, display: 'inline-block' }} />
                      <b style={{ fontSize: 13.5 }}>{o.b.name}</b>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: statusBadge(o.b.status).bg, color: statusBadge(o.b.status).fg }}>({statusBadge(o.b.status).s})</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--slate)', lineHeight: 1.9 }}>
                      يتداخلان لمدة <b style={{ color: 'var(--ink)' }}>{num(o.days)} يومًا</b> — من{' '}
                      <b style={{ color: 'var(--ink)', fontFamily: "'Cairo', sans-serif" }}>{fmtRange(o.start)}</b> إلى{' '}
                      <b style={{ color: 'var(--ink)', fontFamily: "'Cairo', sans-serif" }}>{fmtRange(o.end)}</b>.
                      <div style={{ marginTop: 4 }}>
                        {accepted === 2 && <span style={{ color: '#15803D', fontWeight: 700 }}>الاثنان مقبولان <Check size={14} weight="bold" style={{display:'inline'}} /> — غطاء مضمون خلال هذه الفترة.</span>}
                        {accepted === 1 && <span style={{ color: '#B45309', fontWeight: 700 }}>واحد فقط مقبول — يُنصح بقبول الآخر لتأمين التغطية.</span>}
                        {accepted === 0 && <span style={{ color: '#B91C1C', fontWeight: 700 }}>الاثنان غير مكتملين — لا يوجد غطاء مؤكد بعد.</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {hover && (
        <div style={{
          position: 'fixed', left: Math.min(hover.x + 14, window.innerWidth - 230), top: hover.y + 14,
          background: 'var(--ink)', color: '#fff', padding: '11px 14px', borderRadius: 12, fontSize: 12.5,
          zIndex: 300, pointerEvents: 'none', maxWidth: 210, boxShadow: '0 16px 40px -12px rgba(0,0,0,.45)'
        }}>
          <div style={{ fontFamily: "'Cairo', sans-serif", fontWeight: 700, marginBottom: 7 }}>
            {(() => { const d = new Date(hover.key); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })()}
          </div>
          {hover.list.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, display: 'inline-block' }} />
              {c.name} <span style={{ opacity: 0.7, fontSize: 11 }}>· {statusBadge(c.status).s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
