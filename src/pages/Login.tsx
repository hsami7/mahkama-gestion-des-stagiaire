import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn, LockKey, EnvelopeSimple } from '@phosphor-icons/react';
import { api } from '../services/api';

export function Login({ setAuthToken }: { setAuthToken: (token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api.post('/login', { email, password });
      
      sessionStorage.setItem('token', data.access_token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      setAuthToken(data.access_token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    }
  };

  return (
    <div id="login">
      <div className="login-card">
        <div className="login-side">
          <div>
            <div className="brand-seal">س</div>
            <h1>سِجِلّ</h1>
            <p>نظام إدارة المتدربين<br/>وزارة العدل</p>
          </div>
          <div className="foot">
            الإصدار 1.0.0 &copy; 2026
          </div>
        </div>
        
        <div className="login-main">
          <h2>تسجيل الدخول</h2>
          <p className="sub">مرحباً بك في نظام إدارة المتدربين</p>

          {error && (
            <div style={{color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13.5px'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>البريد الإلكتروني / اسم المستخدم</label>
              <div style={{ position: 'relative' }}>
                <EnvelopeSimple size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-light)' }} />
                <input 
                  type="text" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="اسم المستخدم أو البريد الإلكتروني"
                  style={{ paddingRight: '38px' }}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <LockKey size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-light)' }} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: '38px' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-gold"
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '12px' }}
            >
              <SignIn size={20} />
              تسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
