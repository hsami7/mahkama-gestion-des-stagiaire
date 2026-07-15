import React, { useState, useEffect } from 'react';
import { UserPlus, ShieldCheck, Trash } from '@phosphor-icons/react';

export function UsersPermissions() {
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Manager', permissions: '' });
  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setNewUser({ name: '', email: '', role: 'Manager', permissions: '' });
        fetchUsers();
      } else {
        alert('فشل إضافة المستخدم');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const togglePermission = (perm: string) => {
    const currentPerms = newUser.permissions.split(',').filter(Boolean);
    if (currentPerms.includes(perm)) {
      setNewUser({ ...newUser, permissions: currentPerms.filter(p => p !== perm).join(',') });
    } else {
      setNewUser({ ...newUser, permissions: [...currentPerms, perm].join(',') });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المستخدمين والصلاحيات</h1>
          <p className="text-gray-500 mt-1">إدارة حسابات المدراء والمتدربين</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <UserPlus size={20} />
          إضافة مستخدم جديد
        </h2>
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" placeholder="الاسم الكامل" required
            value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
          />
          <input 
            type="email" placeholder="البريد الإلكتروني" required
            value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
          />
          <select 
            value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
          >
            <option value="Admin">مدير نظام (Admin)</option>
            <option value="Manager">مشرف (Manager)</option>
            <option value="Intern">متدرب (Intern)</option>
          </select>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm text-gray-600 font-medium">الصلاحيات (للمشرفين فقط):</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newUser.permissions.includes('can_add')} onChange={() => togglePermission('can_add')} className="w-4 h-4 text-blue-600" />
                <span className="text-sm">إضافة متدربين</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newUser.permissions.includes('can_edit')} onChange={() => togglePermission('can_edit')} className="w-4 h-4 text-blue-600" />
                <span className="text-sm">تعديل المتدربين</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newUser.permissions.includes('can_delete')} onChange={() => togglePermission('can_delete')} className="w-4 h-4 text-blue-600" />
                <span className="text-sm">حذف متدربين</span>
              </label>
            </div>
          </div>

          <button type="submit" className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition-colors">
            حفظ المستخدم
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">الاسم</th>
              <th className="px-6 py-4 font-medium">البريد الإلكتروني</th>
              <th className="px-6 py-4 font-medium">الدور</th>
              <th className="px-6 py-4 font-medium">الصلاحيات</th>
              <th className="px-6 py-4 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 text-gray-500">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    u.role === 'Admin' ? 'bg-purple-50 text-purple-600' :
                    u.role === 'Manager' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {u.role === 'Admin' ? 'كامل الصلاحيات' : (u.permissions || 'لا توجد')}
                </td>
                <td className="px-6 py-4">
                  {u.email !== 'admin@mahkama.ma' && (
                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash size={20} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
