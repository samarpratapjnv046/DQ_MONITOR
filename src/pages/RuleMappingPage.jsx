import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { findNode } from '../data/orgStructure';
import { ArrowLeft, Search, Download, X, Loader2, CheckCircle2 } from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// RULES DEFINITION
// ══════════════════════════════════════════════════════════════
const RULES = [
  { id: 'null_check', name: 'Null Check', cat: 'Completeness', sev: 'Critical', type: 'column' },
  { id: 'unique_check', name: 'Uniqueness Check', cat: 'Uniqueness', sev: 'Critical', type: 'column' },
  { id: 'value_range', name: 'Value Range (min/max)', cat: 'Validity', sev: 'Warning', type: 'column' },
  { id: 'string_length', name: 'String Length Check', cat: 'Validity', sev: 'Warning', type: 'column' },
  { id: 'allowed_values', name: 'Allowed Values Set', cat: 'Validity', sev: 'Error', type: 'column' },
  { id: 'mean_drift', name: 'Mean Drift Detection', cat: 'Statistical', sev: 'Warning', type: 'column' },
  { id: 'stdev_drift', name: 'StdDev Drift Detection', cat: 'Statistical', sev: 'Warning', type: 'column' },
  { id: 'median_drift', name: 'Median Drift Detection', cat: 'Statistical', sev: 'Warning', type: 'column' },
  { id: 'positive_num', name: 'Positive Numbers Only', cat: 'Business Rule', sev: 'Error', type: 'column' },
  { id: 'alpha_only', name: 'Alphabetic Characters Only', cat: 'Business Rule', sev: 'Warning', type: 'column' },
  { id: 'url_format', name: 'URL Format Validation', cat: 'Business Rule', sev: 'Warning', type: 'column' },
  { id: 'row_count', name: 'Row Count in Expected Range', cat: 'Volume', sev: 'Error', type: 'table' },
  { id: 'col_count', name: 'Column Count Must Match', cat: 'Structure', sev: 'Critical', type: 'table' },
  { id: 'type_check', name: 'Column Type Must Match Schema', cat: 'Schema', sev: 'Critical', type: 'column' },
];

// ══════════════════════════════════════════════════════════════
// SELECTOR LIST COMPONENT
// ══════════════════════════════════════════════════════════════
function SelectorBox({ label, step, items, selected, onToggle, onSelectAll, onDeselectAll, emptyMsg, searchPlaceholder }) {
  const [query, setQuery] = useState('');
  const filtered = items.filter(it => it.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {step} {label}
        <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--t3)', background: 'var(--elev)', padding: '2px 7px', borderRadius: 4 }}>{selected.size} selected</span>
      </div>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 260 }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: '1px solid var(--bdr)', background: 'var(--elev)' }}>
          <Search size={12} color="var(--t3)" />
          <input placeholder={searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--t1)', fontFamily: 'var(--sans)', fontSize: 11.5, width: '100%' }} />
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderBottom: '1px solid var(--bdr)', background: 'var(--elev)' }}>
          <span onClick={onSelectAll} style={{ fontSize: 10, color: 'var(--blue)', cursor: 'pointer' }}>Select All</span>
          <span onClick={onDeselectAll} style={{ fontSize: 10, color: 'var(--t3)', cursor: 'pointer' }}>Deselect All</span>
        </div>
        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
          {items.length === 0 && <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: 11, color: 'var(--t3)' }}>{emptyMsg}</div>}
          {filtered.map(it => {
            const isSel = selected.has(it.id);
            return (
              <div key={it.id} onClick={() => onToggle(it.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer',
                  transition: 'background 0.12s', fontSize: 11.5, userSelect: 'none',
                  background: isSel ? 'rgba(96,165,250,0.08)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--card-h)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isSel ? 'rgba(96,165,250,0.08)' : 'transparent'; }}>
                <div style={{
                  width: 16, height: 16, border: `1.5px solid ${isSel ? 'var(--blue)' : 'var(--bdr-l)'}`,
                  borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: isSel ? 'var(--blue)' : 'transparent', color: isSel ? '#fff' : 'transparent', fontSize: 9,
                  transition: 'all 0.15s',
                }}>✓</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 500 }}>{it.label}</span>
                <span style={{ fontSize: 9, color: 'var(--t3)', marginLeft: 'auto' }}>{it.sub}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
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
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.c }} />{score}%
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function RuleMappingPage() {
  const { '*': pathParam } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const segments = pathParam?.split('/').filter(Boolean) || [];
  const node = findNode(segments);

  // ── Build tables/columns from schema data ──
  const schemaData = useMemo(() => {
    if (!node || !node.tables) return { tables: {}, tableNames: [] };
    const tables = {};
    node.tables.forEach(tbl => {
      tables[tbl.name] = tbl.columns.map(c => c.name);
    });
    return { tables, tableNames: Object.keys(tables).sort() };
  }, [node]);

  // ── Selection state ──
  const [selectedTables, setSelectedTables] = useState(new Set());
  const [selectedCols, setSelectedCols] = useState(new Set());
  const [selectedRules, setSelectedRules] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Result filters
  const [resSearch, setResSearch] = useState('');
  const [resFilterTable, setResFilterTable] = useState('');
  const [resFilterStatus, setResFilterStatus] = useState('');
  const [resFilterSeverity, setResFilterSeverity] = useState('');
  const [resFilterScore, setResFilterScore] = useState('');

  const scopeName = node?.name || 'Schema';

  // ── Available columns based on selected tables ──
  const availableCols = useMemo(() => {
    const colMap = new Map();
    selectedTables.forEach(t => {
      (schemaData.tables[t] || []).forEach(c => {
        if (!colMap.has(c)) colMap.set(c, []);
        colMap.get(c).push(t);
      });
    });
    return [...colMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([col, tbls]) => ({
      id: col, label: col, sub: tbls.length > 1 ? `${tbls.length} tables` : tbls[0].substring(0, 16),
    }));
  }, [selectedTables, schemaData]);

  // ── Toggle helpers ──
  const toggleSet = (setter, id) => {
    setter(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTable = (id) => {
    setSelectedTables(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllTables = () => setSelectedTables(new Set(schemaData.tableNames));
  const deselectAllTables = () => { setSelectedTables(new Set()); setSelectedCols(new Set()); };
  const selectAllCols = () => setSelectedCols(new Set(availableCols.map(c => c.id)));
  const deselectAllCols = () => setSelectedCols(new Set());
  const selectAllRules = () => setSelectedRules(new Set(RULES.map(r => r.id)));
  const deselectAllRules = () => setSelectedRules(new Set());

  // ── Calc total checks ──
  const totalChecks = useMemo(() => {
    const tableRules = RULES.filter(r => selectedRules.has(r.id) && r.type === 'table');
    const colRules = RULES.filter(r => selectedRules.has(r.id) && r.type === 'column');
    let count = tableRules.length * selectedTables.size;
    selectedTables.forEach(t => {
      const tCols = selectedCols.size > 0
        ? (schemaData.tables[t] || []).filter(c => selectedCols.has(c))
        : (schemaData.tables[t] || []);
      count += colRules.length * tCols.length;
    });
    return count;
  }, [selectedTables, selectedCols, selectedRules, schemaData]);

  const canRun = selectedTables.size > 0 && selectedRules.size > 0;

  // ── Chips ──
  const removeChip = (type, id) => {
    if (type === 'tbl') setSelectedTables(prev => { const n = new Set(prev); n.delete(id); return n; });
    else if (type === 'col') setSelectedCols(prev => { const n = new Set(prev); n.delete(id); return n; });
    else setSelectedRules(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const clearAll = () => { setSelectedTables(new Set()); setSelectedCols(new Set()); setSelectedRules(new Set()); setResults(null); };

  // ══════════ RUN VALIDATION ══════════
  const runValidation = () => {
    setLoading(true);
    setResults(null);
    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const tableRules = RULES.filter(r => selectedRules.has(r.id) && r.type === 'table');
      const colRules = RULES.filter(r => selectedRules.has(r.id) && r.type === 'column');
      const rows = [];
      let idx = 0;

      selectedTables.forEach(tbl => {
        // Table-level rules
        tableRules.forEach(rule => {
          const sc = Math.random() > 0.12 ? 100 : Math.floor(Math.random() * 80);
          rows.push({ table: tbl, column: 'TABLE-LEVEL', isTableLevel: true, rule: rule.name, cat: rule.cat, sev: rule.sev, score: sc, status: sc >= 80 ? 'Passed' : 'Failed', date: dateStr, time: fmtTime(idx), dur: (Math.random() * 2 + 0.5).toFixed(2) + 's' });
          idx++;
        });
        // Column-level rules
        const useCols = selectedCols.size > 0
          ? (schemaData.tables[tbl] || []).filter(c => selectedCols.has(c))
          : (schemaData.tables[tbl] || []);
        useCols.forEach(col => {
          colRules.forEach(rule => {
            const sc = Math.random() > 0.1 ? 100 : (Math.random() > 0.5 ? Math.floor(Math.random() * 20 + 60) : Math.floor(Math.random() * 60));
            rows.push({ table: tbl, column: col, isTableLevel: false, rule: rule.name, cat: rule.cat, sev: rule.sev, score: sc, status: sc >= 80 ? 'Passed' : 'Failed', date: dateStr, time: fmtTime(idx), dur: (Math.random() * 2 + 0.5).toFixed(2) + 's' });
            idx++;
          });
        });
      });

      const total = rows.length;
      const passed = rows.filter(r => r.status === 'Passed').length;
      setResults({ rows, total, passed, failed: total - passed, dur: (total * 0.8).toFixed(1) });
      setLoading(false);
    }, 1500);
  };

  function fmtTime(idx) {
    const now = new Date();
    const s = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + idx * 2;
    const h = Math.floor(s / 3600) % 24, m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  // ── Filter results ──
  const filteredResults = useMemo(() => {
    if (!results) return [];
    return results.rows.filter(r => {
      if (resSearch && !`${r.table} ${r.column} ${r.rule}`.toLowerCase().includes(resSearch.toLowerCase())) return false;
      if (resFilterTable && r.table !== resFilterTable) return false;
      if (resFilterStatus && r.status !== resFilterStatus) return false;
      if (resFilterSeverity && r.sev !== resFilterSeverity) return false;
      if (resFilterScore === 'green' && r.score < 80) return false;
      if (resFilterScore === 'yellow' && (r.score < 60 || r.score >= 80)) return false;
      if (resFilterScore === 'red' && r.score >= 60) return false;
      return true;
    });
  }, [results, resSearch, resFilterTable, resFilterStatus, resFilterSeverity, resFilterScore]);

  // ── CSV download ──
  const dlCSV = (filtered) => {
    const rows = filtered ? filteredResults : results?.rows || [];
    const headers = ['Table', 'Column', 'Rule', 'Category', 'Severity', 'Date', 'Time', 'Score', 'Duration', 'Status'];
    const csv = [headers.join(','), ...rows.map(r => [r.table, r.column, `"${r.rule}"`, r.cat, r.sev, r.date, r.time, r.score + '%', r.dur, r.status].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `rule_test_results${filtered ? '_filtered' : ''}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  // ── Not found ──
  if (!node || !node.tables) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>⬡</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Schema not found</div>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid var(--bdr)', background: 'var(--card)', color: 'var(--t2)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Go Back</button>
      </div>
    );
  }

  const thS = { fontSize: 9, fontWeight: 600, letterSpacing: 0.7, textTransform: 'uppercase', color: 'var(--t3)', textAlign: 'left', padding: '9px 12px', borderBottom: '1px solid var(--bdr)', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 2, whiteSpace: 'nowrap' };
  const tdS = { padding: '8px 12px', fontSize: 11.5, borderBottom: '1px solid var(--bdr)', verticalAlign: 'middle' };
  const selS = { background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', padding: '7px 10px', color: 'var(--t2)', fontFamily: 'var(--sans)', fontSize: 11, cursor: 'pointer', outline: 'none' };

  const tableItems = schemaData.tableNames.map(t => ({ id: t, label: t, sub: `${(schemaData.tables[t] || []).length} cols` }));
  const ruleItems = RULES.map(r => ({ id: r.id, label: r.name, sub: `${r.cat} · ${r.type === 'table' ? 'TABLE' : 'COLUMN'}` }));

  const chipCount = selectedTables.size + selectedCols.size + selectedRules.size;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ height: 48, background: 'var(--hdr-bg)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--bdr)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, var(--blue), var(--purple))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff' }}>RT</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Rule Mapping & Testing</div>
            <div style={{ fontSize: 10.5, color: 'var(--t2)' }}>{scopeName} · Map rules to tables & columns · Run validations on demand</div>
          </div>
        </div>
        <button onClick={() => navigate(`/dashboard/${segments.join('/')}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t2)', background: 'var(--card)', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--bdr)', cursor: 'pointer' }}>
          <ArrowLeft size={13} /> Back to Overview
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 28px 24px', maxWidth: 1520, margin: '0 auto', width: '100%' }}>

        {/* ═══ Mapping Panel ═══ */}
        <div className="anim d1" style={{ background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>⬡ Select Tables, Columns & Rules to Validate</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 16 }}>Pick one or many from each selector. Columns auto-populate based on selected tables. Use search within each list.</div>

          {/* 3-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <SelectorBox label="Tables" step="①" items={tableItems} selected={selectedTables}
              onToggle={toggleTable} onSelectAll={selectAllTables} onDeselectAll={deselectAllTables}
              emptyMsg="No tables available" searchPlaceholder="Search tables..." />
            <SelectorBox label="Columns" step="②" items={availableCols} selected={selectedCols}
              onToggle={id => toggleSet(setSelectedCols, id)} onSelectAll={selectAllCols} onDeselectAll={deselectAllCols}
              emptyMsg="Select tables first to see columns" searchPlaceholder="Search columns..." />
            <SelectorBox label="Rules" step="③" items={ruleItems} selected={selectedRules}
              onToggle={id => toggleSet(setSelectedRules, id)} onSelectAll={selectAllRules} onDeselectAll={deselectAllRules}
              emptyMsg="No rules" searchPlaceholder="Search rules..." />
          </div>

          {/* Chips area */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16, minHeight: 24, padding: '8px 12px',
            background: 'var(--bg)', border: `1px ${chipCount > 0 ? 'solid' : 'dashed'} var(--bdr)`, borderRadius: 'var(--rs)',
          }}>
            {chipCount === 0 && <span style={{ fontSize: 10.5, color: 'var(--t3)', fontStyle: 'italic' }}>Your selections will appear here...</span>}
            {[...selectedTables].map(t => <Chip key={`t-${t}`} label={t} color="var(--cyan)" borderColor="rgba(34,211,238,0.2)" onRemove={() => removeChip('tbl', t)} />)}
            {[...selectedCols].map(c => <Chip key={`c-${c}`} label={c} color="var(--purple)" borderColor="rgba(167,139,250,0.2)" onRemove={() => removeChip('col', c)} />)}
            {[...selectedRules].map(r => { const ru = RULES.find(x => x.id === r); return <Chip key={`r-${r}`} label={ru?.name || r} color="var(--blue)" borderColor="rgba(96,165,250,0.2)" onRemove={() => removeChip('rul', r)} />; })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={runValidation} disabled={!canRun || loading} style={{
              background: canRun ? 'linear-gradient(135deg, var(--blue), var(--purple))' : 'var(--elev)',
              color: canRun ? '#fff' : 'var(--t3)', border: 'none', padding: '10px 28px', borderRadius: 'var(--rs)',
              fontSize: 13, fontWeight: 700, cursor: canRun ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
            }}>▶ Run Validation</button>
            <button onClick={clearAll} style={{
              background: 'var(--elev)', color: 'var(--t2)', border: '1px solid var(--bdr)',
              padding: '10px 20px', borderRadius: 'var(--rs)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>✕ Clear All</button>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto', fontFamily: 'var(--mono)' }}>
              {canRun ? `${totalChecks} validation checks will be executed` : 'Select at least 1 table and 1 rule to run'}
            </div>
          </div>
        </div>

        {/* ═══ Loading ═══ */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
            <Loader2 size={20} color="var(--blue)" style={{ animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>Running validation checks...</span>
          </div>
        )}

        {/* ═══ Results ═══ */}
        {results && !loading && (
          <div className="anim d2">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>◎ Validation Results</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, fontFamily: 'var(--mono)', fontWeight: 600, background: 'var(--elev)', color: 'var(--t2)' }}>Duration: {results.dur}s</span>
                <span style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, fontFamily: 'var(--mono)', fontWeight: 600, background: 'var(--blue-d)', color: 'var(--blue)' }}>{results.total} checks executed</span>
              </div>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Overall Pass Rate', sub: '(all selected rules)', val: results.total ? ((results.passed / results.total) * 100).toFixed(1) + '%' : '0%', color: 'var(--green)', accent: 'var(--green)', detail: `${results.passed} / ${results.total} passed` },
                { label: 'Failed Checks', sub: '(score below threshold)', val: results.failed, color: results.failed ? 'var(--red)' : 'var(--green)', accent: 'var(--red)', detail: `${results.total ? ((results.failed / results.total) * 100).toFixed(1) : '0'}% failure rate` },
                { label: 'Tables Tested', sub: '(from selection)', val: selectedTables.size, color: 'var(--blue)', accent: 'var(--blue)', detail: `of ${schemaData.tableNames.length} total` },
                { label: 'Rules Applied', sub: '(from selection)', val: selectedRules.size, color: 'var(--purple)', accent: 'var(--purple)', detail: `of ${RULES.length} available` },
                { label: 'Columns Checked', sub: '(unique columns)', val: selectedCols.size || 'All', color: 'var(--amber)', accent: 'var(--amber)', detail: selectedCols.size ? 'manually selected' : 'auto (all columns)' },
              ].map((c, i) => (
                <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: c.accent }} />
                  <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--t2)', marginBottom: 5, lineHeight: 1.3 }}>{c.label}<br /><span style={{ fontSize: 8, color: 'var(--t3)' }}>{c.sub}</span></div>
                  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1, color: c.color }}>{c.val}</div>
                  <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 3, fontFamily: 'var(--mono)' }}>{c.detail}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', padding: '7px 12px', flex: '0 0 240px' }}>
                <Search size={13} color="var(--t3)" />
                <input placeholder="Search results..." value={resSearch} onChange={e => setResSearch(e.target.value)}
                  style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--t1)', fontFamily: 'var(--sans)', fontSize: 12, width: '100%' }} />
              </div>
              <select style={selS} value={resFilterTable} onChange={e => setResFilterTable(e.target.value)}>
                <option value="">All Tables</option>
                {[...selectedTables].sort().map(t => <option key={t}>{t}</option>)}
              </select>
              <select style={selS} value={resFilterStatus} onChange={e => setResFilterStatus(e.target.value)}>
                <option value="">All Statuses</option><option value="Passed">Passed</option><option value="Failed">Failed</option>
              </select>
              <select style={selS} value={resFilterSeverity} onChange={e => setResFilterSeverity(e.target.value)}>
                <option value="">All Severities</option><option value="Critical">Critical</option><option value="Error">Error</option><option value="Warning">Warning</option>
              </select>
              <select style={selS} value={resFilterScore} onChange={e => setResFilterScore(e.target.value)}>
                <option value="">All Scores</option><option value="green">≥ 80%</option><option value="yellow">60–80%</option><option value="red">&lt; 60%</option>
              </select>
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                <button onClick={() => dlCSV(false)} style={{ ...selS, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}><Download size={12} /> Full CSV</button>
                <button onClick={() => dlCSV(true)} style={{ ...selS, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}><Download size={12} /> Filtered</button>
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8, fontFamily: 'var(--mono)' }}>
              Showing {filteredResults.length} of {results.total} rows
            </div>

            {/* Results table */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
              <div style={{ maxHeight: 'calc(100vh - 520px)', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead><tr>{['Table', 'Column', 'Rule', 'Run Date', 'Run Time', 'Score', 'Duration', 'Status', 'Severity'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredResults.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>No rows match filters</td></tr>}
                    {filteredResults.map((r, i) => (
                      <tr key={i} style={{ transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--card-h)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={tdS}><span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 600, color: 'var(--cyan)' }}>{r.table}</span></td>
                        <td style={tdS}><span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 600, color: r.isTableLevel ? 'var(--t3)' : 'var(--t1)', fontStyle: r.isTableLevel ? 'italic' : 'normal' }}>{r.column}</span></td>
                        <td style={tdS}><span style={{ fontSize: 11, color: 'var(--t2)' }}>{r.rule}</span><span style={{ display: 'inline-block', fontSize: 8.5, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'var(--t3)', marginLeft: 5 }}>{r.cat}</span></td>
                        <td style={tdS}><span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)' }}>{r.date}</span></td>
                        <td style={tdS}><span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)' }}>{r.time}</span></td>
                        <td style={tdS}><ScoreBadge score={r.score} /></td>
                        <td style={tdS}><span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--t2)' }}>{r.dur}</span></td>
                        <td style={tdS}><span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: r.status === 'Passed' ? 'var(--green-d)' : 'var(--red-d)', color: r.status === 'Passed' ? 'var(--green)' : 'var(--red)' }}>{r.status}</span></td>
                        <td style={tdS}><span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: r.sev === 'Critical' ? 'var(--red-d)' : r.sev === 'Error' ? 'var(--amber-d)' : 'var(--blue-d)', color: r.sev === 'Critical' ? 'var(--red)' : r.sev === 'Error' ? 'var(--amber)' : 'var(--blue)' }}>{r.sev}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--t3)', padding: '10px 0 0', marginTop: 14, borderTop: '1px solid var(--bdr)' }}>
          <span>Schema: {scopeName} · Datasource: Snowflake · Engine: Great Expectations 0.18.8</span>
          <span>Rule Mapping & On-Demand Testing Interface</span>
        </div>
      </div>
    </div>
  );
}

// ── Chip component ──
function Chip({ label, color, borderColor, onRemove }) {
  return (
    <span style={{ fontSize: 10, background: 'var(--elev)', border: `1px solid ${borderColor}`, color, padding: '3px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      {label}
      <span onClick={e => { e.stopPropagation(); onRemove(); }} style={{ cursor: 'pointer', fontWeight: 700, opacity: 0.6, fontSize: 11 }}>✕</span>
    </span>
  );
}
