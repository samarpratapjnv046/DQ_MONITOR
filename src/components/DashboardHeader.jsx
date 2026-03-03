import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, Mail, Search, GitBranch, User, Clock } from 'lucide-react';

const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

export default function DashboardHeader({ node, typeLabel, onRefresh }) {
  const [spinning, setSpinning] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const m = node.metrics;
  const isTeamUser = user?.role === 'team';
  const isSchemaLevel = node.type === 'schema';

  // Build current path for drill-down navigation
  const currentPath = location.pathname.replace('/dashboard/', '').replace('/dashboard', '');

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => {
      const now = new Date();
      setCurrentDate(now);
      setSpinning(false);
      onRefresh?.();
    }, 1200);
  };

  const typeColors = {
    org: 'var(--green)', domain: 'var(--blue)',
    bu: 'var(--purple)', team: 'var(--cyan)', project: 'var(--amber)', schema: '#f472b6',
  };

  return (
    <div style={{
      minHeight: '48px', background: 'var(--hdr-bg)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--bdr)', padding: '6px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Left: title & metadata */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '30px', height: '30px',
          background: `linear-gradient(135deg, ${typeColors[node.type] || 'var(--green)'}, var(--blue))`,
          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '11px', color: 'var(--bg)', flexShrink: 0,
        }}>
          DQ
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>
            {node.emoji ? `${node.emoji} ` : ''}{node.name}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--t2)' }}>
            {typeLabel} · {node.totalTables || m.totalTables} Tables · {m.totalRules} Rules
          </div>
          {isSchemaLevel && node.owner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                background: 'rgba(167,139,250,0.1)', color: '#A78BFA',
              }}>
                <User size={9} /> Owner: {node.owner}
              </span>
              {node.users && node.users.length > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                  background: 'rgba(34,211,238,0.1)', color: '#22D3EE',
                }}>
                  <User size={9} /> Users: {node.users.join(', ')}
                </span>
              )}
              {node.createdAt && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                  background: 'rgba(96,165,250,0.1)', color: '#60A5FA',
                }}>
                  <Clock size={9} /> Created: {node.createdAt}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isSchemaLevel && (
          <button
            onClick={() => navigate(`/dashboard/rulemapping/${currentPath}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', fontWeight: 600, color: 'var(--purple)',
              background: 'var(--purple-d)', padding: '6px 12px', borderRadius: '6px',
              border: '1px solid rgba(167,139,250,0.25)', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--purple-d)'; }}
          >
            <GitBranch size={13} /> Rule Mapping
          </button>
        )}
        {isSchemaLevel && (
          <button
            onClick={() => navigate(`/dashboard/drilldown/${currentPath}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', fontWeight: 600, color: 'var(--cyan)',
              background: 'var(--cyan-d)', padding: '6px 12px', borderRadius: '6px',
              border: '1px solid rgba(34,211,238,0.25)', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--cyan-d)'; }}
          >
            <Search size={13} /> Drill Down
          </button>
        )}
        {(isTeamUser || user?.role === 'project') && (
          <button
            onClick={() => navigate(`/dashboard/email/${currentPath}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', fontWeight: 600, color: 'var(--amber)',
              background: 'var(--amber-d)', padding: '6px 12px', borderRadius: '6px',
              border: '1px solid rgba(251,191,36,0.25)', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,191,36,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--amber-d)'; }}
          >
            <Mail size={13} /> Email Alerts
          </button>
        )}
        <button
          onClick={handleRefresh}
          disabled={spinning}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '11px', fontWeight: 600, color: spinning ? 'var(--blue)' : 'var(--t2)',
            background: spinning ? 'var(--blue-d)' : 'var(--card)',
            padding: '6px 12px', borderRadius: '6px',
            border: `1px solid ${spinning ? 'rgba(96,165,250,0.3)' : 'var(--bdr)'}`,
            cursor: spinning ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={13} style={{ animation: spinning ? 'spin 0.8s linear infinite' : 'none' }} />
          {spinning ? 'Refreshing...' : 'Refresh'}
        </button>
        <div style={{
          fontSize: '10.5px', color: 'var(--t2)', background: 'var(--card)',
          padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--bdr)',
          fontFamily: 'var(--mono)',
        }}>
          {m.duration}
        </div>
        <div style={{
          fontSize: '10.5px', color: 'var(--t2)', background: 'var(--card)',
          padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--bdr)',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{
            width: '6px', height: '6px', background: 'var(--green)',
            borderRadius: '50%', animation: 'pulse 2s infinite',
          }} />
          {formatDate(currentDate)} · {formatTime(currentDate)}
        </div>
      </div>
    </div>
  );
}
