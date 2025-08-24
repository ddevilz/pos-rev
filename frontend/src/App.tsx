import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect, Suspense, lazy } from 'react'
import type { RootState } from './store'
import { setupSessionMonitoring } from './lib/auth'

// Layout Components
import AuthLayout from './components/layout/AuthLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/common/ProtectedRoute'

// Page Components (lazy-loaded)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const CategoriesPage = lazy(() => import('./pages/categories/CategoriesPage'))
const ServicesPage = lazy(() => import('./pages/services/ServicesPage'))
const OrdersPage = lazy(() => import('./pages/orders/OrdersPage'))
const CustomersPage = lazy(() => import('./pages/customers/CustomersPage'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))
const NewOrderPage = lazy(() => import('./pages/NewOrderPage'))

function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  // Set up session monitoring
  useEffect(() => {
    const cleanup = setupSessionMonitoring()
    return cleanup
  }, [])

  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <Routes>
      {/* Public Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route index element={<Navigate to="/auth/login" replace />} />
      </Route>

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/new" element={<NewOrderPage />} />
          <Route path="customers" element={<CustomersPage />} />
          {/* <Route path="invoices" element={<InvoicesPage />} />
          <Route path="reports" element={<ReportsPage />} /> */}
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Redirect based on auth status */}
      <Route 
        path="*" 
        element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Navigate to="/auth/login" replace />
        } 
      />
      </Routes>
    </Suspense>
  )
}

export default App