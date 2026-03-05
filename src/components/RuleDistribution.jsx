import { useEffect, useRef } from 'react';

const CovBar = ({ label, pct, colorClass, delay }) => {
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => { if (ref.current) ref.current.style.width = `${pct}%`; }, 400 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  const gradients = {
    ba: 'linear-gradient(90deg, #3B82F6, #60A5FA)',
    ad: 'linear-gradient(90deg, #8B5CF6, #A78BFA)',
    cu: 'linear-gradient(90deg, #10B981, #34D399)',
    tl: 'linear-gradient(90deg, #06B6D4, #22D3EE)',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
      <div style={{ fontSize: '10px', color: 'var(--t2)', width: '95px', flexShrink: 0, lineHeight: 1.3 }}
        dangerouslySetInnerHTML={{ __html: label }}
      />
      <div style={{
        flex: 1, height: '16px', background: 'var(--bdr)',
        borderRadius: '5px', overflow: 'hidden', position: 'relative',
      }}>
        <div ref={ref} style={{
          height: '100%', borderRadius: '5px', width: '0%',
          background: gradients[colorClass],
          transition: 'width 1.2s cubic-bezier(.22,1,.36,1)',
        }} />
      </div>
      <div style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--t1)', width: '45px', textAlign: 'right', flexShrink: 0 }}>
        {pct}%
      </div>
    </div>
  );
};

export default function RuleDistribution({ metrics: m }) {
  return (
    <div className="anim d9" style={{
      background: 'var(--card)', border: '1px solid var(--bdr)',
      borderRadius: 'var(--r)', padding: '12px 14px',
    }}>
      <div style={{ fontSize: '11.5px', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{ fontSize: '13px' }}>▤</span> Rule Distribution by Type
      </div>
      <CovBar label="Null, Unique,<br>Range, Length" pct={m.ruleDistribution.nullUnique} colorClass="ba" delay={0} />
      <CovBar label="Mean, Median,<br>StdDev" pct={m.ruleDistribution.meanMedian} colorClass="ad" delay={100} />
      <CovBar label="Regex, Positive<br>Number" pct={m.ruleDistribution.regex} colorClass="cu" delay={200} />
      <CovBar label="Row Count,<br>Column Count" pct={m.ruleDistribution.rowCol} colorClass="tl" delay={300} />
      <div style={{
        marginTop: '8px', paddingTop: '6px', borderTop: '1px solid var(--bdr)',
        display: 'flex', justifyContent: 'space-between', fontSize: '9px',
        color: 'var(--t3)', fontFamily: 'var(--mono)',
      }}>
        <span>{m.dq.total.toLocaleString()} rules</span>
        <span>~{m.rulesPerTable} / table</span>
      </div>
    </div>
  );
}
