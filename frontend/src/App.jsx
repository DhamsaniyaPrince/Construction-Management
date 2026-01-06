import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Projects from './pages/Projects';
import Materials from './pages/Materials';
import Attendance from './pages/Attendance';
import Equipment from './pages/Equipment';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';
import Loader from './components/Loader';

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
    <div className="min-h-screen bg-gray-50">
      {token && (
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link to="/" className="text-xl font-bold text-blue-600">
              🏗️ CMS
            </Link>

            <nav className="hidden md:flex gap-6 text-sm text-gray-700">
              <Link to="/" className="hover:text-blue-600">Dashboard</Link>
              <Link to="/projects" className="hover:text-blue-600">Projects</Link>
              <Link to="/materials" className="hover:text-blue-600">Materials</Link>
              <Link to="/attendance" className="hover:text-blue-600">Attendance</Link>
              <Link to="/equipment" className="hover:text-blue-600">Equipment</Link>
              <Link to="/reports" className="hover:text-blue-600">Reports</Link>
            </nav>

            <div className="flex items-center gap-4">
              {user && (
                <span className="hidden sm:inline text-sm text-gray-600">
                  {user.name} ({user.role})
                </span>
              )}
              <button
                onClick={handleLogout}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden border-t px-4 py-2">
            <nav className="flex flex-wrap gap-3 text-xs text-gray-700">
              <Link to="/">Dashboard</Link>
              <Link to="/projects">Projects</Link>
              <Link to="/materials">Materials</Link>
              <Link to="/attendance">Attendance</Link>
              <Link to="/equipment">Equipment</Link>
              <Link to="/reports">Reports</Link>
            </nav>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Routes>

          {/* Home page */}
          <Route
            path="/"
            element={
              token ? (
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              ) : (
                <Auth />   // 👈 Login + Signup on HOME PAGE
              )
            }
          />

          {/* Optional: keep /login as alias */}
          <Route
            path="/login"
            element={token ? <Navigate to="/" replace /> : <Auth />}
          />

          {/* Protected routes */}
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/equipment" element={<ProtectedRoute><Equipment /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>

      </main>
    </div>
  );
};

export default App;
