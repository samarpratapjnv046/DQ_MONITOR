import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const filters = [
  { key: 'health', label: 'Health', color: 'var(--green)', hex: '#34D399' },
  { key: 'schema', label: 'Schema', color: 'var(--purple)', hex: '#A78BFA' },
  { key: 'dq', label: 'Data Quality', color: 'var(--blue)', hex: '#60A5FA' },
  { key: 'all', label: 'All Layers', color: 'var(--amber)', hex: '#FBBF24' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--bdr)',
      borderRadius: '8px', padding: '8px 12px', fontSize: '10px',
    }}>
      <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--t1)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontFamily: 'var(--mono)', fontWeight: 500 }}>
          {p.name}: {p.value}%
        </div>
      ))}
    </div>
  );
};

export default function TrendChart({ metrics: m }) {
  const [active, setActive] = useState('health');

  const dates = m.trendDates || Array.from({ length: 12 }, (_, i) => `Run #${i + 1}`);

  const data = useMemo(() => {
    return dates.map((date, i) => ({
      name: date,
      Health: m.trend.health[i],
      Schema: m.trend.schema[i],
      'Data Quality': m.trend.dq[i],
    }));
  }, [m, dates]);

  const activeLines = active === 'all'
    ? [
      { key: 'Health', color: '#34D399' },
      { key: 'Schema', color: '#A78BFA' },
      { key: 'Data Quality', color: '#60A5FA' },
    ]
    : active === 'health'
      ? [{ key: 'Health', color: '#34D399' }]
      : active === 'schema'
        ? [{ key: 'Schema', color: '#A78BFA' }]
        : [{ key: 'Data Quality', color: '#60A5FA' }];

  return (
    <div className="anim d9" style={{
      background: 'var(--card)', border: '1px solid var(--bdr)',
      borderRadius: 'var(--r)', padding: '12px 14px',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
        <div style={{ fontSize: '11.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '13px' }}>📈</span> Score Trend Across Runs
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {filters.map(f => (
            <div
              key={f.key}
              onClick={() => setActive(f.key)}
              style={{
                fontSize: '9.5px', fontWeight: 600, padding: '4px 10px', borderRadius: '5px',
                cursor: 'pointer', transition: 'all 0.15s',
                border: `1px solid ${active === f.key ? `${f.hex}40` : 'var(--bdr)'}`,
                background: active === f.key ? `${f.hex}1F` : 'var(--elev)',
                color: active === f.key ? f.hex : 'var(--t3)',
              }}
            >
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bdr)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 8, fill: '#5A6580', fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: 'var(--bdr)' }}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#5A6580', fontFamily: 'JetBrains Mono' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `${v}%`}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            {activeLines.map(l => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                stroke={l.color}
                strokeWidth={2}
                dot={{ r: 2.5, fill: 'var(--card)', stroke: l.color, strokeWidth: 1.5 }}
                activeDot={{ r: 4, fill: l.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexShrink: 0 }}>
        {activeLines.map(l => (
          <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', color: 'var(--t3)' }}>
            <div style={{ width: '8px', height: '3px', borderRadius: '2px', background: l.color }} />
            {l.key}
          </div>
        ))}
      </div>
    </div>
  );
}
