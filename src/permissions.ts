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
