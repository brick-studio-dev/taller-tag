import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClientesPage from './pages/ClientesPage'
import ClienteDetallePage from './pages/ClienteDetallePage'
import VehiculosPage from './pages/VehiculosPage'
import VehiculoDetallePage from './pages/VehiculoDetallePage'
import ReparacionesPage from './pages/ReparacionesPage'
import ReparacionDetallePage from './pages/ReparacionDetallePage'
import NuevaReparacionPage from './pages/NuevaReparacionPage'

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )
  return session ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index                              element={<DashboardPage />} />
        <Route path="clientes"                    element={<ClientesPage />} />
        <Route path="clientes/:id"                element={<ClienteDetallePage />} />
        <Route path="vehiculos"                   element={<VehiculosPage />} />
        <Route path="vehiculos/:id"               element={<VehiculoDetallePage />} />
        <Route path="reparaciones"                element={<ReparacionesPage />} />
        <Route path="reparaciones/nueva"          element={<NuevaReparacionPage />} />
        <Route path="reparaciones/:id"            element={<ReparacionDetallePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
