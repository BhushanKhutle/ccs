import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'
import ProtectedRoute from '@/components/ProtectedRoute'

// Layouts
import CustomerLayout from '@/components/customer/CustomerLayout'

// Pages
import LoginPage     from '@/pages/Login'
import HomePage      from '@/pages/customer/Home'
import ChefPortal    from '@/pages/chef/ChefPortal'
import DeliveryPortal from '@/pages/delivery/DeliveryPortal'
import AdminPortal   from '@/pages/admin/AdminPortal'

// Lazy imports (code splitting)
import { lazy, Suspense } from 'react'
import { Spinner } from '@/components/ui'

const CatalogPage   = lazy(() => import('@/pages/customer/Catalog'))
const ProductPage   = lazy(() => import('@/pages/customer/ProductDetail'))
const CheckoutPage  = lazy(() => import('@/pages/customer/Checkout'))
const TrackPage     = lazy(() => import('@/pages/customer/Track'))
const AccountPage   = lazy(() => import('@/pages/customer/Account'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function AppRoutes() {
  const { user, isAuthenticated } = useAuthStore()

  // Auto-redirect logged-in users to their portal
  function RootRedirect() {
    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (user?.role === 'chef')  return <Navigate to="/chef"     replace />
    if (user?.role === 'agent') return <Navigate to="/delivery" replace />
    if (user?.role === 'admin') return <Navigate to="/admin"    replace />
    return <Navigate to="/home" replace />
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/"      element={<RootRedirect />} />

        {/* Customer */}
        <Route element={<ProtectedRoute allowedRoles={['customer']}><CustomerLayout /></ProtectedRoute>}>
          <Route path="/home"           element={<HomePage />} />
          <Route path="/catalog"        element={<CatalogPage />} />
          <Route path="/product/:id"    element={<ProductPage />} />
          <Route path="/checkout"       element={<CheckoutPage />} />
          <Route path="/track"          element={<TrackPage />} />
          <Route path="/account"        element={<AccountPage />} />
        </Route>

        {/* Staff portals */}
        <Route path="/chef" element={
          <ProtectedRoute allowedRoles={['chef', 'admin']}>
            <ChefPortal />
          </ProtectedRoute>
        } />
        <Route path="/delivery" element={
          <ProtectedRoute allowedRoles={['agent', 'admin']}>
            <DeliveryPortal />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPortal />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#2A1239',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 18px',
              fontSize: '13.5px',
              fontFamily: '"DM Sans", sans-serif',
            },
            success: { iconTheme: { primary: '#1A7F5A', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#B5292B', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
