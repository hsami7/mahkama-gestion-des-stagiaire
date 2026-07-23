import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Interns } from './pages/Interns';
import { FormBuilder } from './pages/FormBuilder';
import { DocumentVault } from './pages/DocumentVault';
import { Login } from './pages/Login';
import { UsersPermissions } from './pages/UsersPermissions';
import { InternPortal } from './pages/InternPortal';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { Attendance } from './pages/Attendance';
import { Timeline } from './pages/Timeline';
import PublicForm from './pages/PublicForm';

function ProtectedRoute({ children, token }: { children: React.ReactNode, token: string | null }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));
  
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isIntern = user?.role === 'Intern';

  // Update token state if changed in other tabs or logged out
  useEffect(() => {
    const checkToken = () => {
      setToken(sessionStorage.getItem('token'));
    };
    window.addEventListener('storage', checkToken);
    return () => window.removeEventListener('storage', checkToken);
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login setAuthToken={setToken} />} />
      <Route path="/apply/:slug" element={<PublicForm />} />
      

      {isIntern ? (
        <Route path="/*" element={
          <ProtectedRoute token={token}>
            <InternPortal />
          </ProtectedRoute>
        } />
      ) : (
        <Route path="/" element={
          <ProtectedRoute token={token}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="interns" element={<Interns />} />
          <Route path="interns/:id" element={<Profile />} />
          <Route path="form-builder" element={<FormBuilder />} />
          <Route path="vault" element={<DocumentVault />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="users" element={<UsersPermissions />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      )}
    </Routes>
  );
}

export default App;
