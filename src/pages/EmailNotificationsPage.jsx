import { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { findNode } from '../data/orgStructure';
import organization from '../data/orgStructure';
import { ArrowLeft, X, Building2, Globe, Briefcase, Users, FolderOpen, Database, Shield } from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════
function Toast({ msg, type, visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, background: 'var(--card)',
      border: `1px solid ${type === 'error' ? 'var(--red)' : 'var(--green)'}`,
      borderRadius: 'var(--rs)', padding: '12px 20px',
      color: type === 'error' ? 'var(--red)' : 'var(--green)',
      fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
      zIndex: 999, transform: visible ? 'translateY(0)' : 'translateY(80px)',
      opacity: visible ? 1 : 0, transition: 'all 0.3s', pointerEvents: visible ? 'auto' : 'none',
    }}>
      {type === 'error' ? '✕' : '✓'} {msg}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TOGGLE
// ══════════════════════════════════════════════════════════════
function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      width: 40, height: 22, background: on ? 'var(--green)' : 'var(--bdr)',
      borderRadius: 11, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.2s',
      }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// THRESHOLD CARD
// ══════════════════════════════════════════════════════════════
function ThresholdCard({ label, color, value, onChange }) {
  return (
    <div style={{
      background: 'var(--bg)', border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', padding: 12,
      transition: 'border-color 0.2s',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t2)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="number" min={0} max={100} value={value}
          onChange={e => onChange(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
          style={{
            background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 5,
            padding: '8px 10px', color: 'var(--t1)', fontFamily: 'var(--mono)',
            fontSize: 16, fontWeight: 700, width: 80, textAlign: 'center', outline: 'none',
          }}
        />
        <span style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>%</span>
      </div>
      <input type="range" min={0} max={100} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: '100%', marginTop: 8, accentColor: color, height: 4 }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function EmailNotificationsPage() {
  const { '*': pathParam } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const segments = pathParam?.split('/').filter(Boolean) || user?.scopePath || [];
  const node = findNode(segments);

  // ── State ──
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alwaysSend, setAlwaysSend] = useState(false);
  const [thresholds, setThresholds] = useState({ health: 90, schema: 85, dq: 95 });
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Akash', email: 'akash@company.com', type: 'sender', role: 'none' },
    { id: 2, name: 'DQ Alerts', email: 'dq-alerts@company.com', type: 'sender', role: 'none' },
    { id: 3, name: 'Ravi Kumar', email: 'ravi.kumar@company.com', type: 'receiver', role: 'to' },
    { id: 4, name: 'Data Engineering', email: 'data-eng@company.com', type: 'receiver', role: 'to' },
    { id: 5, name: 'Priya Sharma', email: 'priya.sharma@company.com', type: 'receiver', role: 'cc' },
    { id: 6, name: 'Management', email: 'management@company.com', type: 'receiver', role: 'bcc' },
  ]);
  const [nextId, setNextId] = useState(7);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addType, setAddType] = useState('receiver');
  const [composeTab, setComposeTab] = useState('template');
  const [customSubject, setCustomSubject] = useState('⚠ Data Quality Alert — MAPPED_DATA — {{run_date}}');
  const [lastSaved, setLastSaved] = useState('Never');
  const [toast, setToast] = useState({ msg: '', type: '', visible: false });

  const scopeName = node?.name || 'MAPPED_DATA';

  // ── Build hierarchy to get owner names ──
  const hierarchy = (() => {
    let current = organization;
    const items = [];
    for (const seg of segments) {
      const child = current.children?.find(c => c.id === seg);
      if (!child) break;
      items.push(child);
      current = child;
    }
    return items;
  })();

  const teamNode = hierarchy.find(n => n.type === 'team');
  const projectNode = hierarchy.find(n => n.type === 'project');
  const schemaNode = hierarchy.find(n => n.type === 'schema');

  const teamOwner = teamNode?.owner || null;
  const projectOwner = projectNode?.owner || null;
  const schemaOwner = schemaNode?.owner || null;

  // ── Context-aware: show info for the CURRENT node level ──
  const nodeType = node?.type || 'schema';
  const contextOwner = nodeType === 'team' ? teamOwner : nodeType === 'project' ? projectOwner : schemaOwner;
  const contextName = node?.name || scopeName;
  const contextLabel = nodeType === 'team' ? 'Team' : nodeType === 'project' ? 'Project' : 'Schema';
  const contextColor = nodeType === 'team' ? 'var(--cyan)' : nodeType === 'project' ? 'var(--amber)' : '#f472b6';
  const ContextIcon = nodeType === 'team' ? Users : nodeType === 'project' ? FolderOpen : Database;

  // Build subject/body label based on current scope
  const emailScopeLabel = contextName;

  // Real failing tables from the node's metrics
  const failingTables = node?.metrics?.failingTables || [];

  const showToast = useCallback((msg, type = '') => {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }, []);

  // ── Contacts ──
  const addContact = () => {
    const email = addEmail.trim();
    if (!email) { showToast('Please enter an email address', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Please enter a valid email', 'error'); return; }
    if (contacts.find(c => c.email === email)) { showToast('This email already exists', 'error'); return; }
    setContacts(prev => [...prev, {
      id: nextId, name: addName.trim() || email.split('@')[0], email,
      type: addType, role: addType === 'receiver' ? 'to' : 'none',
    }]);
    setNextId(n => n + 1);
    setAddName(''); setAddEmail('');
    showToast(`Added ${email} as ${addType}`);
  };

  const removeContact = (id) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    showToast('Contact removed');
  };

  const changeRole = (id, role) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, role } : c));
  };

  // ── Editor commands ──
  const execCmd = (cmd) => document.execCommand(cmd, false, null);
  const insertVar = (name) => document.execCommand('insertText', false, `{{${name}}}`);

  const resetEditor = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = `<p><b>Data Quality Alert Report</b></p><p style="font-size:11px;color:var(--t3)">${scopeName} · Snowflake · Run: {{run_date}} at {{run_time}}</p><br><p>Hi Team,</p><p>The latest data quality validation has completed. One or more thresholds were breached:</p><br><p><b>Overall Health Score:</b> {{health_score}} (threshold: ${thresholds.health}%)</p><p><b>Schema Validation:</b> {{schema_score}}</p><p><b>Data Quality Rules:</b> {{dq_score}}</p><br><p><b>Top failing table:</b> {{fail_table_1}} with {{fail_count_1}} failures</p><br><p>Please review the dashboard for full details.</p><br><p style="font-size:11px;color:var(--t3)">— Data Quality Monitor (Automated)</p>`;
    }
    setCustomSubject(`⚠ Data Quality Alert — ${scopeName} — {{run_date}}`);
    showToast('Editor reset to default template');
  };

  // ── Actions ──
  const sendTest = () => {
    const receivers = contacts.filter(c => c.type === 'receiver' && c.role !== 'none');
    if (!receivers.length) { showToast('Add at least one receiver with TO/CC/BCC role', 'error'); return; }
    const senders = contacts.filter(c => c.type === 'sender');
    if (!senders.length) { showToast('Add at least one sender email', 'error'); return; }
    showToast(`Test email sent to ${receivers.length} recipient(s)!`);
  };

  const previewEmail = () => showToast('Preview filled with sample data from latest run');

  const saveConfig = () => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setLastSaved(`Today at ${now}`);
    showToast('Configuration saved to email_notification_config.json');
  };

  // ── Styles ──
  const pnl = { background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: 20, marginBottom: 14 };
  const pnlT = { fontSize: 13, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 };
  const pnlSub = { fontSize: 11, color: 'var(--t3)', marginBottom: 16 };
  const toggleRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--elev)', borderRadius: 'var(--rs)', marginBottom: 10 };
  const cInp = { flex: 1, background: 'var(--bg)', border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', padding: '9px 12px', color: 'var(--t1)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none' };
  const cSel = { background: 'var(--bg)', border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', padding: '9px 10px', color: 'var(--t2)', fontFamily: 'var(--sans)', fontSize: 11, outline: 'none', cursor: 'pointer', minWidth: 100 };
  const roleColors = { to: { bg: 'var(--green-d)', color: 'var(--green)', bdr: 'rgba(52,211,153,0.25)' }, cc: { bg: 'var(--blue-d)', color: 'var(--blue)', bdr: 'rgba(96,165,250,0.25)' }, bcc: { bg: 'var(--purple-d)', color: 'var(--purple)', bdr: 'rgba(167,139,250,0.25)' }, none: { bg: 'var(--elev)', color: 'var(--t3)', bdr: 'var(--bdr)' } };

  const senders = contacts.filter(c => c.type === 'sender');
  const receivers = contacts.filter(c => c.type === 'receiver');

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        height: 48, background: 'var(--hdr-bg)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--bdr)', padding: '0 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, background: 'linear-gradient(135deg, var(--amber), var(--red))',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 12, color: 'var(--bg)',
          }}>✉</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Email Notification Settings</div>
            <div style={{ fontSize: 10.5, color: 'var(--t2)' }}>{scopeName} · Threshold Alerts · Automated Reports</div>
          </div>
        </div>
        <button onClick={() => navigate(`/dashboard/${segments.join('/')}`)} style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t2)',
          background: 'var(--card)', padding: '6px 14px', borderRadius: 6,
          border: '1px solid var(--bdr)', cursor: 'pointer', transition: 'all 0.2s',
        }}>
          <ArrowLeft size={13} /> Back to Dashboard
        </button>
      </div>

      {/* Main scrollable area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 28px 24px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>

        {/* ═══ Section 1: Thresholds ═══ */}
        <div className="anim d1" style={pnl}>
          <div style={pnlT}>⚑ Alert Thresholds — When Should Emails Be Sent?</div>
          <div style={pnlSub}>Set the minimum pass rate for each validation layer. If any score drops below its threshold after a run, an alert email is automatically sent.</div>

          <div style={toggleRow}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Enable Automated Email Alerts</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>Sends email when any threshold is breached after each validation run</div>
            </div>
            <Toggle on={alertEnabled} onToggle={() => setAlertEnabled(v => !v)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <ThresholdCard label="Overall Health Score Minimum" color="var(--green)"
              value={thresholds.health} onChange={v => setThresholds(t => ({ ...t, health: v }))} />
            <ThresholdCard label="Data Type Check Validation Minimum" color="var(--purple)"
              value={thresholds.schema} onChange={v => setThresholds(t => ({ ...t, schema: v }))} />
            <ThresholdCard label="Data Quality Check Rules Minimum" color="var(--blue)"
              value={thresholds.dq} onChange={v => setThresholds(t => ({ ...t, dq: v }))} />
          </div>

          <div style={{ ...toggleRow, marginBottom: 0 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Send Email Even When All Thresholds Pass</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>Sends a summary report after every validation run regardless of results</div>
            </div>
            <Toggle on={alwaysSend} onToggle={() => setAlwaysSend(v => !v)} />
          </div>
        </div>

        {/* ═══ Owner Info Panel — Hierarchical ═══ */}
        <div className="anim d0" style={{ ...pnl, marginBottom: 14, background: 'var(--card)' }}>
          <div style={pnlT}><Shield size={14} color="var(--green)" /> Ownership Hierarchy</div>
          <div style={pnlSub}>Responsible owners for the current scope: <strong style={{ color: 'var(--t1)' }}>{contextName}</strong></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Build chain: always start with team, then project if applicable, then schema if applicable */}
            {[
              teamOwner && { owner: teamOwner, name: teamNode?.name, label: 'Team', color: 'var(--cyan)', Icon: Users },
              (nodeType === 'project' || nodeType === 'schema') && projectOwner && { owner: projectOwner, name: projectNode?.name, label: 'Project', color: 'var(--amber)', Icon: FolderOpen },
              nodeType === 'schema' && schemaOwner && { owner: schemaOwner, name: schemaNode?.name, label: 'Schema', color: '#f472b6', Icon: Database },
            ].filter(Boolean).map((item, idx, arr) => (
              <div key={idx}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', marginLeft: idx * 28,
                  background: idx === arr.length - 1 ? 'var(--elev)' : 'var(--bg)',
                  border: `1px solid ${idx === arr.length - 1 ? item.color + '40' : 'var(--bdr)'}`,
                  borderRadius: 'var(--rs)',
                  position: 'relative',
                }}>
                  {/* Connector line */}
                  {idx > 0 && (
                    <div style={{
                      position: 'absolute', left: -14, top: -1, width: 14, height: '50%',
                      borderLeft: '2px solid var(--bdr)', borderBottom: '2px solid var(--bdr)',
                      borderRadius: '0 0 0 6px',
                    }} />
                  )}
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${item.color}15`, border: `1px solid ${item.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: item.color, flexShrink: 0,
                  }}>
                    {item.owner.charAt(0)}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{item.owner}</div>
                    <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 1 }}>{item.name}</div>
                  </div>
                  {/* Badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 8.5, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                    background: `${item.color}12`, color: item.color,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    <item.Icon size={9} /> {item.label}
                  </div>
                </div>
                {/* Spacing between rows */}
                {idx < arr.length - 1 && <div style={{ height: 6 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Section 2: Email Compose ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>

          {/* Email Compose */}
          <div className="anim d3" style={pnl}>
            <div style={pnlT}>✉ Email Template — Format & Content</div>
            <div style={pnlSub}>
              Use the standard template or customize. Variables like{' '}
              <code style={{ fontFamily: 'var(--mono)', fontSize: 10, background: 'var(--blue-d)', color: 'var(--blue)', padding: '1px 5px', borderRadius: 3 }}>{'{{health_score}}'}</code>{' '}
              auto-fill from the latest validation run.
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', padding: 3, marginBottom: 14, width: 'fit-content' }}>
              {['template', 'custom'].map(tab => (
                <div key={tab} onClick={() => setComposeTab(tab)} style={{
                  padding: '7px 16px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  color: composeTab === tab ? 'var(--t1)' : 'var(--t3)',
                  background: composeTab === tab ? 'var(--elev)' : 'transparent',
                  transition: 'all 0.15s',
                }}>
                  {tab === 'template' ? 'Standard Template' : 'Custom Editor'}
                </div>
              ))}
            </div>

            {/* Standard Template Preview */}
            {composeTab === 'template' && (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', overflow: 'hidden' }}>
                <div style={{ background: 'var(--elev)', padding: '10px 14px', borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {['var(--red)', 'var(--amber)', 'var(--green)'].map((c, i) => (
                    <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  ))}
                  <span style={{ fontSize: 11, color: 'var(--t2)', fontFamily: 'var(--mono)', marginLeft: 8 }}>
                    Subject: ⚠ Data Quality Alert — {emailScopeLabel} ({contextLabel}) — {'{{run_date}}'}
                  </span>
                </div>
                <div style={{ padding: 20, fontSize: 12, lineHeight: 1.7, color: 'var(--t2)' }}>
                  <div style={{ color: 'var(--t1)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Data Quality Alert Report</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>
                    {contextLabel}: <strong style={{ color: contextColor }}>{contextName}</strong> · Owner: <strong style={{ color: 'var(--t1)' }}>{contextOwner || 'Unassigned'}</strong> · Snowflake
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 14 }}>
                    Run: <Tag>{'{{run_date}}'}</Tag> at <Tag>{'{{run_time}}'}</Tag> · Duration: <Tag>{'{{duration}}'}</Tag>
                  </div>

                  <h3 style={{ color: 'var(--t1)', fontSize: 13, margin: '14px 0 6px' }}>⚑ Threshold Breach Summary</h3>
                  <div style={{ marginBottom: 8 }}>The following scores fell <strong style={{ color: 'var(--red)' }}>below</strong> their configured thresholds:</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0 12px', fontSize: 11 }}>
                    <thead><tr>{['Metric', 'Threshold', 'Actual', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 10px', background: 'var(--elev)', color: 'var(--t3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--bdr)' }}>{h}</th>
                    ))}</tr></thead>
                    <tbody>
                      <tr><Td>Overall Health Score</Td><Td>90.0%</Td><Td><Metric c="red">{'{{health_score}}'}</Metric></Td><Td style={{ color: 'var(--red)' }}>✕ BREACH</Td></tr>
                      <tr><Td>Schema Validation</Td><Td>85.0%</Td><Td><Metric c="red">{'{{schema_score}}'}</Metric></Td><Td style={{ color: 'var(--red)' }}>✕ BREACH</Td></tr>
                      <tr><Td>Data Quality Check</Td><Td>95.0%</Td><Td><Metric c="red">{'{{dq_score}}'}</Metric></Td><Td style={{ color: 'var(--red)' }}>✕ BREACH</Td></tr>
                    </tbody>
                  </table>

                  <h3 style={{ color: 'var(--t1)', fontSize: 13, margin: '14px 0 6px' }}>◎ Validation Summary</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0 12px', fontSize: 11 }}>
                    <thead><tr>{['Layer', 'Passed', 'Failed', 'Pass Rate'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 10px', background: 'var(--elev)', color: 'var(--t3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--bdr)' }}>{h}</th>
                    ))}</tr></thead>
                    <tbody>
                      <tr><Td>Data Type Check</Td><Td><Tag>{'{{schema_passed}}'}</Tag></Td><Td><Tag>{'{{schema_failed}}'}</Tag></Td><Td>{'{{schema_score}}'}</Td></tr>
                      <tr><Td>Table Integrity Rules</Td><Td><Tag>{'{{table_passed}}'}</Tag></Td><Td><Tag>{'{{table_failed}}'}</Tag></Td><Td>{'{{table_score}}'}</Td></tr>
                      <tr><Td>Data Quality Check</Td><Td><Tag>{'{{dq_passed}}'}</Tag></Td><Td><Tag>{'{{dq_failed}}'}</Tag></Td><Td>{'{{dq_score}}'}</Td></tr>
                    </tbody>
                  </table>

                  <h3 style={{ color: 'var(--t1)', fontSize: 13, margin: '14px 0 6px' }}>⊿ Top Failing Tables</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0 12px', fontSize: 11 }}>
                    <thead><tr>{['Table', 'Failures', 'Severity'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 10px', background: 'var(--elev)', color: 'var(--t3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--bdr)' }}>{h}</th>
                    ))}</tr></thead>
                    <tbody>
                      {failingTables.slice(0, 3).map((ft, i) => (
                        <tr key={i}><Td><span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{ft.name}</span></Td><Td>{ft.severity === 'Critical' ? '5+' : ft.severity === 'Error' ? '3–5' : '1–2'} failures</Td><Td><span style={{ color: ft.severity === 'Critical' ? 'var(--red)' : ft.severity === 'Error' ? 'var(--amber)' : 'var(--blue)' }}>{ft.severity}</span></Td></tr>
                      ))}
                      {failingTables.length === 0 && (
                        <tr><Td colSpan={3} style={{ textAlign: 'center', color: 'var(--t3)' }}>No failing tables</Td></tr>
                      )}
                    </tbody>
                  </table>

                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--bdr)', fontSize: 10, color: 'var(--t3)' }}>
                    This is an automated alert from the Data Quality Monitor.<br />
                    View full details: <span style={{ color: 'var(--blue)', textDecoration: 'underline' }}>{'{{dashboard_url}}'}</span><br /><br />
                    To change alert settings, update thresholds and recipients in the Email Notification Settings page.
                  </div>
                </div>
              </div>
            )}

            {/* Custom Editor */}
            {composeTab === 'custom' && (
              <div>
                {/* Toolbar */}
                <div style={{ display: 'flex', gap: 4, padding: '8px 10px', background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 'var(--rs) var(--rs) 0 0', flexWrap: 'wrap' }}>
                  {[
                    { label: <b>B</b>, cmd: 'bold' }, { label: <i>I</i>, cmd: 'italic' }, { label: <u>U</u>, cmd: 'underline' },
                    'sep',
                    { label: '• List', cmd: 'insertUnorderedList' }, { label: '1. List', cmd: 'insertOrderedList' },
                    'sep',
                    { label: '+ Health Score', var: 'health_score' }, { label: '+ Schema', var: 'schema_score' },
                    { label: '+ DQ Score', var: 'dq_score' }, { label: '+ Run Date', var: 'run_date' },
                    { label: '+ Duration', var: 'duration' }, { label: '+ Top Fail', var: 'fail_table_1' },
                    'sep',
                    { label: '↺ Reset', action: resetEditor },
                  ].map((b, i) => {
                    if (b === 'sep') return <div key={i} style={{ width: 1, background: 'var(--bdr)', margin: '0 4px' }} />;
                    return (
                      <button key={i} onClick={() => b.cmd ? execCmd(b.cmd) : b.var ? insertVar(b.var) : b.action?.()} style={{
                        background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 4,
                        padding: '4px 8px', color: 'var(--t2)', fontSize: 11, cursor: 'pointer',
                        fontFamily: 'var(--sans)', transition: 'all 0.15s',
                      }}>{b.label}</button>
                    );
                  })}
                </div>

                {/* Subject */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '1px solid var(--bdr)', borderTop: 'none', background: 'var(--bg)' }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', flexShrink: 0 }}>Subject:</label>
                  <input value={customSubject} onChange={e => setCustomSubject(e.target.value)} style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--t1)', fontFamily: 'var(--sans)', fontSize: 12,
                  }} />
                </div>

                {/* Editor area */}
                <div ref={editorRef} contentEditable suppressContentEditableWarning
                  style={{
                    minHeight: 280, padding: 16, border: '1px solid var(--bdr)', borderTop: 'none',
                    borderRadius: '0 0 var(--rs) var(--rs)', background: 'var(--bg)',
                    fontSize: 12, lineHeight: 1.7, color: 'var(--t2)', outline: 'none', overflowY: 'auto',
                  }}
                  dangerouslySetInnerHTML={{ __html: `<p><b>Data Quality Alert Report</b></p><p style="font-size:11px;color:var(--t3)">${scopeName} · Snowflake · Run: {{run_date}} at {{run_time}}</p><br><p>Hi Team,</p><p>The latest data quality validation has completed. One or more thresholds were breached:</p><br><p><b>Overall Health Score:</b> {{health_score}} (threshold: ${thresholds.health}%)</p><p><b>Schema Validation:</b> {{schema_score}}</p><p><b>Data Quality Rules:</b> {{dq_score}}</p><br><p><b>Top failing table:</b> {{fail_table_1}} with {{fail_count_1}} failures</p><br><p>Please review the dashboard for full details.</p><br><p style="font-size:11px;color:var(--t3)">— Data Quality Monitor (Automated)</p>` }}
                />

                {/* Variable hints */}
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 8, padding: '8px 10px', background: 'var(--elev)', borderRadius: 'var(--rs)' }}>
                  <strong>Available variables: </strong>
                  {['health_score', 'schema_score', 'dq_score', 'table_score', 'run_date', 'run_time', 'duration',
                    'schema_passed', 'schema_failed', 'dq_passed', 'dq_failed', 'fail_table_1', 'fail_count_1', 'fail_sev_1', 'dashboard_url'].map(v => (
                      <code key={v} style={{ fontFamily: 'var(--mono)', background: 'var(--blue-d)', color: 'var(--blue)', padding: '1px 5px', borderRadius: 3, fontSize: 9.5, marginRight: 4 }}>{`{{${v}}}`}</code>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Section 3: Actions ═══ */}
        <div className="anim d4" style={pnl}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={sendTest} style={{
              background: 'linear-gradient(135deg, var(--green), #2dd4a8)', color: 'var(--bg)',
              border: 'none', padding: '10px 28px', borderRadius: 'var(--rs)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            }}>✉ Send Test Email</button>
            <button onClick={previewEmail} style={{
              background: 'var(--elev)', color: 'var(--t2)', border: '1px solid var(--bdr)',
              padding: '10px 20px', borderRadius: 'var(--rs)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>👁 Preview with Sample Data</button>
            <button onClick={saveConfig} style={{
              background: 'var(--blue-d)', color: 'var(--blue)', border: '1px solid rgba(96,165,250,0.2)',
              padding: '10px 20px', borderRadius: 'var(--rs)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>💾 Save Configuration</button>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto' }}>Last saved: {lastSaved}</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--t3)', padding: '10px 0 0', marginTop: 14, borderTop: '1px solid var(--bdr)' }}>
          <span>Schema: {scopeName} · Datasource: Snowflake · Engine: Great Expectations 0.18.8</span>
          <span>Email config saved to: email_notification_config.json</span>
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ── Small helper components ──
function Tag({ children }) {
  return <span style={{ display: 'inline-block', fontSize: 9, fontFamily: 'var(--mono)', background: 'var(--blue-d)', color: 'var(--blue)', padding: '1px 6px', borderRadius: 3, margin: '0 2px' }}>{children}</span>;
}

function Td({ children, style }) {
  return <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--bdr)', color: 'var(--t2)', fontFamily: 'var(--mono)', fontSize: 10.5, ...style }}>{children}</td>;
}

function Metric({ children, c }) {
  const colors = { green: { bg: 'var(--green-d)', color: 'var(--green)' }, red: { bg: 'var(--red-d)', color: 'var(--red)' }, amber: { bg: 'var(--amber-d)', color: 'var(--amber)' } };
  const s = colors[c] || colors.green;
  return <span style={{ display: 'inline-block', fontFamily: 'var(--mono)', fontWeight: 600, padding: '2px 8px', borderRadius: 4, fontSize: 11, background: s.bg, color: s.color }}>{children}</span>;
}
