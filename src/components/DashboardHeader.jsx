import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, Mail } from 'lucide-react';

const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

export default function DashboardHeader({ node, typeLabel, onRefresh }) {
  const [spinning, setSpinning] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { user } = useAuth();
  const navigate = useNavigate();
  const m = node.metrics;
  const isTeamUser = user?.role === 'team';

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
      height: '48px', background: 'var(--hdr-bg)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--bdr)', padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '30px', height: '30px',
          background: `linear-gradient(135deg, ${typeColors[node.type] || 'var(--green)'}, var(--blue))`,
          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '11px', color: 'var(--bg)',
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
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isTeamUser && (
          <button
            onClick={() => navigate(`/dashboard/email/${user.scopePath.join('/')}`)}
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
