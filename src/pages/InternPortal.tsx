import React from 'react';
import { UploadSimple, FilePdf } from '@phosphor-icons/react';

export function InternPortal() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-10 text-white">
          <h1 className="text-3xl font-bold mb-2">مرحباً بك، {user?.name || 'متدرب'}!</h1>
          <p className="text-blue-100 text-lg">بوابة المتدرب الخاصة بك</p>
        </div>
        
        <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-4">حالة طلبك</h2>
            <div className="bg-yellow-50 border border-yellow-100 text-yellow-700 p-4 rounded-xl flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="font-medium">قيد المراجعة</span>
            </div>
            <p className="text-gray-500 mt-4 text-sm leading-relaxed">
              طلبك حالياً قيد المراجعة من قبل الإدارة. يرجى التأكد من رفع جميع المستندات المطلوبة في القسم أدناه لتسريع عملية القبول.
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">مستنداتي الشخصية</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center border-dashed border-2 hover:bg-gray-50 transition-colors cursor-pointer group h-48">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UploadSimple size={24} />
          </div>
          <p className="font-medium text-gray-900">رفع السيرة الذاتية (CV)</p>
          <p className="text-sm text-gray-400 mt-1">PDF أو Word</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center border-dashed border-2 hover:bg-gray-50 transition-colors cursor-pointer group h-48">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UploadSimple size={24} />
          </div>
          <p className="font-medium text-gray-900">رفع صورة البطاقة الوطنية</p>
          <p className="text-sm text-gray-400 mt-1">PNG أو JPG</p>
        </div>
      </div>
    </div>
  );
}
