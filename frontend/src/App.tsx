import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSocketStore } from './store/useSocketStore';

// Primary Customer & Guest Layouts/Pages (Immediate load)
import GuestLayout from './layouts/GuestLayout';
import EntryPoint from './pages/EntryPoint';
import MenuPage from './pages/MenuPage';
import LoginPage from './pages/auth/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy Loaded Operational Pages (Drastically reduces initial JS bundle & load time)
const OrderTrackingPage = lazy(() => import('./pages/guest/OrderTrackingPage'));
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage'));

// Auth Flow
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const OAuthSuccessPage = lazy(() => import('./pages/auth/OAuthSuccessPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Admin Flow
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminMenuPage = lazy(() => import('./pages/admin/AdminMenuPage'));
const AdminTablePage = lazy(() => import('./pages/admin/AdminTablePage'));
const CategoryPage = lazy(() => import('./pages/admin/AdminCategoryPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminEmployeesPage = lazy(() => import('./pages/admin/AdminEmployeesPage'));

// Staff Flow
const WaiterPage = lazy(() => import('./pages/waiter/WaiterPage'));
const KitchenPage = lazy(() => import('./pages/kitchen/KitchenPage'));

const PageLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
    <div className="w-9 h-9 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-3 shadow-lg shadow-orange-500/20" />
    <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Loading Module...</span>
  </div>
);

function App() {
  const connect = useSocketStore(state => state.connect);

  React.useEffect(() => {
    connect();
  }, [connect]);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>

          {/* Guest Flow */}
          <Route element={<GuestLayout />}>
            <Route path="/" element={<EntryPoint />} />
            <Route path="/tracking" element={<OrderTrackingPage />} />
          </Route>
          <Route path="/menu" element={<MenuPage />} />

          {/* Auth Flow */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/oauth-success" element={<OAuthSuccessPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Customer Flow (Protected - CUSTOMER only) */}
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Administration Flow */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboardPage />} />
            <Route path="categories" element={<CategoryPage />} />
            <Route path="menu" element={<AdminMenuPage />} />
            <Route path="tables" element={<AdminTablePage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="employees" element={<AdminEmployeesPage />} />
          </Route>

          {/* Service & Operational Flow */}
          <Route path="/waiter" element={
            <ProtectedRoute allowedRoles={['WAITER', 'KITCHEN', 'ADMIN', 'SUPER_ADMIN']}>
              <WaiterPage />
            </ProtectedRoute>
          } />
          <Route path="/kitchen" element={
            <ProtectedRoute allowedRoles={['KITCHEN', 'WAITER', 'ADMIN', 'SUPER_ADMIN']}>
              <KitchenPage />
            </ProtectedRoute>
          } />

          {/* Fallback 404 Route */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-screen">
              <h1 className="text-4xl font-bold text-gray-800">404</h1>
              <p className="text-gray-500">Trang bạn tìm kiếm không tồn tại.</p>
            </div>
          } />
        </Routes>
      </Suspense>
    </>
  );
}


export default App;
