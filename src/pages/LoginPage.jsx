import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Mail, Lock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { users } from '../data/orgStructure';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showCreds, setShowCreds] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const quickLogin = (u) => {
    setEmail(u.email);
    setPassword(u.password);
  };

  const grouped = {
    org: users.filter(u => u.role === 'org'),
    domain: users.filter(u => u.role === 'domain'),
    bu: users.filter(u => u.role === 'bu'),
    team: users.filter(u => u.role === 'team'),
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', position: 'relative', overflow: 'auto',
    }}>
      <div style={{
        position: 'fixed', top: '-300px', left: '-300px', width: '800px', height: '800px',
        background: 'radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed', bottom: '-300px', right: '-300px', width: '800px', height: '800px',
        background: 'radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)', pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', gap: '24px', maxWidth: '900px', width: '100%', padding: '24px', zIndex: 1 }}>
        {/* Login Card */}
        <div style={{
          flex: '0 0 380px', background: 'var(--card)', border: '1px solid var(--bdr)',
          borderRadius: '16px', padding: '40px 32px', animation: 'fadeUp 0.5s ease forwards', opacity: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '42px', height: '42px', background: 'linear-gradient(135deg, var(--green), var(--blue))',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={20} color="var(--bg)" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>Data Quality Monitor</div>
              <div style={{ fontSize: '11px', color: 'var(--t3)' }}>ADA Global · Enterprise</div>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--t2)', marginBottom: '28px', lineHeight: 1.5 }}>
            Sign in with your organizational email to access data quality dashboards.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '6px' }}>Email</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)',
                border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', padding: '10px 12px',
              }}>
                <Mail size={14} color="var(--t3)" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="email@datacore.com" required
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: 'var(--t1)', fontFamily: 'var(--sans)', fontSize: '13px',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '6px' }}>Password</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)',
                border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', padding: '10px 12px',
              }}>
                <Lock size={14} color="var(--t3)" />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password" required
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: 'var(--t1)', fontFamily: 'var(--sans)', fontSize: '13px',
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--red-d)',
                border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--rs)',
                padding: '8px 12px', marginBottom: '14px', fontSize: '12px', color: 'var(--red)',
              }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" style={{
              width: '100%', padding: '12px', background: 'linear-gradient(135deg, var(--green), #2dd4a8)',
              color: 'var(--bg)', border: 'none', borderRadius: 'var(--rs)',
              fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              Sign In
            </button>
          </form>
        </div>

        {/* Credentials Reference */}
        <div style={{
          flex: 1, background: 'var(--card)', border: '1px solid var(--bdr)',
          borderRadius: '16px', padding: '24px', overflow: 'auto', maxHeight: '85vh',
          animation: 'fadeUp 0.5s ease forwards', animationDelay: '0.1s', opacity: 0,
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: showCreds ? '16px' : '0' }}
            onClick={() => setShowCreds(!showCreds)}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>🔑 Demo Credentials</div>
              <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '2px' }}>Click any row to auto-fill</div>
            </div>
            {showCreds ? <ChevronUp size={16} color="var(--t3)" /> : <ChevronDown size={16} color="var(--t3)" />}
          </div>

          {showCreds && Object.entries(grouped).map(([role, roleUsers]) => (
            <div key={role} style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px',
                color: role === 'org' ? 'var(--green)' : role === 'domain' ? 'var(--blue)' : role === 'bu' ? 'var(--purple)' : 'var(--cyan)',
                marginBottom: '6px', padding: '4px 0',
              }}>
                {role === 'org' ? '🏢 Organization' : role === 'domain' ? '🌐 Domain' : role === 'bu' ? '📊 Business Unit' : '👥 Team'}
              </div>
              {roleUsers.map(u => (
                <div
                  key={u.email}
                  onClick={() => quickLogin(u)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
                    background: email === u.email ? 'var(--blue-d)' : 'var(--elev)',
                    border: `1px solid ${email === u.email ? 'rgba(96,165,250,0.3)' : 'var(--bdr)'}`,
                    borderRadius: '6px', marginBottom: '4px', cursor: 'pointer',
                    transition: 'all 0.15s', fontSize: '10.5px',
                  }}
                >
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--t1)', fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.email}
                  </span>
                  <span style={{ color: 'var(--t3)', fontSize: '9px', flexShrink: 0 }}>{u.password}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
