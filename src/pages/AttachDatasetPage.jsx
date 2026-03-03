import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { findNode, addSchemaToNode } from '../data/orgStructure';
import {
  Database, Upload, Server, ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle, Link2, Table2, Clock, Zap, Shield, ArrowLeft, Mail,
  Snowflake, HardDrive, Cloud, Layers, FolderOpen, Loader2, Play, Timer
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════

const STEPS = [
  { id: 'source', label: 'Data Source', icon: Server },
  { id: 'connection', label: 'Connection', icon: Link2 },
  { id: 'schema', label: 'Schema & Tables', icon: Table2 },
  { id: 'validation', label: 'Validation Rules', icon: Shield },
  { id: 'schedule', label: 'Schedule', icon: Clock },
  { id: 'review', label: 'Review & Attach', icon: CheckCircle2 },
];

const SOURCE_OPTIONS = [
  { id: 'snowflake', name: 'Snowflake', icon: Snowflake, color: '#29B5E8', desc: 'Cloud data warehouse' },
  { id: 'databricks', name: 'Databricks', icon: Zap, color: '#FF3621', desc: 'Lakehouse platform' },
  { id: 'bigquery', name: 'BigQuery', icon: Cloud, color: '#4285F4', desc: 'Google Cloud analytics' },
  { id: 'redshift', name: 'Redshift', icon: HardDrive, color: '#8C4FFF', desc: 'AWS data warehouse' },
  { id: 'postgres', name: 'PostgreSQL', icon: Database, color: '#336791', desc: 'Open-source RDBMS' },
  { id: 'csv_upload', name: 'CSV / File Upload', icon: Upload, color: '#34D399', desc: 'Upload flat files' },
];

const LAYER_OPTIONS = ['Raw', 'Cleaned', 'Curated', 'Staging', 'Custom'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKS_OF_MONTH = ['1st Week', '2nd Week', '3rd Week', '4th Week'];
const TIME_SLOTS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    TIME_SLOTS.push({ value: `${hh}:${mm}`, label: `${h12}:${mm} ${ampm}` });
  }
}

// ══════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════

const inputStyle = {
  width: '100%', padding: '10px 14px', fontSize: '12px', fontWeight: 500,
  background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: '8px',
  color: 'var(--t1)', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
};
const labelStyle = { fontSize: '11px', fontWeight: 600, color: 'var(--t2)', marginBottom: '6px', display: 'block' };
const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700,
  color: '#0B0F1A', background: 'linear-gradient(135deg, var(--green), var(--blue))',
  padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
};
const btnSecondary = {
  display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600,
  color: 'var(--t2)', background: 'var(--card)', padding: '10px 20px', borderRadius: '8px',
  border: '1px solid var(--bdr)', cursor: 'pointer', transition: 'all 0.2s',
};

// ══════════════════════════════════════════════════════════════
// RULE MAPPING PROGRESS COMPONENT
// ══════════════════════════════════════════════════════════════

function RuleMappingProgress({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Initializing...');
  const [started, setStarted] = useState(false);

  const stages = [
    { at: 0, text: 'Initializing connection...' },
    { at: 8, text: 'Scanning table schemas...' },
    { at: 18, text: 'Profiling column data types...' },
    { at: 30, text: 'Analyzing null distributions...' },
    { at: 42, text: 'Computing uniqueness constraints...' },
    { at: 55, text: 'Detecting value range patterns...' },
    { at: 65, text: 'Generating regex patterns...' },
    { at: 75, text: 'Mapping referential integrity...' },
    { at: 85, text: 'Validating rule consistency...' },
    { at: 93, text: 'Finalizing rule set...' },
    { at: 100, text: 'Rule mapping complete ✓' },
  ];

  useEffect(() => {
    if (!started) return;
    let p = 0;
    const interval = setInterval(() => {
      const increment = Math.random() * 3 + 0.5;
      p = Math.min(100, p + increment);
      setProgress(Math.round(p * 10) / 10);
      const currentStage = [...stages].reverse().find(s => p >= s.at);
      if (currentStage) setStage(currentStage.text);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => onComplete?.(), 600);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [started]);

  if (!started) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 0' }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '16px', margin: '0 auto 16px',
          background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Play size={24} color="var(--blue)" />
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', marginBottom: '6px' }}>
          Ready to Map Rules
        </div>
        <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '20px', maxWidth: '360px', margin: '0 auto 20px', lineHeight: 1.6 }}>
          Rule mapping will scan your tables, profile data distributions, and automatically generate validation rules.
        </div>
        <button onClick={() => setStarted(true)} style={{
          ...btnPrimary, margin: '0 auto', padding: '12px 28px',
        }}>
          <Zap size={14} /> Start Rule Mapping
        </button>
      </div>
    );
  }

  const pct = Math.min(100, progress);
  const isComplete = pct >= 100;

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isComplete && <Loader2 size={14} color="var(--blue)" style={{ animation: 'spin 1s linear infinite' }} />}
          {isComplete && <CheckCircle2 size={14} color="var(--green)" />}
          <span style={{ fontSize: '12px', fontWeight: 600, color: isComplete ? 'var(--green)' : 'var(--t1)' }}>
            {stage}
          </span>
        </div>
        <span style={{
          fontSize: '14px', fontWeight: 700, fontFamily: 'var(--mono)',
          color: isComplete ? 'var(--green)' : 'var(--blue)',
        }}>
          {pct.toFixed(1)}%
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '8px', background: 'var(--elev)', borderRadius: '99px', overflow: 'hidden',
        border: '1px solid var(--bdr)',
      }}>
        <div style={{
          height: '100%', borderRadius: '99px',
          background: isComplete
            ? 'linear-gradient(90deg, #34D399, #22D3EE)'
            : 'linear-gradient(90deg, #60A5FA, #A78BFA)',
          width: `${pct}%`,
          transition: 'width 0.3s ease-out',
        }} />
      </div>

      {/* Stage markers */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
        {stages.filter(s => s.at <= pct && s.at > 0 && s.at < 100).map((s, i) => (
          <span key={i} style={{
            fontSize: '9px', padding: '3px 8px', borderRadius: '5px',
            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
            color: 'var(--green)', fontWeight: 500,
          }}>
            ✓ {s.text.replace('...', '')}
          </span>
        ))}
      </div>

      {isComplete && (
        <div style={{
          marginTop: '16px', padding: '12px 16px', borderRadius: '10px',
          background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)',
          fontSize: '11px', color: 'var(--t2)', lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--green)' }}>Mapping complete.</strong> Generated 12 validation rules per table
          covering null checks, type validation, uniqueness, range bounds, regex patterns, and row counts.
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MANUAL APPLY BUTTON (5-minute countdown)
// ══════════════════════════════════════════════════════════════

function ManualApplyButton({ onApply }) {
  const [countdown, setCountdown] = useState(null); // null = not started, number = seconds remaining
  const intervalRef = useRef(null);

  const TOTAL_SECONDS = 300; // 5 minutes

  const startCountdown = () => {
    setCountdown(TOTAL_SECONDS);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      clearInterval(intervalRef.current);
      onApply?.();
      return;
    }
    intervalRef.current = setInterval(() => {
      setCountdown(c => c - 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [countdown]);

  if (countdown === null) {
    return (
      <button onClick={startCountdown} style={{
        ...btnPrimary, padding: '14px 32px', fontSize: '13px', margin: '20px auto 0',
        display: 'flex',
      }}>
        <Play size={15} /> Apply Now
      </button>
    );
  }

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const pct = ((TOTAL_SECONDS - countdown) / TOTAL_SECONDS) * 100;
  const isDone = countdown <= 0;

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isDone && <Timer size={14} color="var(--blue)" />}
          {isDone && <CheckCircle2 size={14} color="var(--green)" />}
          <span style={{ fontSize: '12px', fontWeight: 600, color: isDone ? 'var(--green)' : 'var(--t1)' }}>
            {isDone ? 'Validation applied successfully' : 'Applying validation rules...'}
          </span>
        </div>
        {!isDone && (
          <span style={{
            fontSize: '16px', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--blue)',
            letterSpacing: '1px',
          }}>
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        )}
      </div>
      <div style={{
        height: '6px', background: 'var(--elev)', borderRadius: '99px', overflow: 'hidden',
        border: '1px solid var(--bdr)',
      }}>
        <div style={{
          height: '100%', borderRadius: '99px',
          background: isDone ? 'var(--green)' : 'linear-gradient(90deg, #60A5FA, #A78BFA)',
          width: `${pct}%`, transition: 'width 1s linear',
        }} />
      </div>
      {!isDone && (
        <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '6px', textAlign: 'center' }}>
          Estimated time remaining: {mins}m {secs}s — validating rules across all tables...
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export default function AttachDatasetPage() {
  const { '*': pathParam } = useParams();
  const { user, refreshTree } = useAuth();
  const navigate = useNavigate();

  const segments = pathParam?.replace('attach/', '').split('/').filter(Boolean) || user.scopePath;
  const node = findNode(segments);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    source: '',
    host: '', port: '', database: '', warehouse: '', role: '', username: '', password: '',
    projectName: '', projectOwnerEmail: user?.email || '', schemaName: '', layer: '', tables: '', sampleRows: '10000',
    validationMode: '', // 'custom' or 'mapping'
    customRules: '',
    ruleMappingDone: false,
    scheduleType: '', // 'daily', 'weekly', 'monthly', 'manual'
    schedTime: '09:00', schedDay: 'Monday', schedWeek: '1st Week',
    alertEmail: user?.email || '', alertOnFailure: true, alertOnDrift: true,
    datasetName: '', description: '',
    manualApplied: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const u = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const current = STEPS[step];

  const canAdvance = () => {
    if (step === 0) return !!form.source;
    if (step === 1) {
      if (form.source === 'csv_upload') return true;
      return form.host && form.database && form.username;
    }
    if (step === 2) return form.projectOwnerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.projectOwnerEmail.trim()) && form.schemaName && form.tables;
    if (step === 3) {
      if (form.validationMode === 'mapping') return form.ruleMappingDone;
      if (form.validationMode === 'custom') return true; // Custom rules are optional
      return false;
    }
    if (step === 4) {
      if (!form.scheduleType) return false;
      if (form.scheduleType === 'manual') return form.manualApplied;
      return true;
    }
    return true;
  };

  if (!node) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--t3)' }}>
        <AlertCircle size={40} style={{ marginBottom: 12 }} />
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--t1)' }}>Node not found</div>
      </div>
    );
  }

  // ── Success screen ──
  if (submitted) {
    const src = SOURCE_OPTIONS.find(s => s.id === form.source);
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '20px',
          background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeUp 0.5s ease',
        }}>
          <CheckCircle2 size={36} color="var(--green)" />
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--t1)' }}>Dataset Attached Successfully</div>
        <div style={{ fontSize: '12px', color: 'var(--t2)', textAlign: 'center', maxWidth: '420px', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--t1)' }}>{form.schemaName}</strong> has been attached to
          project <strong style={{ color: 'var(--t1)' }}>{node.name}</strong> via {src?.name}.
        </div>
        <div style={{
          background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: '12px',
          padding: '16px 24px', display: 'flex', gap: '28px', fontSize: '11px',
        }}>
          <div><span style={{ color: 'var(--t3)' }}>Project:</span> <strong>{node.name}</strong></div>
          <div><span style={{ color: 'var(--t3)' }}>Schema:</span> <strong>{form.schemaName}</strong></div>
          <div><span style={{ color: 'var(--t3)' }}>Schedule:</span> <strong>{form.scheduleType}</strong></div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button onClick={() => navigate(`/dashboard/${segments.join('/')}`)} style={btnPrimary}>Go to Dashboard</button>
          <button onClick={() => { setSubmitted(false); setStep(0); setForm(f => ({ ...f, source: '', ruleMappingDone: false, manualApplied: false })); }} style={btnSecondary}>Attach Another</button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // STEP RENDERERS
  // ══════════════════════════════════════════════════════════════

  const renderStep = () => {
    switch (current.id) {

      // ── STEP 1: Data Source ──
      case 'source':
        return (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Select Data Source</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '16px' }}>
              Choose the platform where your dataset is stored
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {SOURCE_OPTIONS.map(src => {
                const Icon = src.icon;
                const sel = form.source === src.id;
                return (
                  <div key={src.id} onClick={() => u('source', src.id)} style={{
                    padding: '16px', borderRadius: '12px', cursor: 'pointer',
                    border: `1.5px solid ${sel ? src.color : 'var(--bdr)'}`,
                    background: sel ? `${src.color}0D` : 'var(--card)', transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${src.color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={src.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: sel ? src.color : 'var(--t1)' }}>{src.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--t3)' }}>{src.desc}</div>
                      </div>
                    </div>
                    {sel && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: src.color, fontWeight: 600 }}><CheckCircle2 size={10} /> Selected</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );

      // ── STEP 2: Connection ──
      case 'connection':
        if (form.source === 'csv_upload') {
          return (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Upload Files</div>
              <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '16px' }}>Drag & drop CSV / Parquet files</div>
              <div style={{
                border: '2px dashed var(--bdr)', borderRadius: 16, padding: 48, textAlign: 'center',
                background: 'var(--elev)', cursor: 'pointer',
              }}>
                <Upload size={36} color="var(--t3)" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>Drop files here or click to browse</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 6 }}>CSV, TSV, Parquet, JSON (max 500MB)</div>
              </div>
            </div>
          );
        }
        return (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Connection Details</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '16px' }}>
              Enter credentials for {SOURCE_OPTIONS.find(s => s.id === form.source)?.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Host / Account URL *</label><input style={inputStyle} placeholder="xyz123.snowflakecomputing.com" value={form.host} onChange={e => u('host', e.target.value)} /></div>
              <div><label style={labelStyle}>Port</label><input style={inputStyle} placeholder="443" value={form.port} onChange={e => u('port', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div><label style={labelStyle}>Database *</label><input style={inputStyle} placeholder="PROD_DB" value={form.database} onChange={e => u('database', e.target.value)} /></div>
              <div><label style={labelStyle}>Warehouse / Cluster</label><input style={inputStyle} placeholder="COMPUTE_WH" value={form.warehouse} onChange={e => u('warehouse', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div><label style={labelStyle}>Username *</label><input style={inputStyle} placeholder="service_account" value={form.username} onChange={e => u('username', e.target.value)} /></div>
              <div><label style={labelStyle}>Password / Token</label><input style={inputStyle} type="password" placeholder="••••••••" value={form.password} onChange={e => u('password', e.target.value)} /></div>
            </div>
            <div style={{ marginTop: 12 }}><label style={labelStyle}>Role (optional)</label><input style={inputStyle} placeholder="DQ_MONITOR_ROLE" value={form.role} onChange={e => u('role', e.target.value)} /></div>
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)', fontSize: 10, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={12} /> Credentials encrypted. Read-only access only.
            </div>
          </div>
        );

      // ── STEP 3: Schema & Tables ──
      case 'schema':
        return (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Schema & Table Selection</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '16px' }}>
              Specify which schema and tables to validate in <strong style={{ color: 'var(--t1)' }}>{node.name}</strong>
            </div>
            {/* Project Custodian */}
            <div style={{ marginBottom: 14, padding: '14px 16px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--bdr)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <FolderOpen size={14} color="var(--amber)" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--t1)' }}>Project: {node.name}</span>
              </div>
              {/* Project Custodian Email */}
              <div>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={11} color="var(--amber)" /> Project Custodian Email *
                  </span>
                </label>
                <input
                  style={{ ...inputStyle, borderColor: form.projectOwnerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.projectOwnerEmail.trim()) ? 'var(--red)' : 'var(--bdr)' }}
                  placeholder="e.g. custodian@company.com"
                  value={form.projectOwnerEmail}
                  onChange={e => u('projectOwnerEmail', e.target.value)}
                />
                <div style={{ fontSize: '9px', color: 'var(--t3)', marginTop: '3px' }}>Email of the project custodian responsible for this schema</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <div><label style={labelStyle}>Schema Name *</label><input style={inputStyle} placeholder="RAW_TRANSACTIONS" value={form.schemaName} onChange={e => u('schemaName', e.target.value)} /></div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Tables *</label>
                <button
                  type="button"
                  onClick={() => {
                    const SAMPLE = ['DIM_CUSTOMER', 'FACT_ORDERS', 'DIM_PRODUCT', 'FACT_PAYMENTS', 'DIM_REGION', 'FACT_TRANSACTIONS', 'DIM_DATE', 'FACT_REVENUE', 'DIM_ACCOUNT', 'FACT_RISK_SCORES'];
                    const current = form.tables.split(',').map(t => t.trim()).filter(Boolean);
                    const allSelected = SAMPLE.every(s => current.includes(s));
                    u('tables', allSelected ? '' : SAMPLE.join(', '));
                  }}
                  style={{
                    fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 5,
                    border: '1px solid var(--bdr)', background: 'var(--elev)', color: 'var(--blue)',
                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.4,
                  }}
                >
                  {(() => {
                    const SAMPLE = ['DIM_CUSTOMER', 'FACT_ORDERS', 'DIM_PRODUCT', 'FACT_PAYMENTS', 'DIM_REGION', 'FACT_TRANSACTIONS', 'DIM_DATE', 'FACT_REVENUE', 'DIM_ACCOUNT', 'FACT_RISK_SCORES'];
                    const current = form.tables.split(',').map(t => t.trim()).filter(Boolean);
                    return SAMPLE.every(s => current.includes(s)) ? 'Deselect All' : 'Select All';
                  })()}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {['DIM_CUSTOMER', 'FACT_ORDERS', 'DIM_PRODUCT', 'FACT_PAYMENTS', 'DIM_REGION', 'FACT_TRANSACTIONS', 'DIM_DATE', 'FACT_REVENUE', 'DIM_ACCOUNT', 'FACT_RISK_SCORES'].map(tbl => {
                  const current = form.tables.split(',').map(t => t.trim()).filter(Boolean);
                  const selected = current.includes(tbl);
                  return (
                    <div key={tbl} onClick={() => {
                      const next = selected ? current.filter(t => t !== tbl) : [...current, tbl];
                      u('tables', next.join(', '));
                    }} style={{
                      fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600,
                      padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                      background: selected ? 'rgba(52,211,153,0.12)' : 'var(--elev)',
                      border: `1.5px solid ${selected ? 'var(--green)' : 'var(--bdr)'}`,
                      color: selected ? 'var(--green)' : 'var(--t3)',
                      transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {selected && <CheckCircle2 size={10} />}
                      {tbl}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 9, color: 'var(--t3)' }}>
                {form.tables ? `${form.tables.split(',').filter(t => t.trim()).length} tables selected` : 'Click tables to select or use Select All'}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Sample Row Limit</label>
              <input style={inputStyle} type="number" placeholder="10000" value={form.sampleRows} onChange={e => u('sampleRows', e.target.value)} />
            </div>
          </div>
        );

      // ── STEP 4: Validation Rules (Custom or Rule Mapping) ──
      case 'validation':
        return (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Validation Rules</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '16px' }}>
              Define how your data will be validated — write custom rules or let us auto-map them
            </div>

            {/* Mode selector */}
            {!form.validationMode && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div onClick={() => u('validationMode', 'custom')} style={{
                  padding: 24, borderRadius: 14, cursor: 'pointer', border: '1.5px solid var(--bdr)',
                  background: 'var(--card)', transition: 'all 0.2s', textAlign: 'center',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber)'; e.currentTarget.style.background = 'rgba(251,191,36,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.background = 'var(--card)'; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileEdit size={22} color="var(--amber)" />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Custom Rules <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--t3)' }}>(Optional)</span></div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', lineHeight: 1.6 }}>
                    Write your own validation rules in YAML/JSON. Full control over checks, thresholds, and conditions.
                  </div>
                </div>
                <div onClick={() => u('validationMode', 'mapping')} style={{
                  padding: 24, borderRadius: 14, cursor: 'pointer', border: '1.5px solid var(--bdr)',
                  background: 'var(--card)', transition: 'all 0.2s', textAlign: 'center',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'rgba(96,165,250,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.background = 'var(--card)'; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px', background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={22} color="var(--blue)" />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Rule Mapping <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--red)' }}>(Required)</span></div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', lineHeight: 1.6 }}>
                    Auto-scan your data and generate validation rules. Profiles distributions, types, and patterns automatically.
                  </div>
                </div>
              </div>
            )}

            {/* Custom Rules editor */}
            {form.validationMode === 'custom' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Custom Rule Definitions</span>
                  <button onClick={() => u('validationMode', '')} style={{ fontSize: 10, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>← Change mode</button>
                </div>
                <textarea style={{ ...inputStyle, minHeight: 200, resize: 'vertical', fontFamily: 'var(--mono)', fontSize: 11 }}
                  placeholder={`rules:\n  - type: not_null\n    columns: [id, created_at]\n  - type: unique\n    columns: [id]\n  - type: range\n    column: amount\n    min: 0\n    max: 999999\n  - type: regex\n    column: email\n    pattern: "^[\\\\w.-]+@[\\\\w.-]+\\\\.\\\\w+$"`}
                  value={form.customRules} onChange={e => u('customRules', e.target.value)} />
                <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 4 }}>
                  YAML or JSON format. Supports: not_null, unique, range, regex, row_count, type_check, referential_integrity
                </div>
              </div>
            )}

            {/* Rule Mapping with progress bar */}
            {form.validationMode === 'mapping' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Automated Rule Mapping</span>
                  {!form.ruleMappingDone && <button onClick={() => { u('validationMode', ''); u('ruleMappingDone', false); }} style={{ fontSize: 10, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>← Change mode</button>}
                </div>
                <RuleMappingProgress onComplete={() => u('ruleMappingDone', true)} />
              </div>
            )}
          </div>
        );

      // ── STEP 5: Schedule ──
      case 'schedule':
        return (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Monitoring Schedule</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '16px' }}>
              Configure how often validation runs
            </div>

            {/* Schedule type selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'daily', label: 'Daily', icon: '📅' },
                { id: 'weekly', label: 'Weekly', icon: '🗓️' },
                { id: 'monthly', label: 'Monthly', icon: '📆' },
                { id: 'manual', label: 'Manual', icon: '🖐️' },
              ].map(opt => {
                const sel = form.scheduleType === opt.id;
                return (
                  <div key={opt.id} onClick={() => { u('scheduleType', opt.id); u('manualApplied', false); }}
                    style={{
                      padding: '14px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                      border: `1.5px solid ${sel ? 'var(--blue)' : 'var(--bdr)'}`,
                      background: sel ? 'rgba(96,165,250,0.08)' : 'var(--card)',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: sel ? 700 : 500, color: sel ? 'var(--blue)' : 'var(--t2)' }}>{opt.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Daily: pick time */}
            {form.scheduleType === 'daily' && (
              <div style={{ padding: '16px 18px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--bdr)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--t1)' }}>Run every day at:</div>
                <label style={labelStyle}>Time</label>
                <select style={{ ...inputStyle, cursor: 'pointer', maxWidth: 200 }} value={form.schedTime} onChange={e => u('schedTime', e.target.value)}>
                  {TIME_SLOTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            )}

            {/* Weekly: pick day + time */}
            {form.scheduleType === 'weekly' && (
              <div style={{ padding: '16px 18px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--bdr)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--t1)' }}>Run every week on:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Day</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.schedDay} onChange={e => u('schedDay', e.target.value)}>
                      {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Time</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.schedTime} onChange={e => u('schedTime', e.target.value)}>
                      {TIME_SLOTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly: pick week + day + time */}
            {form.scheduleType === 'monthly' && (
              <div style={{ padding: '16px 18px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--bdr)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--t1)' }}>Run every month on:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Week</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.schedWeek} onChange={e => u('schedWeek', e.target.value)}>
                      {WEEKS_OF_MONTH.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Day</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.schedDay} onChange={e => u('schedDay', e.target.value)}>
                      {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Time</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.schedTime} onChange={e => u('schedTime', e.target.value)}>
                      {TIME_SLOTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Manual: Apply button with 5-min lag */}
            {form.scheduleType === 'manual' && (
              <div style={{ padding: '16px 18px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--bdr)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--t1)' }}>Manual Trigger</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 10, lineHeight: 1.6 }}>
                  Validation will run on-demand only. Click Apply to trigger an immediate validation pass.
                  This process takes approximately 5 minutes to scan and validate all tables.
                </div>
                {form.manualApplied ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
                    <CheckCircle2 size={16} /> Manual validation applied successfully
                  </div>
                ) : (
                  <ManualApplyButton onApply={() => u('manualApplied', true)} />
                )}
              </div>
            )}

            {/* Alert settings (for non-manual) */}
            {form.scheduleType && form.scheduleType !== 'manual' && (
              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Alert Email</label>
                  <input style={inputStyle} placeholder="team@company.com" value={form.alertEmail} onChange={e => u('alertEmail', e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { key: 'alertOnFailure', label: 'Alert on validation failure' },
                    { key: 'alertOnDrift', label: 'Alert on schema drift' },
                  ].map(opt => (
                    <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11, color: 'var(--t2)' }}>
                      <div onClick={() => u(opt.key, !form[opt.key])} style={{
                        width: 18, height: 18, borderRadius: 5,
                        border: `1.5px solid ${form[opt.key] ? 'var(--green)' : 'var(--bdr)'}`,
                        background: form[opt.key] ? 'rgba(52,211,153,0.15)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}>
                        {form[opt.key] && <CheckCircle2 size={12} color="var(--green)" />}
                      </div>
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      // ── STEP 6: Review ──
      case 'review': {
        const src = SOURCE_OPTIONS.find(s => s.id === form.source);
        const tblCount = form.tables.split(',').filter(t => t.trim()).length;
        const schedDesc = form.scheduleType === 'daily' ? `Daily at ${TIME_SLOTS.find(t => t.value === form.schedTime)?.label}`
          : form.scheduleType === 'weekly' ? `Every ${form.schedDay} at ${TIME_SLOTS.find(t => t.value === form.schedTime)?.label}`
            : form.scheduleType === 'monthly' ? `${form.schedWeek}, ${form.schedDay} at ${TIME_SLOTS.find(t => t.value === form.schedTime)?.label}`
              : 'Manual trigger';
        const items = [
          { label: 'Data Source', value: src?.name, color: src?.color },
          { label: 'Host', value: form.host || 'File Upload' },
          { label: 'Project', value: node.name },
          { label: 'Custodian Email', value: form.projectOwnerEmail },
          { label: 'Schema', value: form.schemaName },
          { label: 'Tables', value: `${tblCount} table${tblCount !== 1 ? 's' : ''}` },
          { label: 'Validation', value: form.validationMode === 'custom' ? 'Custom Rules (Optional)' : 'Auto Rule Mapping' },
          { label: 'Schedule', value: schedDesc },
          { label: 'Alert Email', value: form.alertEmail || '—' },
        ];
        return (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Review Configuration</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 16 }}>
              Verify details, then attach to <strong style={{ color: 'var(--t1)' }}>{node.name}</strong>
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 12, overflow: 'hidden' }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: i < items.length - 1 ? '1px solid var(--bdr)' : 'none', fontSize: 11 }}>
                  <span style={{ color: 'var(--t3)', fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: item.color || 'var(--t1)', fontFamily: 'var(--mono)' }}>{item.value}</span>
                </div>
              ))}
            </div>
            {form.tables && (
              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Tables</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {form.tables.split(',').filter(t => t.trim()).map((t, i) => (
                    <span key={i} style={{ fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 500, padding: '4px 10px', borderRadius: 6, background: 'var(--elev)', border: '1px solid var(--bdr)', color: 'var(--t2)' }}>{t.trim()}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      default: return null;
    }
  };

  // ══════════════════════════════════════════════════════════════
  // LAYOUT
  // ══════════════════════════════════════════════════════════════

  // For manual schedule, hide Next on step 4 (user must use Apply button)
  const hideNextOnSchedule = step === 4 && form.scheduleType === 'manual' && !form.manualApplied;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{
        height: 48, background: 'var(--hdr-bg)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--bdr)', padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <button onClick={() => navigate(`/dashboard/${segments.join('/')}`)} style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
          color: 'var(--t2)', background: 'var(--card)', border: '1px solid var(--bdr)',
          padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
        }}>
          <ArrowLeft size={13} /> Back to Dashboard
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--bdr)' }} />
        <Layers size={14} color="var(--blue)" />
        <div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Attach New Dataset</span>
          <span style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 8 }}>
            to {node.name} ({node.type === 'bu' ? 'Business Unit' : node.type.charAt(0).toUpperCase() + node.type.slice(1)})
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
        {/* Stepper */}
        <div style={{ width: 220, flexShrink: 0, padding: '24px 16px', borderRight: '1px solid var(--bdr)', background: 'var(--card)' }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.id} onClick={() => { if (isDone) setStep(i); }} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                cursor: isDone ? 'pointer' : 'default',
                background: isActive ? 'var(--elev)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--blue)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isDone ? 'rgba(52,211,153,0.12)' : isActive ? 'rgba(96,165,250,0.12)' : 'var(--elev)',
                  border: `1px solid ${isDone ? 'rgba(52,211,153,0.2)' : isActive ? 'rgba(96,165,250,0.2)' : 'var(--bdr)'}`,
                }}>
                  {isDone ? <CheckCircle2 size={13} color="var(--green)" /> : <Icon size={13} color={isActive ? 'var(--blue)' : 'var(--t3)'} />}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isDone ? 'var(--green)' : isActive ? 'var(--t1)' : 'var(--t3)' }}>{s.label}</div>
                  <div style={{ fontSize: 9, color: 'var(--t3)' }}>{isDone ? 'Completed' : isActive ? `Step ${i + 1} of ${STEPS.length}` : ''}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form */}
        <div style={{ flex: 1, padding: '28px 40px', maxWidth: 720, overflowY: 'auto' }}>
          {renderStep()}

          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 16, borderTop: '1px solid var(--bdr)' }}>
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              style={{ ...btnSecondary, opacity: step === 0 ? 0.4 : 1, cursor: step === 0 ? 'not-allowed' : 'pointer' }}>
              <ChevronLeft size={14} /> Previous
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => {
                // If custom rules selected, switch to rule mapping mode within the same step
                if (step === 3 && form.validationMode === 'custom') {
                  u('validationMode', 'mapping');
                  return;
                }
                setStep(s => s + 1);
              }}
                disabled={!canAdvance() || hideNextOnSchedule}
                style={{
                  ...btnPrimary,
                  opacity: (canAdvance() && !hideNextOnSchedule) ? 1 : 0.4,
                  cursor: (canAdvance() && !hideNextOnSchedule) ? 'pointer' : 'not-allowed',
                }}>
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={() => {
                // Mutate the live org tree to add the new schema
                addSchemaToNode(segments, {
                  projectName: node.name,
                  projectOwnerEmail: form.projectOwnerEmail.trim(),
                  schemaName: form.schemaName.trim(),
                  tables: form.tables,
                });
                refreshTree(); // Force sidebar re-render
                setSubmitted(true);
              }} style={btnPrimary}>
                <Zap size={14} /> Start Monitoring
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Shim for FileEdit (lucide doesn't have it, use a text placeholder approach)
function FileEdit({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l1-3.95z" />
    </svg>
  );
}
