import { useEffect, useRef } from 'react';

const IssueBar = ({ color, label, pct, delay }) => {
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => { if (ref.current) ref.current.style.width = `${pct}%`; }, 400 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px',
      padding: '7px 10px', background: 'var(--elev)', borderRadius: 'var(--rs)',
    }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: '11px', color: 'var(--t2)' }}>{label}</div>
      <div style={{ width: '100px', height: '5px', background: 'var(--bdr)', borderRadius: '99px', overflow: 'hidden', flexShrink: 0 }}>
        <div ref={ref} style={{
          height: '100%', borderRadius: '99px', background: color,
          width: '0%', transition: 'width 1s ease',
        }} />
      </div>
      <div style={{ fontSize: '11px', fontWeight: 600, width: '45px', textAlign: 'right', color, fontFamily: 'var(--mono)' }}>
        {pct}%
      </div>
    </div>
  );
};

export default function IssuesPanel({ metrics: m }) {
  return (
    <div className="anim d8" style={{
      background: 'var(--card)', border: '1px solid var(--bdr)',
      borderRadius: 'var(--r)', padding: '12px 14px',
    }}>
      <div style={{ fontSize: '11.5px', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{ fontSize: '13px' }}>⊿</span> What Issues Were Found (% of {m.issues.total} total)
      </div>
      <IssueBar color="var(--red)" label="Column Type Mismatches (Schema)" pct={m.issues.typeMismatchPct} delay={0} />
      <IssueBar color="var(--amber)" label="Value / Range / Stats Failures (DQ)" pct={m.issues.dqFailurePct} delay={100} />
      <IssueBar color="var(--purple)" label="Dates Beyond Valid Range (Skipped)" pct={m.issues.dateSkipPct} delay={200} />
      <IssueBar color="var(--t3)" label="Entirely Empty Columns (Skipped)" pct={m.issues.nullSkipPct} delay={300} />
    </div>
  );
}
