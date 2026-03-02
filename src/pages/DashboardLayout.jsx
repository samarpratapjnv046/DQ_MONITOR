import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function DashboardLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) return <Navigate to="/" replace />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Sidebar with animated width */}
      <div style={{
        width: sidebarOpen ? 'var(--sidebar-w)' : '0px',
        minWidth: sidebarOpen ? 'var(--sidebar-w)' : '0px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <Sidebar />
      </div>

      {/* Toggle button — always visible */}
      <button
        onClick={() => setSidebarOpen(prev => !prev)}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        style={{
          position: 'absolute',
          left: sidebarOpen ? 'calc(var(--sidebar-w) - 14px)' : '8px',
          top: '58px',
          zIndex: 300,
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: 'var(--card)',
          border: '1px solid var(--bdr)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--t2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--blue-d)';
          e.currentTarget.style.color = 'var(--blue)';
          e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--card)';
          e.currentTarget.style.color = 'var(--t2)';
          e.currentTarget.style.borderColor = 'var(--bdr)';
        }}
      >
        {sidebarOpen
          ? <PanelLeftClose size={14} />
          : <PanelLeftOpen size={14} />
        }
      </button>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <Outlet />
      </div>
    </div>
  );
}
