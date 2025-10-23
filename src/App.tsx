// Aplicación principal con routing y protección
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { useAuthStore } from './stores/authStore';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Unauthorized } from './pages/Unauthorized';
import { Clients } from './pages/Clients';
import { Inventory } from './pages/Inventory';
import { Invoicing } from './pages/Invoicing';
import { SalesHistory } from './pages/SalesHistory';
import { Reports } from './pages/Reports';
import { AuditLog } from './pages/AuditLog';
import { Users } from './pages/Users';
import { TestSMTP } from './pages/TestSMTP';

export default function App() {
  const { user } = useAuthStore();

  // Ruta inicial por rol para evitar pantallas sin permisos
  const roleHome: Record<string, string> = {
    administrador: '/dashboard',
    vendedor: '/dashboard',
    contador: '/reportes',
    auditor: '/auditoria',
    cliente: '/dashboard' // Los clientes ya no tienen portal especial
  };

  const initial = user ? roleHome[user.role] ?? '/dashboard' : '/login';

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={initial} replace />} />
          <Route 
            path="dashboard" 
            element={
              <ProtectedRoute requiredModule="dashboard">
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="clientes/*" 
            element={
              <ProtectedRoute requiredModule="clientes">
                <Clients />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="inventario/*" 
            element={
              <ProtectedRoute requiredModule="inventario">
                <Inventory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="facturacion/*" 
            element={
              <ProtectedRoute requiredModule="facturacion">
                <Invoicing />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="historial/*" 
            element={
              <ProtectedRoute requiredModule="historial">
                <SalesHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="reportes/*" 
            element={
              <ProtectedRoute requiredModule="reportes">
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="auditoria/*" 
            element={
              <ProtectedRoute requiredModule="auditoria">
                <AuditLog />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="usuarios/*" 
            element={
              <ProtectedRoute requiredModule="dashboard">
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="test-smtp/*" 
            element={
              <ProtectedRoute requiredModule="dashboard">
                <TestSMTP />
              </ProtectedRoute>
            } 
          />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}