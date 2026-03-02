import { useEffect, useRef } from 'react';

const CovBar = ({ label, pct, colorClass, delay }) => {
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => { if (ref.current) ref.current.style.width = `${pct}%`; }, 400 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  const gradients = {
    ba: 'linear-gradient(90deg, #60A5FA, #93c5fd)',
    ad: 'linear-gradient(90deg, #A78BFA, #c4b5fd)',
    cu: 'linear-gradient(90deg, #34D399, #6ee7b7)',
    tl: 'linear-gradient(90deg, #22D3EE, #67e8f9)',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
      <div style={{ fontSize: '10px', color: 'var(--t2)', width: '95px', flexShrink: 0, lineHeight: 1.3 }}
        dangerouslySetInnerHTML={{ __html: label }}
      />
      <div style={{
        flex: 1, height: '16px', background: 'rgba(255,255,255,0.03)',
        borderRadius: '5px', overflow: 'hidden', position: 'relative',
      }}>
        <div ref={ref} style={{
          height: '100%', borderRadius: '5px', width: '0%',
          background: gradients[colorClass],
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          paddingRight: '6px', fontSize: '9px', fontWeight: 600,
          fontFamily: 'var(--mono)', color: 'var(--bg)',
          transition: 'width 1.2s cubic-bezier(.22,1,.36,1)',
        }}>
          {pct}%
        </div>
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
