import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { findNode } from '../data/orgStructure';
import { ArrowLeft, Search, Download, X } from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// DATA GENERATORS — deterministic from schema tables/columns
// ══════════════════════════════════════════════════════════════
const RULE_CATS = {
  'Null Check': 'Completeness', 'Uniqueness Check': 'Uniqueness', 'Value Range': 'Validity',
  'String Length Check': 'Validity', 'Allowed Values Set': 'Validity', 'Mean Drift Detection': 'Statistical',
  'StdDev Drift Detection': 'Statistical', 'Median Drift Detection': 'Statistical',
  'Positive Numbers Only': 'Business Rule', 'Alphabetic Only': 'Business Rule', 'URL Format': 'Pattern',
};
const DQ_RULES = Object.keys(RULE_CATS);
const SCHEMA_RULES = ['Type Must Be NUMBER', 'Type Must Be TEXT', 'Type Must Be DATE', 'Type Must Be BOOLEAN', 'Type Must Be FLOAT', 'Type Must Be TIMESTAMP'];
const SEVERITIES = ['Critical', 'Error', 'Warning'];

function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function fmtDate() { return 'Feb 19, 2026'; }
function fmtTime(r) {
  const h = 9 + Math.floor(r() * 4);
  const m = Math.floor(r() * 60);
  const s = Math.floor(r() * 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function generateDrillDownData(node) {
  if (!node || !node.tables) return { dq: [], schema: [], table: [], skipped: [], summary: {} };

  const dqRows = [];
  const schemaRows = [];
  const tableRows = [];
  const skippedRows = [];

  node.tables.forEach(tbl => {
    const rng = seededRng(hashStr(tbl.name));
    const dur = (0.5 + rng() * 2).toFixed(2) + 's';
    const schemaDur = '0.16s';

    // Table-level rules
    const rowMin = 3 + Math.floor(rng() * 20);
    const rowMax = rowMin + Math.floor(rng() * 50);
    tableRows.push({
      table: tbl.name, column: 'TABLE-LEVEL', isTableLevel: true,
      rule: `Row Count Between ${rowMin} and ${rowMax}`, cat: 'Volume',
      date: fmtDate(), time: fmtTime(rng),
      score: 100, status: 'Passed', severity: 'None', dur, // Fixed severity
    });
    tableRows.push({
      table: tbl.name, column: 'TABLE-LEVEL', isTableLevel: true,
      rule: `Column Count Must Equal ${tbl.columns.length}`, cat: 'Structure',
      date: fmtDate(), time: fmtTime(rng),
      score: 100, status: 'Passed', severity: 'None', dur, // Fixed severity
    });

    tbl.columns.forEach(col => {
      const cr = seededRng(hashStr(tbl.name + col.name));
      const colType = col.dataType || 'TEXT';
      const isDateCol = colType === 'TIMESTAMP' || colType === 'DATE';
      const isNullCol = col.nullRate > 95;

      // Skipped columns
      if (isDateCol && cr() > 0.5) {
        const minY = 50000 + Math.floor(cr() * 7000);
        const maxY = minY + Math.floor(cr() * 3000);
        skippedRows.push({
          table: tbl.name, column: col.name, colType: isDateCol ? 'TIMESTAMP_NTZ' : colType,
          reason: 'date', chip: 'Out-of-Range Date',
          detail: `min: ${minY}-${String(1+Math.floor(cr()*12)).padStart(2,'0')}-${String(1+Math.floor(cr()*28)).padStart(2,'0')} · max: ${maxY}-${String(1+Math.floor(cr()*12)).padStart(2,'0')}-${String(1+Math.floor(cr()*28)).padStart(2,'0')} — exceeds 2099-12-31`,
        });
      } else if (isNullCol && cr() > 0.6) {
        skippedRows.push({
          table: tbl.name, column: col.name, colType: colType,
          reason: 'null', chip: '100% NULL',
          detail: 'all rows NULL — column not populated',
        });
      }

      // Schema rule
      const typeMap = { STRING: 'TEXT', INTEGER: 'NUMBER', FLOAT: 'FLOAT', TIMESTAMP: 'TIMESTAMP', BOOLEAN: 'BOOLEAN', DATE: 'DATE' };
      const expectedType = typeMap[colType] || 'TEXT';
      const schemaPass = cr() > 0.12;
      schemaRows.push({
        table: tbl.name, column: col.name,
        rule: `Type Must Be ${expectedType}`, cat: 'Schema',
        date: fmtDate(), time: fmtTime(cr),
        score: schemaPass ? 100 : 0, status: schemaPass ? 'Passed' : 'Failed',
        severity: schemaPass ? 'None' : 'Critical', dur: schemaDur, isFailed: !schemaPass, // Fixed severity
      });

      // DQ rules (2-5 per column)
      const numRules = 2 + Math.floor(cr() * 4);
      const usedRules = new Set();
      for (let r = 0; r < numRules; r++) {
        let rule;
        do { rule = DQ_RULES[Math.floor(cr() * DQ_RULES.length)]; } while (usedRules.has(rule));
        usedRules.add(rule);
        const passed = col.hasFailure ? cr() > 0.3 : cr() > 0.02;
        const score = passed ? 100 : Math.floor(cr() * 80);
        dqRows.push({
          table: tbl.name, column: col.name,
          rule: rule + (rule === 'Value Range' ? ' (profiled)' : ''), cat: RULE_CATS[rule],
          date: fmtDate(), time: fmtTime(cr),
          score, status: passed ? 'Passed' : 'Failed',
          severity: passed ? 'None' : SEVERITIES[Math.floor(cr() * 3)], dur, // Fixed severity
        });
      }
    });
  });

  return {
    dq: dqRows, schema: schemaRows, table: tableRows, skipped: skippedRows,
    summary: { totalTables: node.tables.length } // We dynamically compute the rest in the component now
  };
}

// ══════════════════════════════════════════════════════════════
// SCORE BADGE
// ══════════════════════════════════════════════════════════════
function ScoreBadge({ score }) {
  const cls = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
  const colors = { green: { bg: 'var(--green-d)', c: 'var(--green)' }, yellow: { bg: 'var(--amber-d)', c: 'var(--amber)' }, red: { bg: 'var(--red-d)', c: 'var(--red)' } };
  const s = colors[cls];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 5, background: s.bg, color: s.c }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.c }} />
      {score}%
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN DRILL DOWN PAGE
// ══════════════════════════════════════════════════════════════
export default function DrillDownPage() {
  const { '*': pathParam } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const segments = pathParam?.split('/').filter(Boolean) || [];
  const node = findNode(segments);

  // ── Org-level access control ──
  const userOrg = user?.role === 'org' ? null : user?.scopePath?.[0];
  const schemaOrg = segments[0] || null;
  const hasAccess = !userOrg || userOrg === schemaOrg;

  // ── Generate data ──
  const data = useMemo(() => {
    if (!node || node.type !== 'schema') return null;
    return generateDrillDownData(node);
  }, [node]);

  // ── State ──
  const [activeTab, setActiveTab] = useState('dq');
  const [search, setSearch] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterScore, setFilterScore] = useState('');
  const [filterRule, setFilterRule] = useState('');
  const [skipFilterTable, setSkipFilterTable] = useState('');
  const [skipFilterReason, setSkipFilterReason] = useState('');

  if (!hasAccess) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)' }}>Access Denied</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', maxWidth: 400 }}>
          You do not have permission to view this schema's drill-down data. This schema belongs to a different organization.
        </div>
        <button onClick={() => navigate(-1)} style={{ marginTop: 8, padding: '8px 20px', borderRadius: 6, border: '1px solid var(--bdr)', background: 'var(--card)', color: 'var(--t2)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          Go Back
        </button>
      </div>
    );
  }

  if (!node || node.type !== 'schema' || !data) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>📊</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Schema not found</div>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid var(--bdr)', background: 'var(--card)', color: 'var(--t2)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Go Back</button>
      </div>
    );
  }

  const scopeName = node.name;

  // ── Filtered rows ──
  const activeRows = activeTab === 'dq' ? data.dq : activeTab === 'schema' ? data.schema : data.table;
  const tableNames = [...new Set(activeRows.map(r => r.table))].sort();
  const ruleNames = [...new Set(activeRows.map(r => r.rule))].sort();

  const filteredRows = activeRows.filter(r => {
    if (search && !`${r.table} ${r.column} ${r.rule}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterTable && r.table !== filterTable) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterSeverity && r.severity !== filterSeverity) return false;
    if (filterRule && r.rule !== filterRule) return false;
    if (filterScore === 'green' && r.score < 80) return false;
    if (filterScore === 'yellow' && (r.score < 60 || r.score >= 80)) return false;
    if (filterScore === 'red' && r.score >= 60) return false;
    return true;
  });

  // Skipped filtered
  const skipTableNames = [...new Set(data.skipped.map(r => r.table))].sort();
  const filteredSkipped = data.skipped.filter(r => {
    if (skipFilterTable && r.table !== skipFilterTable) return false;
    if (skipFilterReason && r.reason !== skipFilterReason) return false;
    return true;
  });

  // ── Dynamic Summary Calculations ──
  // Calculate summary metrics based on the current `filterTable` selection
  const baseDq = data.dq.filter(r => !filterTable || r.table === filterTable);
  const baseSch = data.schema.filter(r => !filterTable || r.table === filterTable);
  const baseTbl = data.table.filter(r => !filterTable || r.table === filterTable);
  const baseAll = [...baseDq, ...baseSch, ...baseTbl];

  const totalRules = baseAll.length;
  const totalPassed = baseAll.filter(r => r.status === 'Passed').length;
  const dqTotal = baseDq.length;
  const dqPassed = baseDq.filter(r => r.status === 'Passed').length;
  const schTotal = baseSch.length;
  const schPassed = baseSch.filter(r => r.status === 'Passed').length;
  const tblTotal = baseTbl.length;
  const tblPassed = baseTbl.filter(r => r.status === 'Passed').length;

  const allRulesOverall = [...data.dq, ...data.schema, ...data.table];
  const tablesWithFails = new Set(allRulesOverall.filter(r => r.status === 'Failed').map(r => r.table)).size;
  const skippedForTable = data.skipped.filter(r => !filterTable || r.table === filterTable);

  const s = {
    allRate: totalRules > 0 ? ((totalPassed / totalRules) * 100).toFixed(1) : '100',
    allPassed: totalPassed, allTotal: totalRules,
    schRate: schTotal > 0 ? ((schPassed / schTotal) * 100).toFixed(1) : '100',
    schPassed, schTotal,
    tblRate: tblTotal > 0 ? ((tblPassed / tblTotal) * 100).toFixed(1) : '100',
    tblPassed, tblTotal,
    dqRate: dqTotal > 0 ? ((dqPassed / dqTotal) * 100).toFixed(1) : '100',
    dqPassed, dqTotal,
    failTblPct: data.summary.totalTables > 0 ? ((tablesWithFails / data.summary.totalTables) * 100).toFixed(1) : '0',
    failTblCount: tablesWithFails,
    skipCols: skippedForTable.length,
    skipTables: new Set(skippedForTable.map(r => r.table)).size,
  };

  const rateColor = (v) => parseFloat(v) >= 95 ? 'var(--green)' : parseFloat(v) >= 80 ? 'var(--amber)' : 'var(--red)';

  // Dynamically constructed cards based on `filterTable`
  const cards = [
    { label: 'All Rules Pass Rate', sub: '(Schema + Table + DQ combined)', val: s.allRate + '%', detail: `${s.allPassed} / ${s.allTotal} passed`, color: rateColor(s.allRate), accent: 'var(--green)' },
    { label: 'Schema Rules Pass Rate', sub: '(column type match checks)', val: s.schRate + '%', detail: `${s.schPassed} / ${s.schTotal} passed`, color: rateColor(s.schRate), accent: 'var(--purple)' },
    ...(!filterTable ? [{ label: 'Table-Level Rules Pass Rate', sub: '(row count + column count)', val: s.tblRate + '%', detail: `${s.tblPassed} / ${s.tblTotal} passed`, color: rateColor(s.tblRate), accent: 'var(--cyan)' }] : []),
    { label: 'Data Quality Rules Pass Rate', sub: '(null, unique, range, stats, regex)', val: s.dqRate + '%', detail: `${s.dqPassed} / ${s.dqTotal} passed`, color: rateColor(s.dqRate), accent: 'var(--blue)' },
    ...(!filterTable ? [{ label: 'Tables with Failures', sub: '(at least 1 rule failed)', val: s.failTblPct + '%', detail: `${s.failTblCount} of ${data.summary.totalTables} tables`, color: 'var(--red)', accent: 'var(--red)' }] : []),
    { label: 'Columns Skipped (No Rules)', sub: '(bad dates or 100% NULL)', val: s.skipCols, detail: `${s.skipCols} cols · ${s.skipTables} tables`, color: 'var(--amber)', accent: 'var(--amber)' },
  ];

  // ── Active filters ──
  const activeFilters = [];
  if (search) activeFilters.push({ label: `Search: "${search}"`, clear: () => setSearch('') });
  if (filterTable) activeFilters.push({ label: `Table: ${filterTable}`, clear: () => setFilterTable('') });
  if (filterStatus) activeFilters.push({ label: `Status: ${filterStatus}`, clear: () => setFilterStatus('') });
  if (filterSeverity) activeFilters.push({ label: `Severity: ${filterSeverity}`, clear: () => setFilterSeverity('') });
  if (filterScore) activeFilters.push({ label: `Score: ${filterScore}`, clear: () => setFilterScore('') });
  if (filterRule) activeFilters.push({ label: `Rule: ${filterRule}`, clear: () => setFilterRule('') });

  const clearAll = () => { setSearch(''); setFilterTable(''); setFilterStatus(''); setFilterSeverity(''); setFilterScore(''); setFilterRule(''); };

  // ── CSV download ──
  const downloadCSV = (filteredOnly) => {
    const rows = filteredOnly ? filteredRows : activeRows;
    const headers = ['Table', 'Column', 'Rule', 'Category', 'Date', 'Time', 'Score', 'Duration', 'Status', 'Severity'];
    const csv = [headers.join(','), ...rows.map(r => [r.table, r.column, `"${r.rule}"`, r.cat, r.date, r.time, r.score + '%', r.dur, r.status, r.severity].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dq_drilldown_${activeTab}${filteredOnly ? '_filtered' : ''}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadSkippedCSV = () => {
    const headers = ['Table', 'Column', 'Column Type', 'Reason', 'Details'];
    const csv = [headers.join(','), ...filteredSkipped.map(r => [r.table, r.column, r.colType, r.chip, `"${r.detail}"`].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'skipped_columns.csv'; a.click(); URL.revokeObjectURL(url);
  };

  // ── Styles ──
  const thS = { fontSize: 9, fontWeight: 600, letterSpacing: 0.7, textTransform: 'uppercase', color: 'var(--t3)', textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--bdr)', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 2, whiteSpace: 'nowrap' };
  const tdS = { padding: '8px 12px', fontSize: 11.5, borderBottom: '1px solid rgba(37,45,68,0.3)', verticalAlign: 'middle' };
  const selS = { background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', padding: '7px 10px', color: 'var(--t2)', fontFamily: 'var(--sans)', fontSize: 11, cursor: 'pointer', outline: 'none' };

  const tabCfg = [
    { id: 'dq', label: '⬡ Data Quality Rules', count: data.dq.length, accent: 'var(--blue)' },
    { id: 'schema', label: '◈ Schema Rules', count: data.schema.length, accent: 'var(--purple)' },
    { id: 'table', label: '⊞ Table-Level Rules', count: data.table.length, accent: 'var(--cyan)' },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ height: 48, background: 'var(--hdr-bg)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--bdr)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, var(--green), var(--blue))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff' }}>DQ</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Data Quality Monitor — Rule-Level Drill Down</div>
            <div style={{ fontSize: 10.5, color: 'var(--t2)' }}>{scopeName} · All Tables · All Columns · All Rules</div>
          </div>
        </div>
        <button onClick={() => navigate(`/dashboard/${segments.join('/')}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t2)', background: 'var(--card)', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--bdr)', cursor: 'pointer' }}>
          <ArrowLeft size={13} /> Back to Overview
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 28px 24px', maxWidth: 1520, margin: '0 auto', width: '100%' }}>

        {/* Summary cards - grid adjusts dynamically based on available cards */}
        <div className="anim d1" style={{ display: 'grid', gridTemplateColumns: `repeat(${cards.length}, 1fr)`, gap: 10, marginBottom: 14 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: '12px 14px', position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: c.accent, borderRadius: 'var(--r) var(--r) 0 0' }} />
              <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--t2)', marginBottom: 6, lineHeight: 1.3 }}>
                {c.label}<br /><span style={{ fontSize: 8, color: 'var(--t3)' }}>{c.sub}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1, lineHeight: 1, color: c.color }}>{c.val}</div>
              <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 4, fontFamily: 'var(--mono)' }}>{c.detail}</div>
            </div>
          ))}
        </div>

        {/* Tabs + download */}
        <div className="anim d2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: 4 }}>
            {tabCfg.map(t => (
              <div key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: '8px 18px', borderRadius: 'var(--rs)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                color: activeTab === t.id ? 'var(--t1)' : 'var(--t3)',
                background: activeTab === t.id ? 'var(--elev)' : 'transparent',
                boxShadow: activeTab === t.id ? `inset 0 -2px 0 ${t.accent}` : 'none',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
              }}>
                <span>{t.label}</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--mono)', padding: '2px 7px', borderRadius: 4, background: activeTab === t.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)', color: activeTab === t.id ? 'var(--t2)' : 'var(--t3)' }}>{t.count}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => downloadCSV(false)} style={{ ...selS, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}><Download size={12} /> Full CSV</button>
            <button onClick={() => downloadCSV(true)} style={{ ...selS, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}><Download size={12} /> Filtered CSV</button>
          </div>
        </div>

        {/* Filters */}
        <div className="anim d3" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', padding: '7px 12px', flex: '0 0 260px' }}>
            <Search size={13} color="var(--t3)" />
            <input placeholder="Search table, column, rule..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--t1)', fontFamily: 'var(--sans)', fontSize: 12, width: '100%' }} />
          </div>
          <select style={selS} value={filterTable} onChange={e => setFilterTable(e.target.value)}>
            <option value="">All Tables</option>
            {tableNames.map(t => <option key={t}>{t}</option>)}
          </select>
          <select style={selS} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Passed">Passed</option><option value="Failed">Failed</option>
          </select>
          <select style={selS} value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
            <option value="">All Severities</option>
            <option value="Critical">Critical</option><option value="Error">Error</option><option value="Warning">Warning</option><option value="None">None</option>
          </select>
          <select style={selS} value={filterScore} onChange={e => setFilterScore(e.target.value)}>
            <option value="">All Scores</option>
            <option value="green">≥ 80% (Green)</option><option value="yellow">60–80% (Yellow)</option><option value="red">&lt; 60% (Red)</option>
          </select>
          <select style={selS} value={filterRule} onChange={e => setFilterRule(e.target.value)}>
            <option value="">All Rules</option>
            {ruleNames.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {activeFilters.map((f, i) => (
              <span key={i} style={{ fontSize: 10, background: 'var(--blue-d)', color: 'var(--blue)', padding: '3px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                {f.label} <span onClick={f.clear} style={{ cursor: 'pointer', fontWeight: 700, opacity: 0.7 }}>✕</span>
              </span>
            ))}
            <span onClick={clearAll} style={{ fontSize: 10, color: 'var(--t3)', cursor: 'pointer', padding: '3px 6px' }}>Clear all</span>
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8, fontFamily: 'var(--mono)' }}>
          Showing {filteredRows.length} of {activeRows.length} rows
        </div>

        {/* Main data table */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
          <div style={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>{['Table', 'Column', 'Rule', 'Run Date', 'Run Time', 'Score', 'Duration', 'Status', 'Severity'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>No rows match the current filters</td></tr>
                )}
                {filteredRows.map((r, i) => (
                  <tr key={i} style={{ transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--card-h)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdS}>
                      {/* Clickable table filter trigger */}
                      <span 
                        onClick={() => setFilterTable(r.table)}
                        title="Filter by this table"
                        style={{ fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 600, color: 'var(--cyan)', cursor: 'pointer', textDecoration: 'underline' }}>
                        {r.table}
                      </span>
                    </td>
                    <td style={tdS}><span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 600, color: r.isTableLevel ? 'var(--t3)' : r.isFailed ? 'var(--red)' : 'var(--t1)', fontStyle: r.isTableLevel ? 'italic' : 'normal' }}>{r.column}</span></td>
                    <td style={tdS}>
                      <span style={{ fontSize: 11, color: 'var(--t2)' }}>{r.rule}</span>
                      <span style={{ display: 'inline-block', fontSize: 8.5, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'var(--t3)', marginLeft: 5, verticalAlign: 'middle' }}>{r.cat}</span>
                    </td>
                    <td style={tdS}><span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)' }}>{r.date}</span></td>
                    <td style={tdS}><span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)' }}>{r.time}</span></td>
                    <td style={tdS}><ScoreBadge score={r.score} /></td>
                    <td style={tdS}><span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--t2)' }}>{r.dur}</span></td>
                    <td style={tdS}>
                      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: r.status === 'Passed' ? 'var(--green-d)' : 'var(--red-d)', color: r.status === 'Passed' ? 'var(--green)' : 'var(--red)' }}>{r.status}</span>
                    </td>
                    <td style={tdS}>
                      {/* Map severity appropriately */}
                      <span style={{ 
                        fontSize: 9, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, 
                        background: r.severity === 'Critical' ? 'var(--red-d)' : r.severity === 'Error' ? 'var(--amber-d)' : r.severity === 'Warning' ? 'var(--blue-d)' : 'var(--green-d)', 
                        color: r.severity === 'Critical' ? 'var(--red)' : r.severity === 'Error' ? 'var(--amber)' : r.severity === 'Warning' ? 'var(--blue)' : 'var(--green)' 
                      }}>
                        {r.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Skipped columns section */}
        {data.skipped.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--amber)' }}>
                ⊘ Skipped Columns — Not Monitored Due to Data Issues ({data.skipped.length} columns across {new Set(data.skipped.map(r => r.table)).size} tables)
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <select style={selS} value={skipFilterTable} onChange={e => setSkipFilterTable(e.target.value)}>
                  <option value="">All Tables</option>
                  {skipTableNames.map(t => <option key={t}>{t}</option>)}
                </select>
                <select style={selS} value={skipFilterReason} onChange={e => setSkipFilterReason(e.target.value)}>
                  <option value="">All Reasons</option>
                  <option value="date">Out-of-Range Dates ({data.skipped.filter(r => r.reason === 'date').length})</option>
                  <option value="null">100% NULL ({data.skipped.filter(r => r.reason === 'null').length})</option>
                </select>
                <button onClick={downloadSkippedCSV} style={{ ...selS, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <Download size={12} /> Download Skipped CSV
                </button>
              </div>

              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr>{['Table', 'Column', 'Column Type', 'Reason', 'Details'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredSkipped.map((r, i) => (
                      <tr key={i} style={{ transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--card-h)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={tdS}><span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 600, color: 'var(--cyan)' }}>{r.table}</span></td>
                        <td style={tdS}><span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 600, color: 'var(--t1)' }}>{r.column}</span></td>
                        <td style={tdS}><span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)' }}>{r.colType}</span></td>
                        <td style={tdS}>
                          <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: r.reason === 'null' ? 'rgba(255,255,255,0.06)' : 'var(--amber-d)', color: r.reason === 'null' ? 'var(--t3)' : 'var(--amber)' }}>{r.chip}</span>
                        </td>
                        <td style={tdS}><span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)' }}>{r.detail}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 0 0', fontSize: 10, color: 'var(--t3)' }}>
                Showing {filteredSkipped.length} skipped columns · {data.skipped.filter(r => r.reason === 'date').length} date issues + {data.skipped.filter(r => r.reason === 'null').length} NULL columns
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--t3)', padding: '10px 0 0', marginTop: 14, borderTop: '1px solid var(--bdr)' }}>
          <span>Schema: {scopeName} · Datasource: Snowflake · Engine: Great Expectations 0.18.8</span>
          <span>Reports: data_quality_report.json · schema_report.json · table_level_report.json · skipped_columns_report.json</span>
        </div>
      </div>
    </div>
  );
}