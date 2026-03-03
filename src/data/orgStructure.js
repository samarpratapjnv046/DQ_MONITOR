// ══════════════════════════════════════════════════════════════
// ORGANIZATION HIERARCHY & DATA QUALITY METRICS
// Levels: Org → Domain → BU → Team → Project → Schema(Bronze/Silver/Gold) → Tables → Columns
// ══════════════════════════════════════════════════════════════

let _seed = 1;
const rng = (min, max) => {
  const x = Math.sin(_seed++) * 10000;
  return min + (x - Math.floor(x)) * (max - min);
};

// ── Generate 12 trend dates (every ~5 days going back from Feb 19 2026) ──
const generateTrendDates = () => {
  const dates = [];
  const base = new Date(2026, 1, 19);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i * 5);
    dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return dates;
};
const TREND_DATES = generateTrendDates();

// ── Column name pools by layer ──
const COLUMN_POOLS = {
  bronze: [
    'id', 'created_at', 'updated_at', 'source_system', 'raw_payload', 'ingestion_ts',
    'batch_id', 'file_name', 'row_hash', 'is_deleted', 'source_id', 'event_type',
    'record_date', 'partition_key', 'load_timestamp', 'raw_status', 'external_ref',
    'data_source', 'region_code', 'raw_amount',
  ],
  silver: [
    'entity_id', 'feature_1', 'feature_2', 'feature_3', 'feature_4', 'normalized_amt',
    'category_cd', 'is_valid', 'dedup_key', 'cleaned_date', 'derived_flag', 'segment_id',
    'std_name', 'geo_hash', 'quality_flag', 'transform_ts', 'join_key', 'lookup_val',
    'enriched_score', 'window_avg',
  ],
  gold: [
    'score', 'prediction', 'confidence', 'rank', 'percentile', 'label',
    'model_version', 'run_date', 'is_final', 'output_category', 'risk_tier',
    'recommendation', 'threshold_flag', 'agg_value', 'report_date', 'kpi_value',
    'summary_stat', 'final_status', 'publish_ts', 'audit_flag',
  ],
};

// ── Generate table-level DQ data (15 columns each) ──
const generateTableMetrics = (tableName, layer) => {
  const numCols = 15;
  const columns = [];
  const pool = COLUMN_POOLS[layer] || COLUMN_POOLS.bronze;
  for (let c = 0; c < numCols; c++) {
    const colName = pool[c % pool.length] + (c >= pool.length ? `_${c}` : '');
    const rulesCount = Math.floor(rng(2, 6));
    const passingRules = Math.floor(rulesCount * rng(0.7, 1.0));
    const nullRate = parseFloat(rng(0, 8).toFixed(2));
    const distinctPct = parseFloat(rng(20, 100).toFixed(1));
    const hasFailure = passingRules < rulesCount;
    columns.push({
      name: colName,
      dataType: ['STRING', 'INTEGER', 'FLOAT', 'TIMESTAMP', 'BOOLEAN', 'DATE'][Math.floor(rng(0, 6))],
      rulesCount, passingRules, failedRules: rulesCount - passingRules,
      passRate: rulesCount > 0 ? parseFloat(((passingRules / rulesCount) * 100).toFixed(1)) : 100,
      nullRate, distinctPct, hasFailure,
      failureTypes: hasFailure ? [['null_check', 'type_mismatch', 'range_violation', 'uniqueness', 'regex_fail'][Math.floor(rng(0, 5))]] : [],
    });
  }
  const totalRules = columns.reduce((s, c) => s + c.rulesCount, 0);
  const totalPass = columns.reduce((s, c) => s + c.passingRules, 0);
  const totalFail = totalRules - totalPass;
  const passRate = totalRules > 0 ? parseFloat(((totalPass / totalRules) * 100).toFixed(1)) : 100;
  const failingCols = columns.filter(c => c.hasFailure).length;
  const severity = totalFail > 5 ? 'Critical' : totalFail > 2 ? 'Error' : totalFail > 0 ? 'Warning' : 'Pass';
  return {
    name: tableName, columns, totalRules, totalPass, totalFail, passRate,
    totalCols: numCols, failingCols, severity,
    failureRate: totalRules > 0 ? parseFloat(((totalFail / totalRules) * 100).toFixed(2)) : 0,
  };
};

// ── Owner name pools ──
const SCHEMA_OWNERS = ['Arun Patel', 'Meera Joshi', 'Vikram Nair', 'Priya Reddy', 'Deepak Sharma', 'Kavya Menon', 'Suresh Iyer', 'Nisha Gupta', 'Rohit Bhat', 'Arjun Das'];
const SCHEMA_USERS_POOL = ['Rahul Singh', 'Anjali Desai', 'Kiran Rao', 'Pooja Thakur', 'Nikhil Verma', 'Swati Kulkarni', 'Manish Tiwari', 'Divya Pillai', 'Amit Saxena', 'Sonal Mishra', 'Tarun Chopra', 'Rekha Pandey'];
const DATA_STEWARDS = ['Ananya Nair', 'Siddharth Rao', 'Megha Kulkarni', 'Harsh Vardhan', 'Poornima Das', 'Rajiv Menon', 'Sneha Bhat', 'Tarun Prasad', 'Isha Sharma', 'Kunal Joshi'];
const SCHEMA_DATES = ['Jan 5, 2026 · 10:30 AM', 'Jan 12, 2026 · 2:15 PM', 'Jan 18, 2026 · 9:45 AM', 'Jan 24, 2026 · 11:00 AM', 'Feb 1, 2026 · 3:20 PM', 'Feb 6, 2026 · 8:50 AM'];
let _schemaIdx = 0;

// ── Generate schema-level metrics (Bronze/Silver/Gold) with 10 tables ──
const generateSchemaMetrics = (schemaName, displayName, layer, tableNames) => {
  const tables = tableNames.map(tn => generateTableMetrics(tn, layer));
  const totalRules = tables.reduce((s, t) => s + t.totalRules, 0);
  const totalPass = tables.reduce((s, t) => s + t.totalPass, 0);
  const totalFail = totalRules - totalPass;
  const totalTables = tables.length;
  const tablesWithFailures = tables.filter(t => t.totalFail > 0).length;
  const totalCols = tables.reduce((s, t) => s + t.totalCols, 0);
  const failingCols = tables.reduce((s, t) => s + t.failingCols, 0);
  const passRate = totalRules > 0 ? parseFloat(((totalPass / totalRules) * 100).toFixed(1)) : 100;

  const schemaValTotal = Math.floor(rng(20, 40));
  const schemaValPass = Math.floor(schemaValTotal * rng(0.82, 0.99));
  const schemaValRate = parseFloat(((schemaValPass / schemaValTotal) * 100).toFixed(1));
  const tableValTotal = totalTables;
  const tableValPass = totalTables;
  const dqRate = passRate;
  const overallHealth = parseFloat((0.6 * dqRate + 0.3 * schemaValRate + 0.1 * 100).toFixed(1));

  const typeMismatches = tables.reduce((s, t) => s + t.columns.filter(c => c.failureTypes.includes('type_mismatch')).length, 0);
  const dqFailures = totalFail;
  const nullIssues = tables.reduce((s, t) => s + t.columns.filter(c => c.failureTypes.includes('null_check')).length, 0);
  const rangeViolations = tables.reduce((s, t) => s + t.columns.filter(c => c.failureTypes.includes('range_violation')).length, 0);
  const issuesTotal = typeMismatches + dqFailures + nullIssues + rangeViolations || 1;

  const rulesNU = Math.floor(totalRules * rng(0.35, 0.5));
  const rulesMM = Math.floor(totalRules * rng(0.25, 0.4));
  const rulesRX = Math.floor(totalRules * rng(0.02, 0.06));
  const rulesRC = Math.max(0, totalRules - rulesNU - rulesMM - rulesRX);

  const trend = { health: [], schema: [], dq: [] };
  let h = overallHealth - rng(10, 18), s = schemaValRate - rng(12, 22), d = dqRate - rng(3, 7);
  for (let i = 0; i < 12; i++) {
    h = Math.min(overallHealth, h + rng(0.6, 2.0));
    s = Math.min(schemaValRate, s + rng(0.8, 2.5));
    d = Math.min(dqRate, d + rng(0.2, 0.9));
    trend.health.push(parseFloat(h.toFixed(1)));
    trend.schema.push(parseFloat(s.toFixed(1)));
    trend.dq.push(parseFloat(d.toFixed(1)));
  }

  const failingSorted = tables.filter(t => t.totalFail > 0)
    .sort((a, b) => b.failureRate - a.failureRate).slice(0, 7);
  // Re-space failure rates so consecutive items differ by 1-3%
  let baseRate = failingSorted.length > 0 ? failingSorted[0].failureRate : 0;
  const failingTables = failingSorted.map((t, idx) => {
    const rate = idx === 0 ? baseRate : Math.max(0, baseRate - rng(1, 3));
    baseRate = rate;
    return {
      name: t.name, failureRate: parseFloat(rate.toFixed(2)), severity: t.severity,
      skips: Math.floor(rng(0, 3)),
    };
  });

  const skippedCols = Math.floor(failingCols * rng(0.3, 0.6));

  const schemaOwner = SCHEMA_OWNERS[_schemaIdx % SCHEMA_OWNERS.length];
  const schemaSteward = DATA_STEWARDS[_schemaIdx % DATA_STEWARDS.length];
  const numUsers = 2 + Math.floor(rng(0, 3));
  const schemaUsers = [];
  for (let u = 0; u < numUsers; u++) {
    schemaUsers.push(SCHEMA_USERS_POOL[(_schemaIdx + u) % SCHEMA_USERS_POOL.length]);
  }
  const schemaCreated = SCHEMA_DATES[_schemaIdx % SCHEMA_DATES.length];
  _schemaIdx++;

  // Health tier: 1 (low) to 3 (high) based on overall health score
  const healthTier = overallHealth >= 90 ? 3 : overallHealth >= 80 ? 2 : 1;

  return {
    id: schemaName, name: displayName, type: 'schema', tables,
    owner: schemaOwner, dataSteward: schemaSteward, upstreamDownstreamUsers: schemaUsers, createdAt: schemaCreated,
    healthTier,
    metrics: {
      healthScore: overallHealth, passRate, coverage: 100,
      failedRate: totalRules > 0 ? parseFloat(((totalFail / totalRules) * 100).toFixed(2)) : 0,
      unmonitoredPct: totalCols > 0 ? parseFloat(((skippedCols / totalCols) * 100).toFixed(1)) : 0,
      tablesNeedingFixes: totalTables > 0 ? parseFloat(((tablesWithFailures / totalTables) * 100).toFixed(1)) : 0,
      schema: { total: schemaValTotal, passed: schemaValPass, rate: schemaValRate },
      table: { total: tableValTotal, passed: tableValPass, rate: 100 },
      dq: { total: totalRules, passed: totalPass, rate: dqRate },
      totalRules: schemaValTotal + tableValTotal + totalRules,
      totalPass: schemaValPass + tableValPass + totalPass,
      totalFail: (schemaValTotal - schemaValPass) + totalFail,
      totalTables, tablesWithFailures, totalCols, skippedCols,
      skippedTables: Math.floor(rng(0, tablesWithFailures)),
      issues: {
        total: issuesTotal,
        typeMismatches, typeMismatchPct: parseFloat(((typeMismatches / issuesTotal) * 100).toFixed(1)),
        dqFailures, dqFailurePct: parseFloat(((dqFailures / issuesTotal) * 100).toFixed(1)),
        dateSkips: rangeViolations, dateSkipPct: parseFloat(((rangeViolations / issuesTotal) * 100).toFixed(1)),
        nullSkips: nullIssues, nullSkipPct: parseFloat(((nullIssues / issuesTotal) * 100).toFixed(1)),
      },
      ruleDistribution: {
        nullUnique: totalRules > 0 ? parseFloat(((rulesNU / totalRules) * 100).toFixed(1)) : 0,
        meanMedian: totalRules > 0 ? parseFloat(((rulesMM / totalRules) * 100).toFixed(1)) : 0,
        regex: totalRules > 0 ? parseFloat(((rulesRX / totalRules) * 100).toFixed(1)) : 0,
        rowCol: totalRules > 0 ? parseFloat(((rulesRC / totalRules) * 100).toFixed(1)) : 0,
      },
      rulesPerTable: totalTables > 0 ? parseFloat((totalRules / totalTables).toFixed(1)) : 0,
      trend, trendDates: TREND_DATES, failingTables,
      runDate: 'Feb 19, 2026', runTime: '1:09 PM', duration: '52m 5s', runNumber: 12,
    },
  };
};

// ── Aggregate metrics from children ──
const aggregateMetrics = (children) => {
  if (!children || children.length === 0) return null;
  const cm = children.map(c => c.metrics).filter(Boolean);
  if (cm.length === 0) return null;
  const sum = (a, k) => a.reduce((s, m) => s + (typeof k === 'function' ? k(m) : m[k]), 0);
  const avg = (a, k) => sum(a, k) / a.length;

  const sT = sum(cm, m => m.schema.total), sP = sum(cm, m => m.schema.passed);
  const tT = sum(cm, m => m.table.total), tP = sum(cm, m => m.table.passed);
  const dT = sum(cm, m => m.dq.total), dP = sum(cm, m => m.dq.passed);
  const totR = sT + tT + dT, totP = sP + tP + dP, totF = totR - totP;
  const sR = sT ? parseFloat(((sP / sT) * 100).toFixed(1)) : 100;
  const tR = tT ? parseFloat(((tP / tT) * 100).toFixed(1)) : 100;
  const dR = dT ? parseFloat(((dP / dT) * 100).toFixed(1)) : 100;
  const pR = totR ? parseFloat(((totP / totR) * 100).toFixed(1)) : 100;
  const hS = parseFloat((0.6 * dR + 0.3 * sR + 0.1 * tR).toFixed(1));
  const totTbl = sum(cm, 'totalTables'), twf = sum(cm, 'tablesWithFailures');
  const totC = sum(cm, 'totalCols'), skC = sum(cm, 'skippedCols');
  const iT = sum(cm, m => m.issues.total);
  const tM = sum(cm, m => m.issues.typeMismatches), dF = sum(cm, m => m.issues.dqFailures);
  const dS = sum(cm, m => m.issues.dateSkips), nS = sum(cm, m => m.issues.nullSkips);

  const trend = { health: [], schema: [], dq: [] };
  for (let i = 0; i < 12; i++) {
    trend.health.push(parseFloat(avg(cm, m => m.trend.health[i]).toFixed(1)));
    trend.schema.push(parseFloat(avg(cm, m => m.trend.schema[i]).toFixed(1)));
    trend.dq.push(parseFloat(avg(cm, m => m.trend.dq[i]).toFixed(1)));
  }
  const allF = cm.flatMap(m => m.failingTables);
  allF.sort((a, b) => b.failureRate - a.failureRate);

  return {
    healthScore: hS, passRate: pR, coverage: 100,
    failedRate: totR ? parseFloat(((totF / totR) * 100).toFixed(2)) : 0,
    unmonitoredPct: totC ? parseFloat(((skC / totC) * 100).toFixed(1)) : 0,
    tablesNeedingFixes: totTbl ? parseFloat(((twf / totTbl) * 100).toFixed(1)) : 0,
    schema: { total: sT, passed: sP, rate: sR },
    table: { total: tT, passed: tP, rate: tR },
    dq: { total: dT, passed: dP, rate: dR },
    totalRules: totR, totalPass: totP, totalFail: totF, totalTables: totTbl,
    tablesWithFailures: twf, totalCols: totC, skippedCols: skC,
    skippedTables: sum(cm, 'skippedTables'),
    issues: {
      total: iT,
      typeMismatches: tM, typeMismatchPct: iT ? parseFloat(((tM / iT) * 100).toFixed(1)) : 0,
      dqFailures: dF, dqFailurePct: iT ? parseFloat(((dF / iT) * 100).toFixed(1)) : 0,
      dateSkips: dS, dateSkipPct: iT ? parseFloat(((dS / iT) * 100).toFixed(1)) : 0,
      nullSkips: nS, nullSkipPct: iT ? parseFloat(((nS / iT) * 100).toFixed(1)) : 0,
    },
    ruleDistribution: {
      nullUnique: parseFloat(avg(cm, m => m.ruleDistribution.nullUnique).toFixed(1)),
      meanMedian: parseFloat(avg(cm, m => m.ruleDistribution.meanMedian).toFixed(1)),
      regex: parseFloat(avg(cm, m => m.ruleDistribution.regex).toFixed(1)),
      rowCol: parseFloat(avg(cm, m => m.ruleDistribution.rowCol).toFixed(1)),
    },
    rulesPerTable: totTbl ? parseFloat((dT / totTbl).toFixed(1)) : 0,
    trend, trendDates: TREND_DATES, failingTables: allF.slice(0, 7),
    runDate: 'Feb 19, 2026', runTime: '1:09 PM', duration: '52m 5s', runNumber: 12,
  };
};

// ══════════════════════════════════════════════════════════════
// BUILD HIERARCHY
// ══════════════════════════════════════════════════════════════

const brnTN = (p) => [`raw_${p}_txn`, `raw_${p}_events`, `raw_${p}_master`, `raw_${p}_audit`, `raw_${p}_snap`, `raw_${p}_ingest`, `raw_${p}_stream`, `raw_${p}_ref`, `raw_${p}_stage`, `raw_${p}_archive`];
const slvTN = (p) => [`slv_${p}_clean`, `slv_${p}_dedup`, `slv_${p}_enrich`, `slv_${p}_feat`, `slv_${p}_norm`, `slv_${p}_join`, `slv_${p}_valid`, `slv_${p}_xform`, `slv_${p}_agg`, `slv_${p}_deriv`];
const gldTN = (p) => [`gld_${p}_score`, `gld_${p}_pred`, `gld_${p}_summ`, `gld_${p}_rpt`, `gld_${p}_out`, `gld_${p}_kpi`, `gld_${p}_final`, `gld_${p}_pub`, `gld_${p}_dash`, `gld_${p}_exp`];

const createProject = (name, starName, schemaNames, owner) => {
  const pfx = name.toLowerCase().replace(/[\s\-]+/g, '_').slice(0, 12);
  const children = [
    generateSchemaMetrics(schemaNames[0], schemaNames[0], 'bronze', brnTN(pfx)),
    generateSchemaMetrics(schemaNames[1], schemaNames[1], 'silver', slvTN(pfx)),
    generateSchemaMetrics(schemaNames[2], schemaNames[2], 'gold', gldTN(pfx)),
  ];
  return { id: name.toLowerCase().replace(/\s+/g, '_'), name, starName, type: 'project', owner, children, metrics: aggregateMetrics(children) };
};
const createTeam = (name, emoji, projects, owner) => {
  const t = { id: name.toLowerCase().replace(/\s+/g, '_'), name, emoji, type: 'team', owner, children: projects };
  t.metrics = aggregateMetrics(projects); return t;
};
const createBU = (name, emoji, teams, owner) => {
  const b = { id: name.toLowerCase().replace(/\s+/g, '_'), name, emoji, type: 'bu', owner, children: teams };
  b.metrics = aggregateMetrics(teams); return b;
};
const createDomain = (name, bus, owner) => {
  const d = { id: name.toLowerCase().replace(/\s+/g, '_'), name, type: 'domain', owner, children: bus };
  d.metrics = aggregateMetrics(bus); return d;
};

// ══════════════════════════════════════════════════════════════
// BFSI DOMAIN
// ══════════════════════════════════════════════════════════════
const bfsi = createDomain('BFSI', [
  createBU('Risk Analytics', '⚖️', [
    createTeam('Credit Risk Models', '💳', [
      createProject('PD Model Retail Mortgage', 'Bellatrix', ['raw_mortgage_apps', 'silver_pd_features', 'gold_pd_scores'], 'Ravi Kumar'),
      createProject('LGD Consumer Lending', 'Canopus', ['raw_recovery_data', 'silver_lgd_features', 'gold_lgd_estimates'], 'Sunita Rao'),
      createProject('IFRS 9 ECL Pipeline', 'Deneb', ['raw_staging_data', 'silver_ecl_calc', 'gold_ifrs9_output'], 'Harish Menon'),
    ], 'Pranav Deshmukh'),
    createTeam('Market Risk', '📉', [
      createProject('Historical VaR', 'Electra', ['raw_market_prices', 'silver_var_calc', 'gold_var_report'], 'Ananya Bose'),
      createProject('CVaR Expected Shortfall', 'Fomalhaut', ['raw_returns_data', 'silver_cvar_calc', 'gold_cvar_report'], 'Rajat Sinha'),
      createProject('Counterparty CVA', 'Gacrux', ['raw_counterparty_data', 'silver_cva_calc', 'gold_cva_report'], 'Kritika Jain'),
    ], 'Sameer Kulkarni'),
    createTeam('Stress Testing', '🔥', [
      createProject('Macro Scenario Loss', 'Hadar', ['raw_macro_data', 'silver_scenario_translation', 'gold_loss_estimates'], 'Vivek Nair'),
      createProject('Capital Adequacy', 'Izar', ['raw_capital_data', 'silver_cap_model', 'gold_capital_adequacy'], 'Neha Pillai'),
      createProject('Liquidity Stress', 'Jabbah', ['raw_liquidity_data', 'silver_liquidity_stress', 'gold_lcr_projection'], 'Aditya Ghosh'),
    ], 'Tanvi Shah'),
  ], 'Vikram Malhotra'),
  createBU('Fraud & Financial Crime', '🛡️', [
    createTeam('Transaction ML', '⚡', [
      createProject('Card Fraud Scoring', 'Kaus', ['raw_tx_stream', 'silver_fraud_features', 'gold_fraud_scores'], 'Priyanka Saxena'),
      createProject('Account Takeover Detection', 'Lesath', ['raw_login_events', 'silver_ato_features', 'gold_ato_scores'], 'Manav Gupta'),
      createProject('Synthetic Identity Detection', 'Mimosa', ['raw_identity_data', 'silver_synthetic_features', 'gold_synthetic_scores'], 'Ishita Dey'),
    ], 'Arjun Thakur'),
    createTeam('Graph Analytics', '🕸️', [
      createProject('Ring Fraud Network', 'Nashira', ['raw_tx_graph', 'silver_graph_edges', 'gold_ring_suspects'], 'Devika Nambiar'),
      createProject('Money Mule Network', 'Ogma', ['raw_account_graph', 'silver_mule_features', 'gold_mule_suspects'], 'Karthik Rajan'),
      createProject('Shared Device Detection', 'Peacock', ['raw_device_data', 'silver_device_graph', 'gold_device_alerts'], 'Shruti Patil'),
    ], 'Nitin Agarwal'),
    createTeam('AML Analytics', '🏴', [
      createProject('Transaction Monitoring', 'Quill', ['raw_monitoring_alerts', 'silver_rule_performance', 'gold_tuned_rules'], 'Gaurav Tiwari'),
      createProject('AML Risk Rating', 'Rastaban', ['raw_crr_inputs', 'silver_crr_model', 'gold_customer_risk'], 'Padma Iyer'),
      createProject('Cash Structuring Detection', 'Sabik', ['raw_cash_tx', 'silver_structuring_features', 'gold_structuring_alerts'], 'Rohan Chatterjee'),
    ], 'Meghna Reddy'),
  ], 'Siddharth Kapoor'),
  createBU('Customer Analytics', '👤', [
    createTeam('CLV Models', '💎', [
      createProject('12-Month CLV Prediction', 'Tabit', ['raw_banking_tx', 'silver_clv_features', 'gold_clv_scores'], 'Lakshmi Narayan'),
      createProject('Segment CLV Benchmarking', 'Ukdah', ['raw_segment_data', 'silver_clv_benchmarks', 'gold_clv_segments'], 'Varun Mehta'),
      createProject('Cross-Hold Revenue', 'Vega', ['raw_product_holdings', 'silver_revenue_potential', 'gold_cross_sell_value'], 'Pallavi Joshi'),
    ], 'Ashwin Prasad'),
    createTeam('Churn Prevention', '🔄', [
      createProject('Churn Propensity Model', 'Wasat', ['raw_churn_signals', 'silver_churn_features', 'gold_churn_scores'], 'Nandini Bhatt'),
      createProject('Early Churn Warning', 'Xamidimura', ['raw_engagement_data', 'silver_ew_signals', 'gold_churn_alerts'], 'Sanjay Kulkarni'),
      createProject('Win-Back Campaign', 'Yed', ['raw_winback_data', 'silver_wb_propensity', 'gold_winback_targets'], 'Tara Subramaniam'),
    ], 'Raghav Patel'),
    createTeam('Next Best Product', '🎯', [
      createProject('NBP Propensity Model', 'Zeta', ['raw_product_history', 'silver_nbp_features', 'gold_nbp_scores'], 'Maya Krishnan'),
      createProject('Bundle Recommendation', 'Ain', ['raw_bundle_data', 'silver_bundle_affinity', 'gold_bundle_recs'], 'Dinesh Choudhary'),
      createProject('Mortgage Pre-Qualification', 'Beid', ['raw_financial_data', 'silver_mortgage_features', 'gold_mortgage_scores'], 'Surbhi Mishra'),
    ], 'Anil Sharma'),
  ], 'Pooja Banerjee'),
], 'Ankit Mehta');

// ══════════════════════════════════════════════════════════════
// CPG DOMAIN
// ══════════════════════════════════════════════════════════════
const cpg = createDomain('CPG', [
  createBU('Supply Chain Analytics', '📦', [
    createTeam('Demand Forecasting', '📊', [
      createProject('SKU-Level Demand Forecast', 'Altair', ['raw_pos_data', 'silver_demand_features', 'gold_demand_forecast'], 'Aarav Chandra'),
      createProject('Seasonal Trend Analysis', 'Betelgeuse', ['raw_seasonal_data', 'silver_seasonal_features', 'gold_seasonal_forecast'], 'Bhavna Hegde'),
      createProject('New Product Launch Forecast', 'Capella', ['raw_launch_data', 'silver_launch_features', 'gold_launch_forecast'], 'Chirag Parmar'),
    ], 'Disha Srinivasan'),
    createTeam('Inventory Optimization', '🏭', [
      createProject('Safety Stock Optimization', 'Diphda', ['raw_inventory_data', 'silver_stock_features', 'gold_stock_levels'], 'Eshan Trivedi'),
      createProject('Warehouse Allocation', 'Enif', ['raw_warehouse_data', 'silver_allocation_model', 'gold_allocation_plan'], 'Falguni Vora'),
      createProject('Replenishment Scheduling', 'Furud', ['raw_replenishment_data', 'silver_schedule_model', 'gold_replenishment_plan'], 'Girish Menon'),
    ], 'Hema Ramesh'),
    createTeam('Logistics Analytics', '🚛', [
      createProject('Route Optimization', 'Gienah', ['raw_route_data', 'silver_route_features', 'gold_optimal_routes'], 'Isha Dutta'),
      createProject('Delivery Performance', 'Hamal', ['raw_delivery_data', 'silver_delivery_features', 'gold_delivery_scores'], 'Jayant Shetty'),
      createProject('Fleet Utilization', 'Izar_CPG', ['raw_fleet_data', 'silver_fleet_features', 'gold_fleet_utilization'], 'Komal Sethi'),
    ], 'Lalit Bhandari'),
  ], 'Manoj Desai'),
  createBU('Marketing Analytics', '📢', [
    createTeam('Campaign Performance', '🎯', [
      createProject('Multi-Channel Attribution', 'Kochab', ['raw_campaign_data', 'silver_attribution_model', 'gold_attribution_scores'], 'Namrata Jha'),
      createProject('ROI Optimization', 'Lesath_CPG', ['raw_spend_data', 'silver_roi_model', 'gold_roi_scores'], 'Om Prakash'),
      createProject('A/B Testing Analytics', 'Markab', ['raw_test_data', 'silver_test_analysis', 'gold_test_results'], 'Preeti Mahajan'),
    ], 'Quincy Lobo'),
    createTeam('Consumer Insights', '🔍', [
      createProject('Sentiment Analysis', 'Nunki', ['raw_reviews_data', 'silver_sentiment_features', 'gold_sentiment_scores'], 'Ritu Anand'),
      createProject('Purchase Behavior Clusters', 'Okab', ['raw_purchase_data', 'silver_cluster_features', 'gold_purchase_clusters'], 'Sahil Bajaj'),
      createProject('Brand Health Tracking', 'Phact', ['raw_brand_data', 'silver_brand_features', 'gold_brand_health'], 'Tanuja Kaur'),
    ], 'Uday Sengupta'),
    createTeam('Trade Promotion', '💰', [
      createProject('Promotion Effectiveness', 'Regulus', ['raw_promo_data', 'silver_promo_features', 'gold_promo_effectiveness'], 'Vandana Roy'),
      createProject('Price Elasticity', 'Sirius', ['raw_pricing_data', 'silver_price_model', 'gold_price_elasticity'], 'Wasim Khan'),
      createProject('Trade Spend Analytics', 'Thuban', ['raw_trade_data', 'silver_trade_features', 'gold_trade_analytics'], 'Yamini Rathore'),
    ], 'Zubin Contractor'),
  ], 'Kavita Nair'),
  createBU('Product Analytics', '🧪', [
    createTeam('Quality Control', '✅', [
      createProject('Defect Prediction', 'Unukalhai', ['raw_quality_data', 'silver_defect_features', 'gold_defect_scores'], 'Abhinav Pandey'),
      createProject('Batch Quality Scoring', 'Vindemiatrix', ['raw_batch_data', 'silver_batch_features', 'gold_batch_scores'], 'Bina Mohan'),
      createProject('Supplier Quality Rating', 'Wezen', ['raw_supplier_data', 'silver_supplier_features', 'gold_supplier_scores'], 'Chetan Bhagat'),
    ], 'Deepa Ramaswamy'),
    createTeam('Innovation Pipeline', '💡', [
      createProject('Concept Testing Analytics', 'Xuange', ['raw_concept_data', 'silver_concept_features', 'gold_concept_scores'], 'Eshwar Iyengar'),
      createProject('Ingredient Optimization', 'Yildun', ['raw_ingredient_data', 'silver_ingredient_model', 'gold_ingredient_optimal'], 'Fatima Shaikh'),
      createProject('Pack Size Analytics', 'Zaniah', ['raw_pack_data', 'silver_pack_features', 'gold_pack_scores'], 'Gopal Murthy'),
    ], 'Harini Suresh'),
    createTeam('Portfolio Management', '📋', [
      createProject('SKU Rationalization', 'Acamar', ['raw_sku_data', 'silver_sku_features', 'gold_sku_scores'], 'Indira Bhat'),
      createProject('Category Performance', 'Baten', ['raw_category_data', 'silver_category_features', 'gold_category_scores'], 'Jagdish Yadav'),
      createProject('Assortment Optimization', 'Cursa', ['raw_assortment_data', 'silver_assortment_model', 'gold_assortment_plan'], 'Kamini Das'),
    ], 'Lokesh Hegde'),
  ], 'Nishant Pillai'),
], 'Sneha Iyer');

// ══════════════════════════════════════════════════════════════
// ORGANIZATION
// ══════════════════════════════════════════════════════════════
const organization = { id: 'ada_global', name: 'ADA Global', type: 'org', owner: 'Rajesh Kapoor', children: [bfsi, cpg] };
organization.metrics = aggregateMetrics([bfsi, cpg]);

// ══════════════════════════════════════════════════════════════
// CONTEXTUAL "Next Level Down" failures
// ══════════════════════════════════════════════════════════════
export const getNextLevelFailures = (node) => {
  if (!node.children || node.children.length === 0) {
    return { label: 'Table', items: (node.metrics?.failingTables || []).map(t => ({ name: t.name, failureRate: t.failureRate, severity: t.severity, skips: t.skips, healthScore: parseFloat((100 - t.failureRate).toFixed(1)), type: 'table' })) };
  }
  const childType = node.children[0].type;
  const labels = { domain: 'Domain', bu: 'Business Unit', team: 'Team', project: 'Project', schema: 'Schema' };
  const rawItems = node.children.filter(c => c.metrics).map(c => {
    const m = c.metrics;
    const tier = c.healthTier || (m.healthScore >= 90 ? 3 : m.healthScore >= 80 ? 2 : 1);
    return {
      name: c.name, failureRate: m.failedRate || 0,
      severity: m.failedRate > 5 ? 'Critical' : m.failedRate > 2 ? 'Error' : m.failedRate > 0 ? 'Warning' : 'Pass',
      healthScore: m.healthScore, passRate: m.passRate,
      totalFail: m.totalFail, totalRules: m.totalRules,
      healthTier: tier,
      type: childType,
    };
  }).sort((a, b) => b.failureRate - a.failureRate).slice(0, 10);
  // Re-space so consecutive failure rates differ by 1-3%
  if (rawItems.length > 1) {
    let prev = rawItems[0].failureRate;
    for (let i = 1; i < rawItems.length; i++) {
      const diff = 1 + (((i * 7 + 3) % 3)); // deterministic 1-3
      const next = Math.max(0, parseFloat((prev - diff).toFixed(2)));
      rawItems[i].failureRate = next;
      rawItems[i].severity = next > 5 ? 'Critical' : next > 2 ? 'Error' : next > 0 ? 'Warning' : 'Pass';
      prev = next;
    }
  }
  return { label: labels[childType] || childType, items: rawItems };
};

// ══════════════════════════════════════════════════════════════
// USER ACCOUNTS
// ══════════════════════════════════════════════════════════════
export const users = [
  { email: 'org@adaglobal.com', password: 'org123', role: 'org', name: 'Admin (Org)', scopeId: 'ada_global', scopePath: [] },
  { email: 'bfsi@adaglobal.com', password: 'bfsi123', role: 'domain', name: 'BFSI Head', scopeId: 'bfsi', scopePath: ['bfsi'] },
  { email: 'cpg@adaglobal.com', password: 'cpg123', role: 'domain', name: 'CPG Head', scopeId: 'cpg', scopePath: ['cpg'] },
  { email: 'risk@adaglobal.com', password: 'risk123', role: 'bu', name: 'Risk Analytics Lead', scopeId: 'risk_analytics', scopePath: ['bfsi', 'risk_analytics'] },
  { email: 'fraud@adaglobal.com', password: 'fraud123', role: 'bu', name: 'Fraud Lead', scopeId: 'fraud_&_financial_crime', scopePath: ['bfsi', 'fraud_&_financial_crime'] },
  { email: 'custanalytics@adaglobal.com', password: 'cust123', role: 'bu', name: 'Customer Analytics Lead', scopeId: 'customer_analytics', scopePath: ['bfsi', 'customer_analytics'] },
  { email: 'supply@adaglobal.com', password: 'supply123', role: 'bu', name: 'Supply Chain Lead', scopeId: 'supply_chain_analytics', scopePath: ['cpg', 'supply_chain_analytics'] },
  { email: 'marketing@adaglobal.com', password: 'mkt123', role: 'bu', name: 'Marketing Analytics Lead', scopeId: 'marketing_analytics', scopePath: ['cpg', 'marketing_analytics'] },
  { email: 'product@adaglobal.com', password: 'prod123', role: 'bu', name: 'Product Analytics Lead', scopeId: 'product_analytics', scopePath: ['cpg', 'product_analytics'] },
  { email: 'creditrisk@adaglobal.com', password: 'cr123', role: 'team', name: 'Credit Risk Models Lead', scopeId: 'credit_risk_models', scopePath: ['bfsi', 'risk_analytics', 'credit_risk_models'] },
  { email: 'marketrisk@adaglobal.com', password: 'mr123', role: 'team', name: 'Market Risk Lead', scopeId: 'market_risk', scopePath: ['bfsi', 'risk_analytics', 'market_risk'] },
  { email: 'stresstesting@adaglobal.com', password: 'st123', role: 'team', name: 'Stress Testing Lead', scopeId: 'stress_testing', scopePath: ['bfsi', 'risk_analytics', 'stress_testing'] },
  { email: 'txml@adaglobal.com', password: 'tx123', role: 'team', name: 'Transaction ML Lead', scopeId: 'transaction_ml', scopePath: ['bfsi', 'fraud_&_financial_crime', 'transaction_ml'] },
  { email: 'graph@adaglobal.com', password: 'graph123', role: 'team', name: 'Graph Analytics Lead', scopeId: 'graph_analytics', scopePath: ['bfsi', 'fraud_&_financial_crime', 'graph_analytics'] },
  { email: 'aml@adaglobal.com', password: 'aml123', role: 'team', name: 'AML Analytics Lead', scopeId: 'aml_analytics', scopePath: ['bfsi', 'fraud_&_financial_crime', 'aml_analytics'] },
  { email: 'clv@adaglobal.com', password: 'clv123', role: 'team', name: 'CLV Models Lead', scopeId: 'clv_models', scopePath: ['bfsi', 'customer_analytics', 'clv_models'] },
  { email: 'churn@adaglobal.com', password: 'churn123', role: 'team', name: 'Churn Prevention Lead', scopeId: 'churn_prevention', scopePath: ['bfsi', 'customer_analytics', 'churn_prevention'] },
  { email: 'nbp@adaglobal.com', password: 'nbp123', role: 'team', name: 'Next Best Product Lead', scopeId: 'next_best_product', scopePath: ['bfsi', 'customer_analytics', 'next_best_product'] },
  { email: 'demand@adaglobal.com', password: 'dem123', role: 'team', name: 'Demand Forecasting Lead', scopeId: 'demand_forecasting', scopePath: ['cpg', 'supply_chain_analytics', 'demand_forecasting'] },
  { email: 'inventory@adaglobal.com', password: 'inv123', role: 'team', name: 'Inventory Lead', scopeId: 'inventory_optimization', scopePath: ['cpg', 'supply_chain_analytics', 'inventory_optimization'] },
  { email: 'logistics@adaglobal.com', password: 'log123', role: 'team', name: 'Logistics Lead', scopeId: 'logistics_analytics', scopePath: ['cpg', 'supply_chain_analytics', 'logistics_analytics'] },
  { email: 'campaign@adaglobal.com', password: 'camp123', role: 'team', name: 'Campaign Lead', scopeId: 'campaign_performance', scopePath: ['cpg', 'marketing_analytics', 'campaign_performance'] },
  { email: 'consumer@adaglobal.com', password: 'cons123', role: 'team', name: 'Consumer Insights Lead', scopeId: 'consumer_insights', scopePath: ['cpg', 'marketing_analytics', 'consumer_insights'] },
  { email: 'tradepromo@adaglobal.com', password: 'tp123', role: 'team', name: 'Trade Promotion Lead', scopeId: 'trade_promotion', scopePath: ['cpg', 'marketing_analytics', 'trade_promotion'] },
  { email: 'qc@adaglobal.com', password: 'qc123', role: 'team', name: 'Quality Control Lead', scopeId: 'quality_control', scopePath: ['cpg', 'product_analytics', 'quality_control'] },
  { email: 'innovation@adaglobal.com', password: 'innov123', role: 'team', name: 'Innovation Pipeline Lead', scopeId: 'innovation_pipeline', scopePath: ['cpg', 'product_analytics', 'innovation_pipeline'] },
  { email: 'portfolio@adaglobal.com', password: 'port123', role: 'team', name: 'Portfolio Lead', scopeId: 'portfolio_management', scopePath: ['cpg', 'product_analytics', 'portfolio_management'] },
  // ── Project-level users ──
  { email: 'pdmodel@adaglobal.com', password: 'pd123', role: 'project', name: 'PD Model Lead', scopeId: 'pd_model_retail_mortgage', scopePath: ['bfsi', 'risk_analytics', 'credit_risk_models', 'pd_model_retail_mortgage'] },
  { email: 'lgd@adaglobal.com', password: 'lgd123', role: 'project', name: 'LGD Lead', scopeId: 'lgd_consumer_lending', scopePath: ['bfsi', 'risk_analytics', 'credit_risk_models', 'lgd_consumer_lending'] },
  { email: 'cardfraud@adaglobal.com', password: 'cf123', role: 'project', name: 'Card Fraud Lead', scopeId: 'card_fraud_scoring', scopePath: ['bfsi', 'fraud_&_financial_crime', 'transaction_ml', 'card_fraud_scoring'] },
  { email: 'churnmodel@adaglobal.com', password: 'cm123', role: 'project', name: 'Churn Model Lead', scopeId: 'churn_propensity_model', scopePath: ['bfsi', 'customer_analytics', 'churn_prevention', 'churn_propensity_model'] },
  { email: 'skudemand@adaglobal.com', password: 'sku123', role: 'project', name: 'SKU Demand Lead', scopeId: 'sku-level_demand_forecast', scopePath: ['cpg', 'supply_chain_analytics', 'demand_forecasting', 'sku-level_demand_forecast'] },
  { email: 'sentiment@adaglobal.com', password: 'sent123', role: 'project', name: 'Sentiment Lead', scopeId: 'sentiment_analysis', scopePath: ['cpg', 'marketing_analytics', 'consumer_insights', 'sentiment_analysis'] },
  { email: 'defect@adaglobal.com', password: 'def123', role: 'project', name: 'Defect Prediction Lead', scopeId: 'defect_prediction', scopePath: ['cpg', 'product_analytics', 'quality_control', 'defect_prediction'] },
  { email: 'routeopt@adaglobal.com', password: 'route123', role: 'project', name: 'Route Optimization Lead', scopeId: 'route_optimization', scopePath: ['cpg', 'supply_chain_analytics', 'logistics_analytics', 'route_optimization'] },
];

export const findNode = (path) => {
  let current = organization;
  for (const segment of path) {
    if (!current.children) return null;
    current = current.children.find(c => c.id === segment);
    if (!current) return null;
  }
  return current;
};

export const getAccessibleTree = (user) => {
  if (user.role === 'org') return organization;
  let node = organization;
  for (const seg of user.scopePath) {
    node = node.children?.find(c => c.id === seg);
    if (!node) return null;
  }
  return node;
};

export const getNavigableItems = (rootNode, basePath = []) => {
  const items = [];
  const walk = (node, path) => {
    items.push({ ...node, path: [...path], children: undefined });
    if (node.children) node.children.forEach(child => walk(child, [...path, child.id]));
  };
  walk(rootNode, basePath);
  return items;
};

export const getAncestorChain = (scopePath) => {
  if (!scopePath || scopePath.length === 0) return [];
  const ancestors = [];
  ancestors.push({ node: organization, path: [] });
  let current = organization;
  for (let i = 0; i < scopePath.length - 1; i++) {
    const seg = scopePath[i];
    const child = current.children?.find(c => c.id === seg);
    if (!child) break;
    ancestors.push({ node: child, path: scopePath.slice(0, i + 1) });
    current = child;
  }
  return ancestors;
};

// ══════════════════════════════════════════════════════════════
// DYNAMIC TREE MUTATION HELPERS
// ══════════════════════════════════════════════════════════════

/**
 * Add a new project node to the team node at the given path.
 * Re-aggregates parent metrics after insertion.
 */
export const addProjectToNode = (teamPath, { projectName, ownerName, starName }) => {
  const teamNode = findNode(teamPath);
  if (!teamNode) return null;

  const id = projectName.toLowerCase().replace(/\s+/g, '_');
  // Check if project already exists
  if (teamNode.children?.find(c => c.id === id)) return teamNode.children.find(c => c.id === id);

  const newProject = {
    id,
    name: projectName,
    starName: starName || '',
    type: 'project',
    owner: ownerName,
    children: [],
    metrics: null,
  };

  if (!teamNode.children) teamNode.children = [];
  teamNode.children.push(newProject);

  // Re-aggregate metrics up the chain
  reAggregateFromPath(teamPath);

  return newProject;
};

/**
 * Add a new schema node to a project under the given path.
 * If the project doesn't exist, creates it first.
 * Re-aggregates parent metrics after insertion.
 */
export const addSchemaToNode = (basePath, { projectName, projectOwnerEmail, schemaName, tables }) => {
  // basePath points to where the attach form was opened (could be project or team)
  const baseNode = findNode(basePath);
  if (!baseNode) return null;

  let projectNode;
  let projectPath;

  if (baseNode.type === 'project') {
    projectNode = baseNode;
    projectPath = [...basePath];
  } else {
    // Try to find or create the project under this node
    const projectId = projectName.toLowerCase().replace(/\s+/g, '_');
    projectNode = baseNode.children?.find(c => c.id === projectId);
    if (!projectNode) {
      projectNode = addProjectToNode(basePath, { projectName, ownerName: projectOwnerEmail, starName: '' });
    }
    projectPath = [...basePath, projectNode.id];
  }

  if (!projectNode) return null;

  const schemaId = schemaName.toLowerCase().replace(/[\s\-]+/g, '_');
  // Check if schema already exists
  if (projectNode.children?.find(c => c.id === schemaId)) return projectNode.children.find(c => c.id === schemaId);

  // Parse tables
  const tableNames = tables
    ? tables.split(',').map(t => t.trim()).filter(Boolean)
    : ['TABLE_1', 'TABLE_2', 'TABLE_3'];

  // Generate a proper schema with metrics
  const newSchema = generateSchemaMetrics(schemaId, schemaName, 'bronze', tableNames);
  newSchema.owner = projectOwnerEmail;
  newSchema.pendingApproval = true;
  newSchema.approvalTimestamp = Date.now();

  // Find the team owner name from the parent team node
  // Walk up from project to find team-level ancestor
  for (let i = basePath.length - 1; i >= 0; i--) {
    const ancestor = findNode(basePath.slice(0, i + 1));
    if (ancestor && ancestor.type === 'team' && ancestor.owner) {
      newSchema.approverName = ancestor.owner;
      break;
    }
  }
  if (!newSchema.approverName) newSchema.approverName = 'Team Owner';

  if (!projectNode.children) projectNode.children = [];
  projectNode.children.push(newSchema);

  // Re-aggregate metrics from the project up
  projectNode.metrics = aggregateMetrics(projectNode.children);
  reAggregateFromPath(projectPath.slice(0, -1)); // re-aggregate from parent of project

  return newSchema;
};

/**
 * Walk up from the given path re-aggregating metrics at each level.
 */
const reAggregateFromPath = (path) => {
  // Re-aggregate from the deepest to the shallowest
  for (let i = path.length; i >= 0; i--) {
    const subPath = path.slice(0, i);
    const node = subPath.length === 0 ? organization : findNode(subPath);
    if (node && node.children) {
      node.metrics = aggregateMetrics(node.children);
    }
  }
};

export default organization;
