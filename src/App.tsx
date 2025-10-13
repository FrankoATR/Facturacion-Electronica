// Aplicación principal con routing y protección
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Unauthorized } from './pages/Unauthorized';
import { Clients } from './pages/Clients';
import { Inventory } from './pages/Inventory';
import { Invoicing } from './pages/Invoicing';
import { SalesHistory } from './pages/SalesHistory';

export default function App() {
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
          <Route index element={<Navigate to="/dashboard" replace />} />
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
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}