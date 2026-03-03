import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { findNode } from '../data/orgStructure';
import { ArrowLeft, Search, Download } from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// DATA GENERATORS — deterministic from schema tables/columns
// (Reusing same logic to keep identical data, but we aggregate by table)
// ══════════════════════════════════════════════════════════════
const RULE_CATS = {
  'Null Check': 'Completeness', 'Uniqueness Check': 'Uniqueness', 'Value Range': 'Validity',
  'String Length Check': 'Validity', 'Allowed Values Set': 'Validity', 'Mean Drift Detection': 'Statistical',
  'StdDev Drift Detection': 'Statistical', 'Median Drift Detection': 'Statistical',
  'Positive Numbers Only': 'Business Rule', 'Alphabetic Only': 'Business Rule', 'URL Format': 'Pattern',
};
const DQ_RULES = Object.keys(RULE_CATS);

function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function generateSchemaTablesData(node) {
  if (!node || !node.tables) return [];

  return node.tables.map(tbl => {
    const rng = seededRng(hashStr(tbl.name));

    // Track stats for this specific table
    let schTotal = 0, schPass = 0;
    let dqTotal = 0, dqPass = 0;
    let skippedCols = 0;

    // Table rules (always 2)
    const tblTotal = 2;
    const tblPass = 2; // Hardcoded pass in original

    tbl.columns.forEach(col => {
      const cr = seededRng(hashStr(tbl.name + col.name));
      const colType = col.dataType || 'TEXT';
      const isDateCol = colType === 'TIMESTAMP' || colType === 'DATE';
      const isNullCol = col.nullRate > 95;

      // Skipped
      if ((isDateCol && cr() > 0.5) || (isNullCol && cr() > 0.6)) {
        skippedCols++;
      }

      // Schema rules
      schTotal++;
      if (cr() > 0.12) schPass++;

      // DQ rules
      const numRules = 2 + Math.floor(cr() * 4);
      for (let r = 0; r < numRules; r++) {
        dqTotal++;
        const passed = col.hasFailure ? cr() > 0.3 : cr() > 0.02;
        if (passed) dqPass++;
      }
    });

    const allTotal = tblTotal + schTotal + dqTotal;
    const allPass = tblPass + schPass + dqPass;

    return {
      tableName: tbl.name,
      allRate: allTotal > 0 ? ((allPass / allTotal) * 100).toFixed(1) : 100,
      schRate: schTotal > 0 ? ((schPass / schTotal) * 100).toFixed(1) : 100,
      tblRate: tblTotal > 0 ? ((tblPass / tblTotal) * 100).toFixed(1) : 100,
      dqRate: dqTotal > 0 ? ((dqPass / dqTotal) * 100).toFixed(1) : 100,
      skippedCols,
    };
  });
}

// ══════════════════════════════════════════════════════════════
// SCORE BADGE
// ══════════════════════════════════════════════════════════════
function ScoreBadge({ score, suffix = '%' }) {
  const numScore = parseFloat(score);
  const cls = numScore >= 80 ? 'green' : numScore >= 60 ? 'yellow' : 'red';
  const colors = { green: { bg: 'var(--green-d)', c: 'var(--green)' }, yellow: { bg: 'var(--amber-d)', c: 'var(--amber)' }, red: { bg: 'var(--red-d)', c: 'var(--red)' } };
  const s = colors[cls];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 5, background: s.bg, color: s.c }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.c }} />
      {score}{suffix}
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
  const tableData = useMemo(() => {
    if (!node || node.type !== 'schema') return null;
    return generateSchemaTablesData(node);
  }, [node]);

  // ── State ──
  const [search, setSearch] = useState('');

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

  if (!node || node.type !== 'schema' || !tableData) {
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
  const filteredRows = tableData.filter(r => {
    if (search && !r.tableName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── CSV download ──
  const downloadCSV = () => {
    const headers = ['Table Name', 'All Rules Pass Rate', 'Schema Rules Pass Rate', 'Table-Level Rules Pass Rate', 'Data Quality Rules Pass Rate', 'Skipped Columns'];
    const csv = [headers.join(','), ...filteredRows.map(r => [r.tableName, r.allRate + '%', r.schRate + '%', r.tblRate + '%', r.dqRate + '%', r.skippedCols].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `schema_tables_${scopeName}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Styles ──
  const thS = { fontSize: 9, fontWeight: 600, letterSpacing: 0.7, textTransform: 'uppercase', color: 'var(--t3)', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--bdr)', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 2, whiteSpace: 'nowrap' };
  const tdS = { padding: '12px 16px', fontSize: 11.5, borderBottom: '1px solid rgba(37,45,68,0.3)', verticalAlign: 'middle', cursor: 'pointer' };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ height: 48, background: 'var(--hdr-bg)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--bdr)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, var(--green), var(--blue))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff' }}>DQ</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Data Quality Monitor — Schema Tables</div>
            <div style={{ fontSize: 10.5, color: 'var(--t2)' }}>{scopeName} · All Tables</div>
          </div>
        </div>
        <button onClick={() => navigate(`/dashboard/${segments.join('/')}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t2)', background: 'var(--card)', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--bdr)', cursor: 'pointer' }}>
          <ArrowLeft size={13} /> Back to Overview
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        <div className="anim d2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', padding: '7px 12px', width: 300 }}>
            <Search size={13} color="var(--t3)" />
            <input placeholder="Search tables..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--t1)', fontFamily: 'var(--sans)', fontSize: 12, width: '100%' }} />
          </div>
          <button onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', padding: '7px 12px', color: 'var(--t2)', fontSize: 11, cursor: 'pointer' }}>
            <Download size={12} /> Download CSV
          </button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 12, fontFamily: 'var(--mono)' }}>
          Showing {filteredRows.length} of {tableData.length} tables
        </div>

        {/* Main data table */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={thS}>Table Name</th>
                  <th style={thS}>All Rules Pass Rate</th>
                  <th style={thS}>Schema Rules Pass Rate</th>
                  <th style={thS}>Table-Level Rules Pass Rate</th>
                  <th style={thS}>DQ Rules Pass Rate</th>
                  <th style={thS}>Skipped Columns</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', fontSize: 12, color: 'var(--t3)' }}>No tables match the search criteria</td></tr>
                )}
                {filteredRows.map((r, i) => (
                  <tr key={r.tableName}
                    onClick={() => navigate(`/dashboard/table/${r.tableName}/${segments.join('/')}`)}
                    style={{ transition: 'background 0.12s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--card-h)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdS}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: 'var(--cyan)' }}>
                        {r.tableName}
                      </span>
                    </td>
                    <td style={tdS}><ScoreBadge score={r.allRate} /></td>
                    <td style={tdS}><ScoreBadge score={r.schRate} /></td>
                    <td style={tdS}><ScoreBadge score={r.tblRate} /></td>
                    <td style={tdS}><ScoreBadge score={r.dqRate} /></td>
                    <td style={tdS}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: r.skippedCols > 0 ? 'var(--amber-d)' : 'transparent', color: r.skippedCols > 0 ? 'var(--amber)' : 'var(--t3)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: r.skippedCols > 0 ? 700 : 500 }}>
                        {r.skippedCols}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--t3)', padding: '16px 0 0', marginTop: 16, borderTop: '1px solid var(--bdr)' }}>
          <span>Schema: {scopeName} · Datasource: Snowflake · Engine: Great Expectations 0.18.8</span>
          <span>Click on any table row to view detailed rules.</span>
        </div>
      </div>
    </div>
  );
}