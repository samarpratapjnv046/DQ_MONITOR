import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { findNode } from '../data/orgStructure';
import { Lock, ShieldAlert } from 'lucide-react';
import KPIRow from '../components/KPIRow';
import LayersPanel from '../components/LayersPanel';
import IssuesPanel from '../components/IssuesPanel';
import FailingTables from '../components/FailingTables';
import RuleDistribution from '../components/RuleDistribution';
import TrendChart from '../components/TrendChart';
import DashboardHeader from '../components/DashboardHeader';

// Check if requestedPath is within user's allowed scope
const isWithinScope = (requestedSegments, scopePath) => {
  // The requested path must START with the full scopePath
  // e.g. scope=['bfsi','risk_analytics'], requested=['bfsi','risk_analytics'] → ok
  // e.g. scope=['bfsi','risk_analytics'], requested=['bfsi','risk_analytics','credit_risk_models'] → ok
  // e.g. scope=['bfsi','risk_analytics'], requested=['bfsi'] → NOT ok (ancestor)
  // e.g. scope=['bfsi','risk_analytics'], requested=['cpg'] → NOT ok (different branch)
  if (requestedSegments.length < scopePath.length) return false;
  for (let i = 0; i < scopePath.length; i++) {
    if (requestedSegments[i] !== scopePath[i]) return false;
  }
  return true;
};

export default function DashboardPage() {
  const { '*': pathParam } = useParams();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const { node, accessDenied } = useMemo(() => {
    if (!user) return { node: null, accessDenied: false };

    let segments;
    if (!pathParam || pathParam === '') {
      segments = user.scopePath;
    } else {
      segments = pathParam.split('/').filter(Boolean);
    }

    // Org users can access everything
    if (user.role !== 'org' && !isWithinScope(segments, user.scopePath)) {
      // Try to find the node so we can show its name in the denied message
      const deniedNode = findNode(segments);
      return { node: deniedNode, accessDenied: true };
    }

    return { node: findNode(segments), accessDenied: false };
  }, [user, pathParam]);

  // Access denied screen
  if (accessDenied) {
    const typeLabels = { org: 'Organization', domain: 'Domain', bu: 'Business Unit', team: 'Team', project: 'Project' };
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '16px', padding: '40px',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          background: 'var(--red-d)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShieldAlert size={28} color="var(--red)" />
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--t1)' }}>
          Access Restricted
        </div>
        <div style={{
          fontSize: '12px', color: 'var(--t2)', textAlign: 'center', maxWidth: '400px', lineHeight: 1.6,
        }}>
          {node ? (
            <>
              <strong style={{ color: 'var(--t1)' }}>{node.name}</strong> ({typeLabels[node.type] || node.type}) is above your access scope.
              This level is shown in your sidebar hierarchy for context, but dashboard access is restricted to your scope and below.
            </>
          ) : (
            'The requested level is outside your access scope.'
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px',
          color: 'var(--t3)', background: 'var(--elev)', padding: '8px 16px',
          borderRadius: 'var(--rs)', border: '1px solid var(--bdr)',
        }}>
          <Lock size={12} />
          Your scope: <strong style={{ color: 'var(--t1)', fontFamily: 'var(--mono)' }}>{user.scopePath.join(' → ') || 'Organization (full access)'}</strong>
        </div>
      </div>
    );
  }

  if (!node || !node.metrics) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--t3)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--t1)', marginBottom: '8px' }}>
          No data available
        </div>
        <div style={{ fontSize: '12px' }}>
          Select a node from the sidebar to view its data quality dashboard.
        </div>
      </div>
    );
  }

  const m = node.metrics;
  const typeLabel = node.type === 'org' ? 'Organization' : node.type === 'domain' ? 'Domain' :
    node.type === 'bu' ? 'Business Unit' : node.type === 'team' ? 'Team' :
    node.type === 'schema' ? 'Schema' : 'Project';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <DashboardHeader
        node={node}
        typeLabel={typeLabel}
        onRefresh={() => setRefreshKey(k => k + 1)}
      />

      <main style={{
        flex: 1, overflow: 'auto', padding: '14px 24px 10px',
        maxWidth: '1480px', margin: '0 auto', width: '100%',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }} key={refreshKey}>
        <KPIRow metrics={m} node={node} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <LayersPanel metrics={m} />
          <IssuesPanel metrics={m} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.7fr 1.1fr', gap: '10px', flex: 1, minHeight: '280px' }}>
          <FailingTables metrics={m} node={node} />
          <RuleDistribution metrics={m} />
          <TrendChart metrics={m} />
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '10px', color: 'var(--t3)', padding: '3px 0',
          borderTop: '1px solid var(--bdr)',
        }}>
          <span>Scope: {node.name} · Datasource: Snowflake · Sample: 10,000 rows</span>
          <span>Great Expectations 0.18.8 · Run #{m.runNumber}</span>
        </div>
      </main>
    </div>
  );
}
