import React, { useState } from 'react';
import { api } from '../services/api';
import { Key, CheckCircle, XCircle } from '@phosphor-icons/react';

export function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMsg('يرجى ملء جميع الحقول');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg('كلمتا المرور غير متطابقتين');
      return;
    }
    setSaving(true);
    try {
      await api.put('/users/password', { old_password: oldPassword, new_password: newPassword });
      setMsg('تم تغيير كلمة المرور بنجاح');
      setMsgOk(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMsg(err?.response?.data?.msg || err?.message || 'فشل في تغيير كلمة المرور');
      setMsgOk(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="section-head" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={26} color="var(--gold)" />
            تغيير كلمة المرور
          </h1>
          <p style={{ color: 'var(--slate)' }}>قم بتحديث كلمة مرور حسابك</p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>كلمة المرور الحالية *</label>
            <input
              type="password"
              placeholder="أدخل كلمة المرور الحالية"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="input"
              autoComplete="current-password"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>كلمة المرور الجديدة *</label>
              <input
                type="password"
                placeholder="أدخل كلمة المرور الجديدة"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input"
                autoComplete="new-password"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>تأكيد كلمة المرور الجديدة *</label>
              <input
                type="password"
                placeholder="أعد إدخال كلمة المرور"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '28px' }}>
            <button type="submit" className="btn btn-gold" style={{ padding: '12px 32px' }} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
            </button>
            {msg && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold', color: msgOk ? 'var(--success)' : 'var(--danger)' }}>
                {msgOk ? <CheckCircle size={18} weight="fill" /> : <XCircle size={18} weight="fill" />}
                {msg}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
