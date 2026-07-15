import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Interns } from './pages/Interns';
import { FormBuilder } from './pages/FormBuilder';
import { DocumentVault } from './pages/DocumentVault';
import { Login } from './pages/Login';

function ProtectedRoute({ children, token }: { children: React.ReactNode, token: string | null }) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Update token state if changed in other tabs or logged out
  useEffect(() => {
    const checkToken = () => {
      setToken(localStorage.getItem('token'));
    };
    window.addEventListener('storage', checkToken);
    return () => window.removeEventListener('storage', checkToken);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setAuthToken={setToken} />} />
        
        <Route path="/" element={
          <ProtectedRoute token={token}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="interns" element={<Interns />} />
          <Route path="form-builder" element={<FormBuilder />} />
          <Route path="vault" element={<DocumentVault />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
