const KPICard = ({ color, icon, label, sublabel, value, valueColor, sub, delay }) => (
  <div className={`anim d${delay}`} style={{
    background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)',
    padding: '10px 12px', position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-h)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.transform = 'none'; }}
  >
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '2.5px',
      background: color, borderRadius: 'var(--r) var(--r) 0 0',
    }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
      <div style={{
        width: '24px', height: '24px', borderRadius: '6px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', background: `${color}1F`, color: color,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--t2)', lineHeight: 1.25 }}>
        {label}
        {sublabel && <><br /><span style={{ fontSize: '8px', color: 'var(--t3)' }}>{sublabel}</span></>}
      </div>
    </div>
    <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1, color: valueColor || color }}>
      {value}
    </div>
    <div style={{ fontSize: '9px', color: 'var(--t3)', marginTop: '4px', fontFamily: 'var(--mono)' }}>
      {sub}
    </div>
  </div>
);

export default function KPIRow({ metrics: m, node }) {
  const totalPassed = m.schema.passed + m.table.passed + m.dq.passed;
  const totalAll = m.schema.total + m.table.total + m.dq.total;
  const overallHealthAvg = totalAll > 0 ? ((totalPassed / totalAll) * 100).toFixed(1) : '0.0';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
      <KPICard delay={1} color="var(--green)" icon="⬡"
        label="Overall Health Score" sublabel="(Average of all validation layers)"
        value={`${overallHealthAvg}%`} sub={`${totalPassed.toLocaleString()} / ${totalAll.toLocaleString()} passed across all layers`} />
      <KPICard delay={2} color="var(--cyan)" icon="⊞"
        label="Schema Table Coverage" sublabel="(tables validated vs total)"
        value={`${m.coverage}%`} sub={`${m.totalTables} / ${m.totalTables} tables`} />
      <KPICard delay={3} color="var(--red)" icon="⚑"
        label="Failed Validation Rules" sublabel="(Data Type Check + Data Quality Check combined)"
        value={`${m.failedRate}%`} sub={`${m.totalFail} of ${m.totalRules.toLocaleString()} rules failed`} />
      <KPICard delay={4} color="var(--amber)" icon="⊘"
        label="Unmonitored Columns" sublabel="(bad dates or 100% NULL — no rules)"
        value={`${m.unmonitoredPct}%`} sub={`${m.skippedCols} cols across ${m.skippedTables} tables`} />
      {(() => {
        const flagged = Math.round((m.tablesNeedingFixes / 100) * m.totalTables);
        const pct = m.totalTables > 0 ? ((flagged / m.totalTables) * 100).toFixed(1) : '0.0';
        return (
          <KPICard delay={5} color="var(--purple)" icon="△"
            label="Tables Needing Fixes" sublabel="(data type check, data quality check, or skips)"
            value={`${pct}%`} sub={`${flagged} of ${m.totalTables} tables flagged`} />
        );
      })()}
    </div>
  );
}
