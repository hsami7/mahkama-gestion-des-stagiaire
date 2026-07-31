import React, { useState, useEffect } from 'react';
import { UserPlus, Trash, PencilSimple, UserList, LockKey } from '@phosphor-icons/react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import {
  PERMISSION_ACTIONS,
  ACTION_LABELS,
  DEFAULT_PERMISSIONS,
  ADMIN_PERMISSIONS,
  PERMISSION_GROUPS,
  mergePermissions,
} from '../permissions';
import type { PermissionAction, PermissionMap } from '../permissions';

const newUserDefaults = {
  name: '', email: '', role: '', password: 'password123',
  permissions: JSON.stringify(DEFAULT_PERMISSIONS),
  can_manage_documents: false
};

export function UsersPermissions() {
  const toast = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [newUser, setNewUser] = useState({ ...newUserDefaults });

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
      setNewUser({ ...newUserDefaults });
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
      permissions: user.permissions || JSON.stringify(DEFAULT_PERMISSIONS),
      can_manage_documents: user.can_manage_documents || false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setNewUser({ ...newUserDefaults, role: 'Manager' });
  };

  const handleResetPassword = async (id: number, name: string) => {
    if (!window.confirm(`هل أنت متأكد من إعادة تعيين كلمة مرور "${name}" إلى password123؟`)) return;
    try {
      await api.post(`/users/${id}/reset-password`, {});
      toast.success(`تم إعادة تعيين كلمة مرور ${name}`);
    } catch (err) {
      console.error(err);
      toast.error('فشل إعادة تعيين كلمة المرور');
    }
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

  const currentPerms: PermissionMap = newUser.role === 'Admin'
    ? ADMIN_PERMISSIONS
    : mergePermissions(newUser.permissions);

  const handlePermChange = (module: string, action: PermissionAction, checked: boolean) => {
    if (newUser.role === 'Admin') return;
    const updated = mergePermissions(newUser.permissions);
    if (!updated[module]) updated[module] = { view: false, add: false, edit: false, delete: false, approve: false };
    updated[module][action] = checked;
    setNewUser({ ...newUser, permissions: JSON.stringify(updated) });
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

          {newUser.role === 'Manager' && (
            <div style={{marginBottom:16}}>
              <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600}}>
                <input type="checkbox" checked={newUser.can_manage_documents} onChange={e => setNewUser({...newUser, can_manage_documents: e.target.checked})} style={{width:16,height:16}} />
                التحكم في المستندات — يمكنه إنشاء طلبات للمستندات وعرض/قبول/رفض مستندات المتدربين
              </label>
            </div>
          )}

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
                    {PERMISSION_ACTIONS.map(act => (
                      <th key={act}>{ACTION_LABELS[act]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_GROUPS.map((group) => (
                    <React.Fragment key={group.title}>
                      <tr style={{ background: 'var(--paper)' }}>
                        <td colSpan={PERMISSION_ACTIONS.length + 1} style={{ fontWeight: 'bold', color: 'var(--gold-dark)', fontSize: '0.85rem', padding: '8px 12px' }}>
                          {group.title}
                        </td>
                      </tr>
                      {group.modules.map((mod) => (
                        <tr key={mod.key}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{mod.label}</div>
                            {mod.description && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--slate)', fontWeight: 400, marginTop: 2 }}>
                                {mod.description}
                              </div>
                            )}
                          </td>
                          {PERMISSION_ACTIONS.map(act => (
                            <td key={act}>
                              <input 
                                type="checkbox" className="chk" 
                                checked={currentPerms[mod.key]?.[act] || false}
                                disabled={newUser.role === 'Admin'}
                                onChange={(e) => handlePermChange(mod.key, act, e.target.checked)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
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
                      <button onClick={() => handleResetPassword(u.id, u.name)} style={{ background: '#FEF3C7', border: 'none', color: '#B45309', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="إعادة تعيين كلمة المرور">
                        <LockKey size={18} weight="bold" />
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
