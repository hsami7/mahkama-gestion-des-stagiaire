import React, { useState } from 'react';
import { 
  BookOpen, Sparkle, Play, Users, FileText, Folder, ShieldCheck, 
  Gear, ArrowLeft, CheckCircle, Clock, Archive, LockKey, EnvelopeSimple, 
  Cards, Check, UserCircle, Files
} from '@phosphor-icons/react';
import { InteractiveTour } from '../components/InteractiveTour';

export function Guide() {
  const [activeTab, setActiveTab] = useState<'interns' | 'files' | 'rbac' | 'settings'>('interns');
  const [startTour, setStartTour] = useState(false);

  return (
    <div className="guide-page" style={{ padding: '24px', direction: 'rtl' }}>
      <InteractiveTour runManually={startTour} onCloseManual={() => setStartTour(false)} />

      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        borderRadius: 16,
        padding: '32px 28px',
        color: '#FFF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ maxWidth: 650 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(212, 175, 55, 0.15)',
            color: '#F3E5AB',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: 12,
            border: '1px solid rgba(212, 175, 55, 0.3)'
          }}>
            <BookOpen size={16} /> دليل الاستخدام والشروحات التفاعلية
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.6rem', color: '#FFF', fontWeight: 800 }}>
            المساعد المرئي لدليل المنظومة (سجِل)
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
            مرحباً بك في دليل الاستخدام المصور. استكشف أقسام النظام، خطوات عمل الملفات، مصفوفة الصلاحيات، والجولة الميدانية المباشرة.
          </p>
        </div>

        <button
          onClick={() => setStartTour(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
            color: '#0F172A',
            border: 'none',
            padding: '12px 22px',
            borderRadius: 12,
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(212, 175, 55, 0.35)',
            transition: 'transform 0.2s'
          }}
        >
          <Play size={18} weight="fill" /> بدء الجولة التفاعلية
        </button>
      </div>

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '2px solid var(--line)',
        marginBottom: 24,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        {[
          { id: 'interns', label: 'المتدربون وبوابة المتدرب', icon: <Users size={18} /> },
          { id: 'files', label: 'الملفات ومتابعة المحكمة', icon: <Files size={18} /> },
          { id: 'rbac', label: 'المستخدمون والصلاحيات (RBAC)', icon: <ShieldCheck size={18} /> },
          { id: 'settings', label: 'الإعدادات والتكاملات', icon: <Gear size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === tab.id ? '3px solid var(--gold)' : '3px solid transparent',
              color: activeTab === tab.id ? 'var(--gold-dark)' : 'var(--slate)',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: INTERNS & PORTAL */}
      {activeTab === 'interns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Step Sequence Bar */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={20} color="var(--gold)" /> مسار إدارة المتدرب (من التقديم إلى التخرج)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { step: '1', title: 'تسجيل الطلب', desc: 'عبر بوابة المتدربين أو نماذج جوجل' },
                { step: '2', title: 'مراجعة الوثائق', desc: 'التحقق من CNI والاتفاقية والتأمين' },
                { step: '3', title: 'تعيين المؤطر', desc: 'إسناد القسم والمشرف المسؤول' },
                { step: '4', title: 'تتبع الحضور والتقييم', desc: 'تسجيل النقط والتقييم النهائي' }
              ].map((s, idx) => (
                <div key={idx} style={{
                  background: 'var(--paper)',
                  borderRadius: 10,
                  padding: 14,
                  border: '1px solid var(--line)',
                  position: 'relative'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 10,
                    top: 10,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'var(--gold)',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {s.step}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4, color: 'var(--ink)' }}>{s.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mock UI Card Preview: Intern Profile */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--ink)' }}>
                معاينة واجهة بطاقة المتدرب والتقييم
              </h4>
              <span className="badge badge-success">نموذج حي للتوضيح</span>
            </div>

            <div style={{
              background: 'var(--paper)',
              borderRadius: 12,
              padding: 20,
              border: '1px solid var(--line)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--line)', paddingBottom: 16 }}>
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: 'var(--gold-light)',
                  color: 'var(--gold-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem'
                }}>
                  أم
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>أحمد المنصوري (Ahmed El Mansouri)</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate)', marginTop: 2 }}>
                    بطاقة وطنية: <b style={{ color: 'var(--ink)' }}>CD789123</b> | القسم: <b style={{ color: 'var(--ink)' }}>كتابة الضبط - قسم قضايا الإلغاء</b>
                  </div>
                </div>
                <span className="badge badge-success">نشط</span>
              </div>

              {/* Evaluation score snippet */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <div style={{ background: 'var(--card)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>الانضباط والالتزام</div>
                  <div style={{ fontWeight: 800, color: 'var(--gold-dark)', marginTop: 4 }}>4.5 / 5</div>
                </div>
                <div style={{ background: 'var(--card)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>المهارات القانونية</div>
                  <div style={{ fontWeight: 800, color: 'var(--gold-dark)', marginTop: 4 }}>4.8 / 5</div>
                </div>
                <div style={{ background: 'var(--card)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>العمل الجماعي</div>
                  <div style={{ fontWeight: 800, color: 'var(--gold-dark)', marginTop: 4 }}>5.0 / 5</div>
                </div>
                <div style={{ background: 'var(--card)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>المجموع النهائي</div>
                  <div style={{ fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>18.3 / 20</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MAHAKAMA FILES & TRACKING */}
      {activeTab === 'files' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Step Sequence Bar */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Files size={20} color="var(--gold)" /> حالات ومراحل الملفات بالمحكمة
            </h4>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { status: 'المسجل', count: '12', color: 'var(--slate)' },
                { status: 'الرائج', count: '45', color: '#3B82F6' },
                { status: 'المنجز', count: '88', color: 'var(--success)' },
                { status: 'المغلق', count: '104', color: 'var(--gold-dark)' },
                { status: 'الباقي', count: '8', color: 'var(--danger)' }
              ].map((st, i) => (
                <div key={i} style={{
                  flex: 1,
                  minWidth: 130,
                  background: 'var(--paper)',
                  padding: '12px 14px',
                  borderRadius: 10,
                  borderRight: `4px solid ${st.color}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>الملفات - {st.status}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>{st.count} ملف</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mock UI Card: Legal File Tracking Card */}
          <div className="card" style={{ padding: 24 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'var(--ink)' }}>
              بطاقة تتبع الملفات القضائية والإدارية (معاينة)
            </h4>

            <div style={{
              background: 'var(--paper)',
              borderRadius: 12,
              padding: 20,
              border: '1px solid var(--line)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gold-dark)', fontWeight: 700 }}>رقم الملف: 2026/7211/472</span>
                  <h5 style={{ margin: '4px 0 0', fontSize: '1rem', color: 'var(--ink)' }}>طلب اتفاقية تدريب وتزكية كتابة الضبط</h5>
                </div>
                <span className="badge badge-info">الرائج (قيد المتابعة)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: '0.82rem', color: 'var(--slate)' }}>
                <div>صاحب الطلب: <b style={{ color: 'var(--ink)' }}>متدرب تجريبي 8724</b></div>
                <div>المؤطر المسؤول: <b style={{ color: 'var(--ink)' }}>د. عبد الحق الحساني</b></div>
                <div>تاريخ التسجيل: <b style={{ color: 'var(--ink)' }}>15/08/2026</b></div>
                <div>الوضع الحالي: <b style={{ color: 'var(--success)' }}>في انتظار توقيع الرئيس</b></div>
              </div>

              {/* Action Trail */}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)', display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.78rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--ink)' }}>خطوات الإجراء:</span>
                <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', padding: '3px 8px', borderRadius: 4 }}>1. تسجيل الطلب ✓</span>
                <ArrowLeft size={12} />
                <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '3px 8px', borderRadius: 4 }}>2. التثبت والتدقيق ✓</span>
                <ArrowLeft size={12} />
                <span style={{ background: 'rgba(212, 175, 55, 0.2)', color: 'var(--gold-dark)', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>3. التأشير الإلكتروني</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RBAC & USER MANAGEMENT */}
      {activeTab === 'rbac' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* RBAC Matrix Explanation Card */}
          <div className="card" style={{ padding: 24 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={20} color="var(--gold)" /> مصفوفة الصلاحيات (RBAC Permission Matrix)
            </h4>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--paper)', borderBottom: '2px solid var(--line)' }}>
                    <th style={{ padding: 12, textAlign: 'right' }}>الوظيفة / الصلاحية</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>مدير النظام (Admin)</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>مشرف قسم (Manager)</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>المتدرب (Intern)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { perm: 'إدارة وتعيين المستخدمين والصلاحيات', admin: true, manager: false, intern: false },
                    { perm: 'معاينة واعتماد جميع المتدربين', admin: true, manager: true, intern: false },
                    { perm: 'توقيع واعتماد الوثائق الرسمية', admin: true, manager: 'اختياري', intern: false },
                    { perm: 'تسجيل الحضور والانصراف اليومي', admin: true, manager: true, intern: false },
                    { perm: 'رفع المستندات الشخصية والطلبات', admin: false, manager: false, intern: true }
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                      <td style={{ padding: 12, fontWeight: 600 }}>{row.perm}</td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        {row.admin ? <CheckCircle size={20} color="var(--success)" weight="fill" /> : '—'}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        {row.manager === true ? (
                          <CheckCircle size={20} color="var(--success)" weight="fill" />
                        ) : row.manager === 'اختياري' ? (
                          <span className="badge badge-warning">حسب الإذن</span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        {row.intern ? <CheckCircle size={20} color="var(--success)" weight="fill" /> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS & INTEGRATIONS */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gear size={20} color="var(--gold)" /> التكفير والتكاملات الخارجية
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ background: 'var(--paper)', borderRadius: 12, padding: 18, border: '1px solid var(--line)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: 6 }}>
                  📧 البريد الإلكتروني (Microsoft Outlook / SMTP)
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate)', margin: '0 0 12px' }}>
                  ربط المنظومة لإرسال الإشعارات التلقائية، قرارات القبول، ورسائل رفض الطلبات.
                </p>
                <span className="badge badge-success">متصل ومفعل</span>
              </div>

              <div style={{ background: 'var(--paper)', borderRadius: 12, padding: 18, border: '1px solid var(--line)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: 6 }}>
                  📝 نماذج جوجل (Google Forms & Drive Sync)
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate)', margin: '0 0 12px' }}>
                  مزامنة استمارات التقديم وتخزين ملفات السيرة الذاتية تلقائياً على Google Drive.
                </p>
                <span className="badge badge-success">مفعل</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
