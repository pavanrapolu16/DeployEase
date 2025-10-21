import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { FaRocket, FaBars, FaTimes, FaUser, FaGithub, FaCode, FaServer, FaCog, FaFileAlt } from 'react-icons/fa';
import { useAuth } from "../../contexts/AuthContext";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname.endsWith(path) || (path === 'overview' && (location.pathname === '/dashboard' || location.pathname === '/dashboard/'));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Topbar */}
      <header className="bg-white shadow-sm border-b px-4 py-4 md:px-6 flex justify-between items-center z-40">
        <div className="flex items-center space-x-4">
          <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-primary-600">
            {showSidebar ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
          <h1 className="text-xl font-bold text-primary-600 flex items-center space-x-2">
            <FaRocket className="text-primary-500" />
            <span>DeployEase</span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700 font-medium hidden sm:block">Welcome, {user?.firstName || user?.name || 'User'}</span>
          <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1">
            <FaUser />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Overlay for mobile */}
      {showSidebar && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setShowSidebar(false)} />}

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-64 bg-white/90 backdrop-blur-md shadow-xl border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-lg p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-primary-600">Menu</h2>
            <button onClick={() => setShowSidebar(false)} className="md:hidden p-1 rounded-lg hover:bg-gray-100">
              <FaTimes size={18} className="text-gray-500" />
            </button>
          </div>
          <nav className="space-y-2">
            <Link to="/dashboard/overview" className={`w-full block py-2 px-3 rounded-lg flex items-center space-x-3 transition-colors ${isActive('overview') ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-100'}`} onClick={() => setShowSidebar(false)}>
              <FaUser size={18} />
              <span>Overview</span>
            </Link>
            <Link to="/dashboard/repositories" className={`w-full block py-2 px-3 rounded-lg flex items-center space-x-3 transition-colors ${isActive('repositories') ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-100'}`} onClick={() => setShowSidebar(false)}>
              <FaGithub size={18} />
              <span>Repositories</span>
            </Link>
            <Link to="/dashboard/projects" className={`w-full block py-2 px-3 rounded-lg flex items-center space-x-3 transition-colors ${isActive('projects') ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-100'}`} onClick={() => setShowSidebar(false)}>
              <FaCode size={18} />
              <span>My Projects</span>
            </Link>
            <Link to="/dashboard/logs" className={`hidden w-full block py-2 px-3 rounded-lg flex items-center space-x-3 transition-colors ${isActive('logs') ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-100'}`} onClick={() => setShowSidebar(false)}>
              <FaFileAlt size={18} />
              <span>Logs</span>
            </Link>
            <Link to="/dashboard/settings" className={`w-full block py-2 px-3 rounded-lg flex items-center space-x-3 transition-colors ${isActive('settings') ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-100'}`} onClick={() => setShowSidebar(false)}>
              <FaCog size={18} />
              <span>Settings</span>
            </Link>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
