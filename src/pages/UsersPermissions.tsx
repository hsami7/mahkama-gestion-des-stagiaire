import React, { useState, useEffect } from 'react';
import { UserPlus, Trash, PencilSimple, UserList } from '@phosphor-icons/react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

export function UsersPermissions() {
  const toast = useToast();
  const defaultPermissions = {
    interns: { view: true, add: true, edit: true, delete: false },
    forms: { view: true, add: true, edit: true, delete: false },
    vault: { view: true, add: true, edit: true, delete: false },
    roles: { view: false, add: false, edit: false, delete: false },
    assign_encadrant: { view: true, add: true, edit: true, delete: false },
    attendance: { view: true, add: true, edit: true, delete: false },
    approve_interns: { view: true, add: true, edit: true, delete: false },
    evaluate_interns: { view: true, add: true, edit: true, delete: false }
  };

  const [users, setUsers] = useState<any[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [newUser, setNewUser] = useState({ 
    name: '', email: '', role: '', password: 'password123',
    permissions: JSON.stringify(defaultPermissions) 
  });

  const fetchUsers = async () => {
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await api.put(`/users/${editingUserId}`, newUser);
      } else {
        await api.post('/users', newUser);
      }
      setEditingUserId(null);
      setNewUser({ name: '', email: '', role: '', password: 'password123', permissions: JSON.stringify(defaultPermissions) });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ المستخدم');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUserId(user.id);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      permissions: user.permissions || JSON.stringify(defaultPermissions)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setNewUser({ name: '', email: '', role: 'Manager', password: 'password123', permissions: JSON.stringify(defaultPermissions) });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  let currentPerms = defaultPermissions;
  try {
    currentPerms = newUser.role === 'Admin' 
      ? {
          interns: { view: true, add: true, edit: true, delete: true },
          forms: { view: true, add: true, edit: true, delete: true },
          vault: { view: true, add: true, edit: true, delete: true },
          roles: { view: true, add: true, edit: true, delete: true },
          assign_encadrant: { view: true, add: true, edit: true, delete: true },
          attendance: { view: true, add: true, edit: true, delete: true },
          approve_interns: { view: true, add: true, edit: true, delete: true },
          evaluate_interns: { view: true, add: true, edit: true, delete: true }
        }
      : JSON.parse(newUser.permissions || JSON.stringify(defaultPermissions));
  } catch (e) {}

  const handlePermChange = (module: string, action: string, checked: boolean) => {
    if (newUser.role === 'Admin') return;
    const updated = { ...currentPerms } as any;
    if (!updated[module]) updated[module] = { view: false, add: false, edit: false, delete: false };
    updated[module][action] = checked;
    setNewUser({ ...newUser, permissions: JSON.stringify(updated) });
  };

  const moduleNames: Record<string, string> = {
    interns: 'ملفات المتدربين',
    forms: 'نماذج التسجيل',
    vault: 'خزنة الوثائق',
    roles: 'الأدوار والصلاحيات',
    assign_encadrant: 'تعيين المؤطر (المشرف)',
    attendance: 'سجل الحضور اليومي',
    approve_interns: 'قبول ورفض المتدربين',
    evaluate_interns: 'تقييم المتدربين'
  };

  return (
    <div>
      <div className="section-head" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>المستخدمين والصلاحيات</h1>
          <p style={{ color: 'var(--slate)' }}>إدارة حسابات المدراء والمتدربين وتحديد صلاحياتهم</p>
        </div>
      </div>

      <div className="card" style={{ padding: '28px', marginBottom: '32px', borderTop: '4px solid var(--gold)' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={24} color="var(--gold)" />
          {editingUserId ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
        </h2>
        
        <form onSubmit={handleSaveUser}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>الاسم الكامل</label>
              <input 
                type="text" placeholder="الاسم الكامل" required
                value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                className="input"
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>البريد الإلكتروني</label>
              <input 
                type="email" placeholder="البريد الإلكتروني" required={!editingUserId}
                value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                className="input"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>الدور</label>
              <select 
                value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                className="input" required
              >
                <option value="" disabled>اختر الدور</option>
                <option value="Admin">مدير نظام (Admin)</option>
                <option value="Manager">مشرف (Manager)</option>
                <option value="Intern">متدرب (Intern)</option>
              </select>
            </div>
          </div>

          {newUser.role && newUser.role !== 'Intern' && (
          <div style={{ marginTop: '32px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>
              مصفوفة الصلاحيات التفصيلية — {newUser.role === 'Admin' ? 'مدير نظام' : 'مشرف'}
            </h3>
            <p style={{ color: 'var(--slate)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {newUser.role === 'Admin' ? 'المدير يملك كل الصلاحيات بشكل افتراضي.' : 'يمكنك تعديل الصلاحيات الخاصة بهذا المستخدم بشكل فردي.'}
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table className="matrix">
                <thead>
                  <tr>
                    <th>الوحدة</th>
                    <th>عرض</th>
                    <th>إضافة</th>
                    <th>تعديل</th>
                    <th>حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(defaultPermissions).filter(mod => newUser.role === 'Manager' || mod !== 'evaluate_interns').map((mod) => (
                    <tr key={mod}>
                      <td style={{ fontWeight: 600 }}>{moduleNames[mod]}</td>
                      <td>
                        <input 
                          type="checkbox" className="chk" 
                          checked={(currentPerms as any)[mod]?.view || false} 
                          disabled={newUser.role === 'Admin'}
                          onChange={(e) => handlePermChange(mod, 'view', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input 
                          type="checkbox" className="chk" 
                          checked={(currentPerms as any)[mod]?.add || false} 
                          disabled={newUser.role === 'Admin'}
                          onChange={(e) => handlePermChange(mod, 'add', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input 
                          type="checkbox" className="chk" 
                          checked={(currentPerms as any)[mod]?.edit || false} 
                          disabled={newUser.role === 'Admin'}
                          onChange={(e) => handlePermChange(mod, 'edit', e.target.checked)}
                        />
                      </td>
                      <td>
                        <input 
                          type="checkbox" className="chk" 
                          checked={(currentPerms as any)[mod]?.delete || false} 
                          disabled={newUser.role === 'Admin'}
                          onChange={(e) => handlePermChange(mod, 'delete', e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
            {editingUserId && (
              <button type="button" onClick={handleCancelEdit} className="btn btn-ghost">
                إلغاء التعديل
              </button>
            )}
            <button type="submit" className="btn btn-ink">
              {editingUserId ? 'حفظ التعديلات' : 'حفظ المستخدم'}
            </button>
          </div>
        </form>
      </div>

      <div className="section-head" style={{ marginTop: '48px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ marginTop: 0, fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserList size={24} />
            قائمة المستخدمين
          </h2>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead style={{ backgroundColor: 'var(--paper)' }}>
              <tr>
                <th>الاسم</th>
                <th>اسم المستخدم</th>
                <th>البريد الإلكتروني</th>
                <th>الدور</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 'bold' }}>{u.name}</td>
                  <td style={{ color: 'var(--slate)' }}>{u.username}</td>
                  <td style={{ color: 'var(--slate)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${
                      u.role === 'Admin' ? 'badge-info' :
                      u.role === 'Manager' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(u)} style={{ background: 'var(--gold-light)', border: 'none', color: 'var(--gold-dark)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="تعديل">
                        <PencilSimple size={18} weight="bold" />
                      </button>
                      {u.email !== 'admin@mahkama.ma' && (
                        <button onClick={() => handleDelete(u.id)} style={{ background: 'var(--danger-bg)', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="حذف">
                          <Trash size={18} weight="bold" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--slate)', padding: '32px' }}>
                    لا يوجد مستخدمين
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
