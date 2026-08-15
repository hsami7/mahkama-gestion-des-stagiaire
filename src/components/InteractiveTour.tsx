import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, X, Sparkle, CheckCircle, Question } from '@phosphor-icons/react';

export interface TourStep {
  target?: string; // CSS selector or element ID
  title: string;
  content: string;
  position?: 'bottom' | 'top' | 'left' | 'right' | 'center';
  path?: string; // Navigate to path if provided
}

const ADMIN_TOUR_STEPS: TourStep[] = [
  {
    title: 'مرحباً بك في نظام إدارة المتدربين (سجِل)',
    content: 'جولة تفاعلية سريعة للتعرف على أهم خصائص ومميزات منصة إدارة المتدربين بالمحكمة.',
    position: 'center',
    path: '/'
  },
  {
    target: '.sidebar',
    title: 'القائمة الرئيسية والتحكم',
    content: 'تتيح لك القائمة الجانبية التنقل بين إدارة المتدربين، سجل الحضور، منشئ النماذج، الخزنة، ومخطط التغطية.',
    position: 'left',
    path: '/'
  },
  {
    target: '.topbar',
    title: 'شريط البحث والإشعارات',
    content: 'يمكنك استخدام البحث السريع للوصول الفوري للملفات، والاطلاع على الإشعارات والتنبيهات المباشرة.',
    position: 'bottom',
    path: '/'
  },
  {
    target: '.kpi-grid, .grid-4',
    title: 'المؤشرات العامة والمهام',
    content: 'نظرة عامة على أعداد المتدربين، طلبات التسجيل المعلقة، المستندات الناقصة، وإحصائيات الأقسام.',
    position: 'bottom',
    path: '/'
  },
  {
    target: 'a[href="/interns"]',
    title: 'سجل وإدارة المتدربين',
    content: 'عرض جميع المتدربين، البحث برقم البطاقة الوطنية أو الاسم، وتصدير التقارير بصيغة PDF و Excel.',
    position: 'left',
    path: '/interns'
  },
  {
    target: 'a[href="/guide"]',
    title: 'دليل الاستخدام والشروحات',
    content: 'صفحة متكاملة تحتوي على بطاقات توضيحية وشروحات مصورة لجميع مراحل العمل بالمنظومة.',
    position: 'left',
    path: '/guide'
  }
];

const INTERN_TOUR_STEPS: TourStep[] = [
  {
    title: 'مرحباً بك في بوابة المتدرب',
    content: 'منصتك الخاصة لمتابعة حالة تدريبك، رفع الوثائق المطلوبة، وتحميل الشهادات والوثائق الموقعة.',
    position: 'center',
    path: '/'
  },
  {
    target: '#intern-status-card, .status-card',
    title: 'بطاقة حالة التدريب',
    content: 'تعرض تفاصيل فترة التدريب، القسم المسند إليك، والمؤطر المسؤول عن متابعتك.',
    position: 'bottom',
    path: '/'
  },
  {
    target: '#intern-docs-section, .vault-section',
    title: 'مركز المستندات والوثائق',
    content: 'يمكنك هنا رفع نسختك من CNI وشهادة التأمين، وتحميل اتفاقية التدريب والشهادة الموقعة فور جاهزيتها.',
    position: 'top',
    path: '/'
  }
];

export function InteractiveTour({ runManually, onCloseManual }: { runManually?: boolean, onCloseManual?: () => void }) {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isIntern = user?.role === 'Intern';
  const roleKey = isIntern ? 'intern' : 'admin';

  const tourSteps = isIntern ? INTERN_TOUR_STEPS : ADMIN_TOUR_STEPS;
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check if tour should auto-start
  useEffect(() => {
    if (runManually) {
      setIsOpen(true);
      setCurrentStepIndex(0);
      return;
    }
    const hasCompleted = localStorage.getItem(`tour_completed_${roleKey}`);
    if (!hasCompleted && window.location.pathname === '/') {
      // Auto start after brief delay on home dashboard
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [runManually, roleKey]);

  const currentStep = tourSteps[currentStepIndex];

  // Update element rect positioning
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    const updateRect = () => {
      if (currentStep.target) {
        const el = document.querySelector(currentStep.target);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
          return;
        }
      }
      setTargetRect(null);
    };

    updateRect();
    const timer = setTimeout(updateRect, 300);
    window.addEventListener('resize', updateRect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
    };
  }, [isOpen, currentStepIndex, currentStep, navigate]);

  const handleFinish = () => {
    localStorage.setItem(`tour_completed_${roleKey}`, 'true');
    setIsOpen(false);
    if (onCloseManual) onCloseManual();
  };

  const handleNext = () => {
    if (currentStepIndex < tourSteps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      const nextStep = tourSteps[nextIdx];
      if (nextStep?.path && window.location.pathname !== nextStep.path) {
        navigate(nextStep.path);
      }
      setCurrentStepIndex(nextIdx);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (!isOpen || !currentStep) return null;

  return (
    <div className="tour-overlay-container" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      pointerEvents: 'auto',
      direction: 'rtl'
    }}>
      {/* Background Dimmed Overlay */}
      <svg style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(15, 23, 42, 0.75)" mask="url(#tour-mask)" />
      </svg>

      {/* Target Highlight Border */}
      {targetRect && (
        <div style={{
          position: 'fixed',
          left: targetRect.left - 8,
          top: targetRect.top - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          borderRadius: 10,
          border: '2px dashed #D4AF37',
          boxShadow: '0 0 25px rgba(212, 175, 55, 0.5)',
          pointerEvents: 'none',
          transition: 'all 0.3s ease',
          zIndex: 100000
        }} />
      )}

      {/* Tooltip Card */}
      <div style={{
        position: 'fixed',
        left: targetRect 
          ? Math.max(20, Math.min(window.innerWidth - 380, targetRect.left + (targetRect.width / 2) - 170))
          : '50%',
        top: targetRect 
          ? (targetRect.bottom + 20 + 260 < window.innerHeight 
              ? targetRect.bottom + 20 
              : Math.max(20, targetRect.top - 240))
          : '50%',
        transform: targetRect ? 'none' : 'translate(-50%, -50%)',
        width: 360,
        maxWidth: '90vw',
        background: '#1E293B',
        color: '#F8FAFC',
        borderRadius: 16,
        padding: '24px 22px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
        zIndex: 100001,
        transition: 'all 0.3s ease',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Step Badge & Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(212, 175, 55, 0.15)',
            color: '#F3E5AB',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: '0.78rem',
            fontWeight: 700
          }}>
            <Sparkle size={14} weight="fill" />
            خطوة {currentStepIndex + 1} من {tourSteps.length}
          </span>
          <button
            onClick={handleFinish}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center'
            }}
            title="إغلاق الجولة"
          >
            <X size={18} />
          </button>
        </div>

        {/* Title & Body */}
        <h4 style={{ margin: '0 0 8px', fontSize: '1.05rem', color: '#FFF', fontWeight: 700 }}>
          {currentStep.title}
        </h4>
        <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.6 }}>
          {currentStep.content}
        </p>

        {/* Actions Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
          <button
            onClick={handleFinish}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '0.82rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            تخطي
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#E2E8F0',
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <ArrowRight size={14} /> السابق
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
                border: 'none',
                color: '#0F172A',
                padding: '7px 16px',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
              }}
            >
              {currentStepIndex === tourSteps.length - 1 ? (
                <>
                  <CheckCircle size={16} weight="fill" /> إنهاء
                </>
              ) : (
                <>
                  التالي <ArrowLeft size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
