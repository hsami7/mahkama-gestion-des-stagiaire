import React, { useState, useEffect } from 'react';
import { CalendarCheck, MagnifyingGlass } from '@phosphor-icons/react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

export function Attendance() {
  const toast = useToast();
  const [interns, setInterns] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [displayDate, setDisplayDate] = useState(() => {
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  });

  const handleDateChange = (value: string) => {
    let val = value.replace(/[^\d/]/g, '');
    if (val.length > 2 && val.indexOf('/') === -1) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    if (val.length > 5 && val.indexOf('/', 3) === -1) {
      val = val.substring(0, 5) + '/' + val.substring(5);
    }
    setDisplayDate(val);

    if (val.length === 10) {
      const parts = val.split('/');
      if (parts.length === 3) {
        const ymd = `${parts[2]}-${parts[1]}-${parts[0]}`;
        if (!isNaN(new Date(ymd).getTime())) {
          setSelectedDate(ymd);
        }
      }
    }
  };

  const fetchData = async () => {
    try {
      const internsData = await api.get('/interns');
      // Show only active interns whose start and end dates encapsulate the selected date
      const activeInterns = internsData.filter((i: any) => {
        if (i.status !== 'نشط') return false;
        
        if (i.start_date && selectedDate < i.start_date) return false;
        if (i.end_date && selectedDate > i.end_date) return false;
        
        return true;
      });
      setInterns(activeInterns);

      const attData = await api.get(`/attendance/by-date?date=${selectedDate}`);
      setAttendance(attData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const markAttendance = async (internId: number, status: string) => {
    try {
      await api.post(`/interns/${internId}/attendance`, { date: selectedDate, status });
      setAttendance(prev => ({ ...prev, [internId]: status }));
    } catch (err) {
      toast.error("فشل في تسجيل الحضور");
    }
  };

  const filteredInterns = interns.filter(intern => 
    intern.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className="tb-search" style={{ width: '300px', display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '8px 16px', borderRadius: '8px' }}>
            <MagnifyingGlass weight="bold" className="icon" style={{ color: 'var(--slate)' }} />
            <input 
              type="text" 
              placeholder="بحث سريع…" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: '13px', color: 'var(--ink)' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontWeight: 'bold', color: 'var(--slate)' }}>تاريخ الحضور:</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="يوم/شهر/سنة"
                maxLength={10}
                value={displayDate}
                onChange={e => handleDateChange(e.target.value)}
                style={{ background: 'var(--paper)', transition: 'border-color 0.2s, box-shadow 0.2s', padding: '10px 14px 10px 36px', border: '1px solid var(--line)', outline: 'none', borderRadius: '8px', width: '130px', textAlign: 'center' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--line)'}
              />
              <div style={{ position: 'absolute', left: '10px', width: '20px', height: '20px' }}>
                <CalendarCheck size={18} color="var(--slate)" style={{ pointerEvents: 'none', position: 'absolute', top: '1px' }} />
                <input 
                  type="date" 
                  style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  onChange={e => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-');
                      handleDateChange(`${d}/${m}/${y}`);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>جاري التحميل...</div>
        ) : (
          <div style={{ position: 'relative', overflow: 'visible' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>المتدرب</th>
                  <th>المؤطر</th>
                  <th>حالة اليوم</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterns.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>لا يوجد متدربين</td>
                  </tr>
                ) : (
                  filteredInterns.map((intern) => {
                    const status = attendance[intern.id];
                    return (
                      <tr key={intern.id}>
                        <td>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <img src={intern.photo_path || `https://i.pravatar.cc/150?u=${intern.id}`} alt={intern.name} className="avatar-zoom" />
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{intern.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--slate)' }}>{intern.email || 'لا يوجد بريد'}</div>
                            </div>
                          </div>
                        </td>
                        <td>{intern.encadrant || '—'}</td>
                        <td>
                          {status === 'present' ? (
                            <span className="badge badge-success"><div className="dot"></div>حاضر</span>
                          ) : status === 'absent' ? (
                            <span className="badge" style={{ background: '#fee2e2', color: '#ef4444' }}><div className="dot" style={{ background: '#ef4444' }}></div>غائب</span>
                          ) : (
                            <span className="badge badge-warning"><div className="dot"></div>لم يسجل</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => markAttendance(intern.id, 'present')}
                              style={{ 
                                padding: '6px 12px', borderRadius: '6px', border: '1px solid #10b981', 
                                background: status === 'present' ? '#10b981' : 'transparent',
                                color: status === 'present' ? 'white' : '#10b981',
                                cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: 'all 0.2s'
                              }}
                            >
                              حاضر
                            </button>
                            <button 
                              onClick={() => markAttendance(intern.id, 'absent')}
                              style={{ 
                                padding: '6px 12px', borderRadius: '6px', border: '1px solid #ef4444', 
                                background: status === 'absent' ? '#ef4444' : 'transparent',
                                color: status === 'absent' ? 'white' : '#ef4444',
                                cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: 'all 0.2s'
                              }}
                            >
                              غائب
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
