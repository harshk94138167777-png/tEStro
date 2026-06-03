import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Injection from './pages/Injection.jsx';
import CrossSite from './pages/CrossSite.jsx';
import AuthTesting from './pages/AuthTesting.jsx';
import Traffic from './pages/Traffic.jsx';
import APIRate from './pages/APIRate.jsx';
import SecurityConfig from './pages/SecurityConfig.jsx';
import FilePath from './pages/FilePath.jsx';
import Reports from './pages/Reports.jsx';
import AIAssistant from './pages/AIAssistant.jsx';
import MLIntelligence from './pages/MLIntelligence.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="injection" element={<Injection />} />
        <Route path="cross-site" element={<CrossSite />} />
        <Route path="auth-testing" element={<AuthTesting />} />
        <Route path="traffic" element={<Traffic />} />
        <Route path="api-rate" element={<APIRate />} />
        <Route path="security-config" element={<SecurityConfig />} />
        <Route path="file-path" element={<FilePath />} />
        <Route path="reports" element={<Reports />} />
        <Route path="ai" element={<AIAssistant />} />
        <Route
          path="ml-intelligence"
          element={
            <ProtectedRoute premiumOnly>
              <MLIntelligence />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
