import React from 'react';
import { MagicWand } from '@phosphor-icons/react';

interface TestModeAutofillProps {
  onFill: (data: any) => void;
}

export function TestModeAutofill({ onFill }: TestModeAutofillProps) {
  // Only render in development (test) mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const handleFill = () => {
    const randomId = Math.floor(Math.random() * 10000);
    onFill({
      name: `متدرب تجريبي ${randomId}`,
      name_fr: `Test Intern ${randomId}`,
      email: `test${randomId}@example.com`,
      national_id: `AB${randomId}`,
      department: 'تقنية المعلومات',
      phone: `061234${randomId.toString().padStart(4, '0')}`,
      start_date: '01/01/2026',
      end_date: '01/03/2026',
      date_of_birth: '01/01/2000',
      university: 'جامعة تجريبية',
      address: 'شارع الاختبار رقم 123',
      photo_path: `https://i.pravatar.cc/150?u=${randomId}`,
    });
  };

  return (
    <button 
      type="button" 
      onClick={handleFill}
      className="btn" 
      style={{ 
        background: '#8b5cf6', 
        color: 'white', 
        border: 'none', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
      }}
      title="يظهر هذا الزر فقط في وضع التطوير (Test Mode)"
    >
      <MagicWand weight="bold" size={16} />
      ملء تلقائي (Test Mode)
    </button>
  );
}
