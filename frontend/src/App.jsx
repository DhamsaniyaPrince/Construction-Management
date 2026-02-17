import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import Loader from './components/Loader';
import Attendance from './pages/Attendance';
import Auth from './pages/Auth';
import ContractorDashboard from './pages/contractor/ContractorDashboard';
import Dashboard from './pages/Dashboard';
import EngineerDashboard from './pages/engineer/EngineerDashboard';
import Equipment from './pages/Equipment';
import Materials from './pages/Materials';
import NotFound from './pages/NotFound';
import Projects from './pages/Projects';
import Reports from './pages/Reports';
import SiteManagerDashboard from './pages/sitemanager/SiteManagerDashboard';
import WorkerAnalytics from './pages/analytics/WorkerAnalytics';
import WorkerDetail from './pages/analytics/WorkerDetail';
import WorkerList from './pages/analytics/WorkerList';
import WorkerDashboard from './pages/worker/WorkerDashboard';

const App = () => {
  const { user, token, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900"> 
      
      {token && (
        <header className="bg-white sticky top-0 z-40 border-b border-gray-200 shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link to="/" className="text-xl font-bold flex items-center gap-2 text-blue-600">
              <span className="text-2xl">🏗️</span> CMS
            </Link>

            <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
              <Link to="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
              {user?.role !== 'worker' && user?.role !== 'contractor' && user?.role !== 'engineer' && (
                <>
                  <Link to="/projects" className="hover:text-blue-600 transition-colors">Projects</Link>
                  <Link to="/materials" className="hover:text-blue-600 transition-colors">Materials</Link>
                  <Link to="/attendance" className="hover:text-blue-600 transition-colors">Attendance</Link>
                  <Link to="/reports" className="hover:text-blue-600 transition-colors">Reports</Link>
                </>
              )}
              {user?.role === 'admin' || user?.role === 'site_manager' || user?.role === 'contractor' ? (
                <>
                  <Link to="/worker-analytics" className="hover:text-blue-600 transition-colors">Worker Analytics</Link>
                  <Link to="/worker-list" className="hover:text-blue-600 transition-colors">Worker Directory</Link>
                </>
              ) : null}
            </nav>

            <div className="flex items-center gap-6">
              {user && (
                <span className="hidden sm:inline text-sm text-gray-500">
                  {user.name} <span className="text-xs text-gray-400">({user.role})</span>
                </span>
              )}
              <button
                onClick={handleLogout}
                className="btn bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded font-medium shadow-sm transition-colors"
                style={{ backgroundColor: '#DC2626', color: 'white' }} 
              >
                Logout
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          {/* Home Node - Role Based Redirection */}
          <Route
            path="/"
            element={
              token ? (
                <ProtectedRoute>
                  {user?.role === 'worker' ? <WorkerDashboard /> : 
                   user?.role === 'contractor' ? <ContractorDashboard /> : 
                   user?.role === 'engineer' ? <EngineerDashboard /> :
                   user?.role === 'site_manager' ? <SiteManagerDashboard /> :
                   <Dashboard />}
                </ProtectedRoute>
              ) : (
                <Auth />
              )
            }
          />

          <Route
            path="/login"
            element={token ? <Navigate to="/" replace /> : <Auth />}
          />

          {/* Protected routes */}
          <Route path="/worker-dashboard" element={<ProtectedRoute><WorkerDashboard /></ProtectedRoute>} />
          <Route path="/contractor-dashboard" element={<ProtectedRoute><ContractorDashboard /></ProtectedRoute>} />
          <Route path="/engineer-dashboard" element={<ProtectedRoute><EngineerDashboard /></ProtectedRoute>} />
          <Route path="/site-manager-dashboard" element={<ProtectedRoute><SiteManagerDashboard /></ProtectedRoute>} />
          
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/equipment" element={<ProtectedRoute><Equipment /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/worker-analytics" element={<ProtectedRoute><WorkerAnalytics /></ProtectedRoute>} />
          <Route path="/worker-list" element={<ProtectedRoute><WorkerList /></ProtectedRoute>} />
          <Route path="/worker-analytics/:id" element={<ProtectedRoute><WorkerDetail /></ProtectedRoute>} />

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
