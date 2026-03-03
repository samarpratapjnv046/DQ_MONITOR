import { useEffect, useRef } from 'react';

const layerStyles = {
  schema: {
    badge: { bg: 'var(--purple-d)', color: 'var(--purple)' },
    bar: 'linear-gradient(90deg, var(--purple), #c4b5fd)',
  },
  table: {
    badge: { bg: 'var(--cyan-d)', color: 'var(--cyan)' },
    bar: 'linear-gradient(90deg, var(--cyan), #67e8f9)',
  },
  dq: {
    badge: { bg: 'var(--blue-d)', color: 'var(--blue)' },
    bar: 'linear-gradient(90deg, var(--blue), #93c5fd)',
  },
};

const LayerBar = ({ label, layerKey, rate, passed, total }) => {
  const barRef = useRef(null);
  const style = layerStyles[layerKey];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = `${rate}%`;
    }, 400);
    return () => clearTimeout(timer);
  }, [rate]);

  const rateColor = rate >= 95 ? '#34D399' : rate >= 80 ? '#FBBF24' : '#F87171';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px',
      padding: '7px 10px', background: 'var(--elev)', borderRadius: 'var(--rs)',
    }}>
      <div style={{
        fontSize: '8.5px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
        padding: '3px 7px', borderRadius: '5px', width: '110px', textAlign: 'center',
        background: style.badge.bg, color: style.badge.color,
      }}>
        {label}
      </div>
      <div style={{ flex: 1, height: '6px', background: 'var(--bdr)', borderRadius: '99px', overflow: 'hidden' }}>
        <div ref={barRef} style={{
          height: '100%', borderRadius: '99px', width: '0%',
          background: style.bar,
          transition: 'width 1.2s cubic-bezier(.22,1,.36,1)',
        }} />
      </div>
      <div style={{ fontSize: '14px', fontWeight: 700, width: '60px', textAlign: 'right', color: rateColor, letterSpacing: '-0.3px' }}>
        {rate}%
      </div>
      <div style={{ fontSize: '9px', color: 'var(--t3)', fontFamily: 'var(--mono)', width: '75px', textAlign: 'right' }}>
        {passed.toLocaleString()} / {total.toLocaleString()}
      </div>
    </div>
  );
};

export default function LayersPanel({ metrics: m }) {
  return (
    <div className="anim d7" style={{
      background: 'var(--card)', border: '1px solid var(--bdr)',
      borderRadius: 'var(--r)', padding: '12px 14px',
    }}>
      <div style={{ fontSize: '11.5px', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{ fontSize: '13px' }}>◎</span> Pass Rate by Validation Layer
      </div>
      <LayerBar label="Datatype Check" layerKey="schema"
        rate={m.schema.rate} passed={m.schema.passed} total={m.schema.total} />
      <LayerBar label="Table level rule" layerKey="table"
        rate={m.table.rate} passed={m.table.passed} total={m.table.total} />
      <LayerBar label="Data Quality Check" layerKey="dq"
        rate={m.dq.rate} passed={m.dq.passed} total={m.dq.total} />
    </div>
  );
}
