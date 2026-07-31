export type PermissionAction = 'view' | 'add' | 'edit' | 'delete' | 'approve';

export const PERMISSION_ACTIONS: PermissionAction[] = ['view', 'add', 'edit', 'delete', 'approve'];

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'عرض',
  add: 'إضافة',
  edit: 'تعديل',
  delete: 'حذف',
  approve: 'اعتماد/تصدير',
};

export interface PermissionMap {
  [module: string]: Record<PermissionAction, boolean>;
}

// Must stay in sync with DEFAULT_PERMISSIONS in backend/app.py
export const DEFAULT_PERMISSIONS: PermissionMap = {
  // إدارة المتدربين والطلبات
  interns: { view: true, add: true, edit: true, delete: false, approve: true },
  forms: { view: true, add: true, edit: true, delete: false, approve: false },
  approve_interns: { view: true, add: true, edit: true, delete: false, approve: true },
  assign_encadrant: { view: true, add: true, edit: true, delete: false, approve: false },
  // الوثائق والمستندات
  vault: { view: true, add: true, edit: true, delete: false, approve: false },
  doc_reupload: { view: true, add: true, edit: true, delete: false, approve: true },
  attestation: { view: true, add: false, edit: false, delete: false, approve: true },
  // المتابعة والتقييم
  attendance: { view: true, add: true, edit: true, delete: false, approve: false },
  evaluate_interns: { view: true, add: true, edit: true, delete: false, approve: false },
  tasks_projects: { view: true, add: true, edit: true, delete: false, approve: false },
  // النظام والإعدادات (مقيدة افتراضياً للمشرفين)
  roles: { view: false, add: false, edit: false, delete: false, approve: false },
  system_settings: { view: false, add: false, edit: false, delete: false, approve: false },
  activity_logs: { view: false, add: false, edit: false, delete: false, approve: false },
  statistics: { view: true, add: false, edit: false, delete: false, approve: false },
};

export interface PermissionModule {
  key: string;
  label: string;
  description?: string;
}

export const PERMISSION_HELP: Record<string, {
  desc: string;
  actions: Record<PermissionAction, string>;
}> = {
  interns: {
    desc: 'إدارة ملفات المتدربين: بياناتهم الشخصية، متابعة مراحل التدريب، وتصدير ملفاتهم.',
    actions: {
      view: 'مشاهدة قائمة المتدربين وملفاتهم التفصيلية',
      add: 'إضافة متدرب جديد بشكل يدوي',
      edit: 'تعديل بيانات ومعلومات المتدرب',
      delete: 'حذف متدرب نهائياً من النظام',
      approve: 'تصدير الملف الشخصي والوثائق (PDF / Markdown / ZIP)',
    },
  },
  forms: {
    desc: 'نماذج التسجيل والطلبات: إنشاء وتحرير النماذج العامة التي يملؤها المتقدمون.',
    actions: {
      view: 'مشاهدة النماذج المنشأة والطلبات المقدمة',
      add: 'إنشاء نموذج تسجيل جديد',
      edit: 'تعديل حقول وتصميم النماذج',
      delete: 'حذف نموذج أو طلب',
      approve: 'مزامنة النموذج مع Google/Microsoft وتوليد الطلبات',
    },
  },
  approve_interns: {
    desc: 'قبول ورفض طلبات المتدربين: مراجعة الطلبات المقدمة واتخاذ قرار القبول أو الرفض.',
    actions: {
      view: 'مشاهدة الطلبات المقدمة والمعلّقة',
      add: 'إنشاء طلب متدرب جديد',
      edit: 'تعديل بيانات الطلب',
      delete: 'حذف طلب',
      approve: 'قبول أو رفض طلبات المتدربين',
    },
  },
  assign_encadrant: {
    desc: 'تعيين المؤطر/المشرف: ربط كل متدرب بمشرف أو مؤطر مسؤول عن متابعته.',
    actions: {
      view: 'مشاهدة المؤطرين المعيّنين',
      add: 'إضافة مؤطر جديد',
      edit: 'تغيير المؤطر المسؤول عن المتدرب',
      delete: 'إلغاء تعيين مؤطر',
      approve: 'اعتماد تعيين مؤطر بشكل نهائي',
    },
  },
  vault: {
    desc: 'خزنة الوثائق والمستندات: المستودع المركزي للمستندات وقوالب المستندات الجاهزة.',
    actions: {
      view: 'مشاهدة الوثائق المحفوظة في الخزنة',
      add: 'رفع وثيقة أو قالب جديد للخزنة',
      edit: 'تعديل بيانات الوثيقة',
      delete: 'حذف وثيقة من الخزنة',
      approve: 'اعتماد/استخدام الوثائق والقوالب',
    },
  },
  doc_reupload: {
    desc: 'التحكم في المستندات: إنشاء طلبات للمستندات وعرض وقبول ورفض مستندات المتدربين.',
    actions: {
      view: 'مشاهدة طلبات المستندات وسجل المستندات',
      add: 'إنشاء طلب مستند أو رفع مستند',
      edit: 'تعديل تفاصيل الطلب',
      delete: 'حذف طلب أو مستند',
      approve: 'قبول أو رفض مستندات المتدربين',
    },
  },
  attestation: {
    desc: 'إصدار شهادات التدريب: توليد واعتماد شهادات إنهاء التدريب للمتدربين.',
    actions: {
      view: 'مشاهدة الشهادات الصادرة',
      add: 'إصدار شهادة جديدة',
      edit: 'تعديل بيانات شهادة',
      delete: 'حذف شهادة',
      approve: 'اعتماد الشهادة وإنهاء مرحلة التدريب',
    },
  },
  attendance: {
    desc: 'سجل الحضور والغياب اليومي: تسجيل حضور المتدربين وتوليد السجل اليومي.',
    actions: {
      view: 'مشاهدة سجل الحضور والغياب',
      add: 'تسجيل حضور/غياب متدرب',
      edit: 'تعديل سجل الحضور',
      delete: 'حذف سجل حضور',
      approve: 'اعتماد/تصدير السجل اليومي',
    },
  },
  evaluate_interns: {
    desc: 'تقييم الأداء والتقارير: إضافة وتحرير تقييمات أداء المتدربين وتقاريرهم.',
    actions: {
      view: 'مشاهدة التقييمات والتقارير',
      add: 'إضافة تقييم جديد',
      edit: 'تعديل تقييم سابق',
      delete: 'حذف تقييم',
      approve: 'اعتماد تقييم نهائي',
    },
  },
  tasks_projects: {
    desc: 'متابعة المهام والمشاريع: تتبع المهام والمشاريع الموكلة للمتدربين.',
    actions: {
      view: 'مشاهدة المهام والمشاريع',
      add: 'إضافة مهمة أو مشروع جديد',
      edit: 'تعديل مهمة',
      delete: 'حذف مهمة',
      approve: 'اعتماد إنجاز مهمة',
    },
  },
  roles: {
    desc: 'إدارة المستخدمين والأدوار: إنشاء حسابات المدراء والمشرفين وتحديد صلاحياتهم.',
    actions: {
      view: 'مشاهدة قائمة المستخدمين والصلاحيات',
      add: 'إضافة مستخدم جديد',
      edit: 'تعديل بيانات وصلاحيات المستخدم',
      delete: 'حذف مستخدم',
      approve: 'إعادة تعيين كلمة مرور المستخدم',
    },
  },
  system_settings: {
    desc: 'إعدادات النظام والشروط: إعدادات المؤسسة، الشروط العامة، والتكاملات مع الخدمات الخارجية.',
    actions: {
      view: 'مشاهدة إعدادات النظام',
      add: 'إضافة إعداد جديد',
      edit: 'تعديل الإعدادات والتكاملات',
      delete: 'حذف إعداد',
      approve: 'اعتماد/تفعيل الإعدادات',
    },
  },
  activity_logs: {
    desc: 'سجل النشاطات والتغييرات: تتبع كل العمليات والتغييرات التي تحصل في النظام.',
    actions: {
      view: 'مشاهدة سجل النشاطات',
      add: 'لا يطبّق',
      edit: 'لا يطبّق',
      delete: 'لا يطبّق',
      approve: 'لا يطبّق',
    },
  },
  statistics: {
    desc: 'الإحصائيات والتقارير العامة: عرض الإحصائيات العامة وعدد الطلبات المعلّقة في الواجهة.',
    actions: {
      view: 'مشاهدة الإحصائيات والتقارير',
      add: 'لا يطبّق',
      edit: 'لا يطبّق',
      delete: 'لا يطبّق',
      approve: 'لا يطبّق',
    },
  },
};

export const PERMISSION_GROUPS: { title: string; modules: PermissionModule[] }[] = [
  {
    title: 'إدارة المتدربين والطلبات',
    modules: [
      { key: 'interns', label: 'ملفات المتدربين' },
      { key: 'forms', label: 'نماذج التسجيل والطلبات' },
      { key: 'approve_interns', label: 'قبول ورفض المتدربين' },
      { key: 'assign_encadrant', label: 'تعيين المؤطر/المشرف' },
    ],
  },
  {
    title: 'الوثائق والمستندات',
    modules: [
      { key: 'vault', label: 'خزنة الوثائق والمستندات' },
      {
        key: 'doc_reupload',
        label: 'التحكم في المستندات',
        description: 'يمكنه إنشاء طلبات للمستندات وعرض/قبول/رفض مستندات المتدربين',
      },
      { key: 'attestation', label: 'إصدار شهادات التدريب' },
    ],
  },
  {
    title: 'المتابعة والتقييم',
    modules: [
      { key: 'attendance', label: 'سجل الحضور والغياب اليومي' },
      { key: 'evaluate_interns', label: 'تقييم الأداء والتقارير' },
      { key: 'tasks_projects', label: 'متابعة المهام والمشاريع' },
    ],
  },
  {
    title: 'النظام والإعدادات',
    modules: [
      { key: 'roles', label: 'إدارة المستخدمين والأدوار' },
      { key: 'system_settings', label: 'إعدادات النظام والشروط' },
      { key: 'activity_logs', label: 'سجل النشاطات والتغييرات' },
      { key: 'statistics', label: 'الإحصائيات والتقارير العامة' },
    ],
  },
];

// Admin has full access; the backend returns null permissions for Admin.
export const ADMIN_PERMISSIONS: PermissionMap = (() => {
  const full: PermissionMap = {};
  for (const [mod, acts] of Object.entries(DEFAULT_PERMISSIONS)) {
    full[mod] = { ...acts, view: true, add: true, edit: true, delete: true, approve: true };
  }
  return full;
})();

export function mergePermissions(raw: string | null | Record<string, any> | undefined): PermissionMap {
  let stored: Record<string, any> = {};
  if (typeof raw === 'string' && raw) {
    try {
      stored = JSON.parse(raw);
    } catch {
      stored = {};
    }
  } else if (raw && typeof raw === 'object') {
    stored = raw;
  }
  if (!stored || typeof stored !== 'object') stored = {};

  const merged: PermissionMap = {};
  for (const [mod, acts] of Object.entries(DEFAULT_PERMISSIONS)) {
    const modMap = stored[mod] && typeof stored[mod] === 'object' ? stored[mod] : {};
    const row: Record<PermissionAction, boolean> = {} as Record<PermissionAction, boolean>;
    for (const act of PERMISSION_ACTIONS) {
      row[act] = modMap[act] !== undefined ? Boolean(modMap[act]) : acts[act];
    }
    merged[mod] = row;
  }
  return merged;
}
