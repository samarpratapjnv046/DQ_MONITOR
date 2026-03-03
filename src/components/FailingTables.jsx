import { useMemo } from 'react';
import { getNextLevelFailures } from '../data/orgStructure';

const sevColors = {
  Critical: { bg: 'var(--red-d)', color: 'var(--red)' },
  Error: { bg: 'var(--amber-d)', color: 'var(--amber)' },
  Warning: { bg: 'var(--blue-d)', color: 'var(--blue)' },
  Pass: { bg: 'rgba(52,211,153,0.1)', color: 'var(--green)' },
};

export default function FailingTables({ metrics: m, node }) {
  const { label, items } = useMemo(() => getNextLevelFailures(node), [node]);
  const isTableView = label === 'Table';

  return (
    <div className="anim d9" style={{
      background: 'var(--card)', border: '1px solid var(--bdr)',
      borderRadius: 'var(--r)', padding: '12px 14px',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ fontSize: '11.5px', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
        <span style={{ fontSize: '13px' }}>⚑</span>
        Top {label} Validation Failures — Sorted by Failure Rate
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              {isTableView
                ? ['Table', 'Validation Failure %', 'Severity', 'Health Score'].map(h => <th key={h} style={thStyle}>{h}</th>)
                : [label, 'Validation Failure %', 'Severity', 'Health Score'].map(h => <th key={h} style={thStyle}>{h}</th>)
              }
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: 'var(--t3)' }}>
                No failures found ✓
              </td></tr>
            )}
            {items.map((t, i) => {
              const sev = sevColors[t.severity] || sevColors.Warning;
              const rateColor = t.failureRate > 10 ? 'var(--red)' : t.failureRate > 5 ? 'var(--amber)' : t.failureRate > 0 ? 'var(--t2)' : 'var(--green)';

              if (isTableView) {
                return (
                  <tr key={i} style={{ transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--card-h)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '10px' }}>{t.name}</span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 600, color: rateColor }}>
                      {t.failureRate.toFixed(2)}%
                    </td>
                    <td style={tdStyle}>
                      <span style={{ ...badgeStyle, background: sev.bg, color: sev.color }}>{t.severity}</span>
                    </td>
                    <td style={tdStyle}>
                      {(() => {
                        const hs = t.healthScore || 0;
                        const hsColor = hs >= 90 ? 'var(--green)' : hs >= 80 ? 'var(--amber)' : 'var(--red)';
                        const hsBg = hs >= 90 ? 'rgba(52,211,153,0.12)' : hs >= 80 ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)';
                        return (
                          <span style={{ ...badgeStyle, background: hsBg, color: hsColor }}>
                            {hs}%
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={i} style={{ transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--card-h)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600, fontSize: '10px' }}>{t.name}</span>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 600, color: rateColor }}>
                    {t.failureRate.toFixed(2)}%
                  </td>
                  <td style={tdStyle}>
                    <span style={{ ...badgeStyle, background: sev.bg, color: sev.color }}>{t.severity}</span>
                  </td>
                  <td style={tdStyle}>
                    {(() => {
                      const hs = t.healthScore || 0;
                      const hsColor = hs >= 90 ? 'var(--green)' : hs >= 80 ? 'var(--amber)' : 'var(--red)';
                      const hsBg = hs >= 90 ? 'rgba(52,211,153,0.12)' : hs >= 80 ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)';
                      return (
                        <span style={{ ...badgeStyle, background: hsBg, color: hsColor }}>
                          {hs}%
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ textAlign: 'center', padding: '6px 0 2px', fontSize: '9px', color: 'var(--t3)' }}>
          {items.length} {label.toLowerCase()}{items.length !== 1 ? 's' : ''} with failures
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  fontSize: '9px', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase',
  color: 'var(--t3)', textAlign: 'left', padding: '5px 8px',
  borderBottom: '1px solid var(--bdr)',
};
const tdStyle = { padding: '6px 8px', borderBottom: '1px solid var(--bdr)' };
const badgeStyle = {
  fontSize: '8.5px', fontWeight: 600, letterSpacing: '0.4px',
  textTransform: 'uppercase', padding: '2px 7px', borderRadius: '4px',
};
