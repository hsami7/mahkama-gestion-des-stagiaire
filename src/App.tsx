import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';

// Mock empty pages for routing
const Interns = () => <div className="card">إدارة المتدربين (قيد التطوير)</div>;
const FormBuilder = () => <div className="card">منشئ النماذج (قيد التطوير)</div>;
const Settings = () => <div className="card">الإعدادات (قيد التطوير)</div>;

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="interns" element={<Interns />} />
        <Route path="form-builder" element={<FormBuilder />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
