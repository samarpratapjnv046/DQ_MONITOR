import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Table2, Search, ChevronRight, Shield, AlertTriangle, CheckCircle2, Eye } from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// RULES DEFINITION (same as RuleMappingPage)
// ══════════════════════════════════════════════════════════════
const RULES = [
    { id: 'null_check', name: 'Null Check', cat: 'Completeness', sev: 'Critical', type: 'column' },
    { id: 'unique_check', name: 'Uniqueness Check', cat: 'Uniqueness', sev: 'Critical', type: 'column' },
    { id: 'value_range', name: 'Value Range (min/max)', cat: 'Validity', sev: 'Warning', type: 'column' },
    { id: 'string_length', name: 'String Length Check', cat: 'Validity', sev: 'Warning', type: 'column' },
    { id: 'allowed_values', name: 'Allowed Values Set', cat: 'Validity', sev: 'Error', type: 'column' },
    { id: 'mean_drift', name: 'Mean Drift Detection', cat: 'Statistical', sev: 'Warning', type: 'column' },
    { id: 'stdev_drift', name: 'StdDev Drift Detection', cat: 'Statistical', sev: 'Warning', type: 'column' },
    { id: 'median_drift', name: 'Median Drift Detection', cat: 'Statistical', sev: 'Warning', type: 'column' },
    { id: 'positive_num', name: 'Positive Numbers Only', cat: 'Business Rule', sev: 'Error', type: 'column' },
    { id: 'alpha_only', name: 'Alphabetic Characters Only', cat: 'Business Rule', sev: 'Warning', type: 'column' },
    { id: 'url_format', name: 'URL Format Validation', cat: 'Business Rule', sev: 'Warning', type: 'column' },
    { id: 'row_count', name: 'Row Count in Expected Range', cat: 'Volume', sev: 'Error', type: 'table' },
    { id: 'col_count', name: 'Column Count Must Match', cat: 'Structure', sev: 'Critical', type: 'table' },
    { id: 'type_check', name: 'Column Type Must Match Schema', cat: 'Schema', sev: 'Critical', type: 'column' },
];

// ══════════════════════════════════════════════════════════════
// COLUMN DEFINITIONS PER TABLE (deterministic mock)
// ══════════════════════════════════════════════════════════════
const TABLE_COLUMNS = {
    // RAW_TRANSACTIONS
    TXN_HEADER: [
        { name: 'txn_id', type: 'VARCHAR(64)' },
        { name: 'txn_date', type: 'TIMESTAMP' },
        { name: 'customer_id', type: 'VARCHAR(32)' },
        { name: 'merchant_id', type: 'VARCHAR(32)' },
        { name: 'amount', type: 'DECIMAL(18,2)' },
        { name: 'currency', type: 'VARCHAR(3)' },
        { name: 'channel', type: 'VARCHAR(20)' },
        { name: 'status', type: 'VARCHAR(16)' },
        { name: 'created_at', type: 'TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP' },
    ],
    TXN_LINE_ITEMS: [
        { name: 'line_id', type: 'VARCHAR(64)' },
        { name: 'txn_id', type: 'VARCHAR(64)' },
        { name: 'product_code', type: 'VARCHAR(32)' },
        { name: 'quantity', type: 'INTEGER' },
        { name: 'unit_price', type: 'DECIMAL(18,2)' },
        { name: 'discount', type: 'DECIMAL(18,2)' },
        { name: 'line_total', type: 'DECIMAL(18,2)' },
        { name: 'tax_rate', type: 'DECIMAL(5,2)' },
    ],
    TXN_PAYMENTS: [
        { name: 'payment_id', type: 'VARCHAR(64)' },
        { name: 'txn_id', type: 'VARCHAR(64)' },
        { name: 'payment_method', type: 'VARCHAR(20)' },
        { name: 'amount', type: 'DECIMAL(18,2)' },
        { name: 'payment_date', type: 'TIMESTAMP' },
        { name: 'auth_code', type: 'VARCHAR(32)' },
        { name: 'status', type: 'VARCHAR(16)' },
    ],
    TXN_REFUNDS: [
        { name: 'refund_id', type: 'VARCHAR(64)' },
        { name: 'txn_id', type: 'VARCHAR(64)' },
        { name: 'reason_code', type: 'VARCHAR(20)' },
        { name: 'refund_amount', type: 'DECIMAL(18,2)' },
        { name: 'refund_date', type: 'TIMESTAMP' },
        { name: 'status', type: 'VARCHAR(16)' },
    ],
    TXN_AUDIT_LOG: [
        { name: 'audit_id', type: 'VARCHAR(64)' },
        { name: 'txn_id', type: 'VARCHAR(64)' },
        { name: 'action', type: 'VARCHAR(32)' },
        { name: 'performed_by', type: 'VARCHAR(64)' },
        { name: 'timestamp', type: 'TIMESTAMP' },
        { name: 'details', type: 'TEXT' },
    ],
    // CUSTOMER_360
    DIM_CUSTOMER: [
        { name: 'customer_id', type: 'VARCHAR(32)' },
        { name: 'first_name', type: 'VARCHAR(64)' },
        { name: 'last_name', type: 'VARCHAR(64)' },
        { name: 'email', type: 'VARCHAR(128)' },
        { name: 'phone', type: 'VARCHAR(20)' },
        { name: 'segment', type: 'VARCHAR(20)' },
        { name: 'created_at', type: 'TIMESTAMP' },
        { name: 'is_active', type: 'BOOLEAN' },
    ],
    DIM_ACCOUNT: [
        { name: 'account_id', type: 'VARCHAR(32)' },
        { name: 'customer_id', type: 'VARCHAR(32)' },
        { name: 'account_type', type: 'VARCHAR(20)' },
        { name: 'balance', type: 'DECIMAL(18,2)' },
        { name: 'open_date', type: 'DATE' },
        { name: 'status', type: 'VARCHAR(16)' },
        { name: 'branch_code', type: 'VARCHAR(10)' },
    ],
    DIM_REGION: [
        { name: 'region_id', type: 'VARCHAR(16)' },
        { name: 'region_name', type: 'VARCHAR(64)' },
        { name: 'country', type: 'VARCHAR(32)' },
        { name: 'timezone', type: 'VARCHAR(32)' },
        { name: 'currency', type: 'VARCHAR(3)' },
    ],
    FACT_CUSTOMER_EVENTS: [
        { name: 'event_id', type: 'VARCHAR(64)' },
        { name: 'customer_id', type: 'VARCHAR(32)' },
        { name: 'event_type', type: 'VARCHAR(32)' },
        { name: 'event_date', type: 'TIMESTAMP' },
        { name: 'channel', type: 'VARCHAR(20)' },
        { name: 'metadata', type: 'VARIANT' },
    ],
    FACT_LIFETIME_VALUE: [
        { name: 'customer_id', type: 'VARCHAR(32)' },
        { name: 'ltv_score', type: 'DECIMAL(10,2)' },
        { name: 'total_revenue', type: 'DECIMAL(18,2)' },
        { name: 'total_orders', type: 'INTEGER' },
        { name: 'avg_order_value', type: 'DECIMAL(18,2)' },
        { name: 'last_purchase_date', type: 'DATE' },
        { name: 'prediction_date', type: 'DATE' },
    ],
    // RISK_MODELS
    FACT_RISK_SCORES: [
        { name: 'score_id', type: 'VARCHAR(64)' },
        { name: 'entity_id', type: 'VARCHAR(32)' },
        { name: 'risk_score', type: 'DECIMAL(5,2)' },
        { name: 'model_version', type: 'VARCHAR(16)' },
        { name: 'score_date', type: 'TIMESTAMP' },
        { name: 'risk_tier', type: 'VARCHAR(16)' },
        { name: 'confidence', type: 'DECIMAL(5,4)' },
    ],
    DIM_RISK_FACTORS: [
        { name: 'factor_id', type: 'VARCHAR(32)' },
        { name: 'factor_name', type: 'VARCHAR(64)' },
        { name: 'weight', type: 'DECIMAL(5,4)' },
        { name: 'category', type: 'VARCHAR(32)' },
        { name: 'is_active', type: 'BOOLEAN' },
    ],
    FACT_PD_ESTIMATES: [
        { name: 'estimate_id', type: 'VARCHAR(64)' },
        { name: 'entity_id', type: 'VARCHAR(32)' },
        { name: 'pd_value', type: 'DECIMAL(7,6)' },
        { name: 'lgd_value', type: 'DECIMAL(5,4)' },
        { name: 'ead_value', type: 'DECIMAL(18,2)' },
        { name: 'model_version', type: 'VARCHAR(16)' },
        { name: 'calc_date', type: 'DATE' },
    ],
    DIM_MODEL_VERSION: [
        { name: 'version_id', type: 'VARCHAR(16)' },
        { name: 'model_name', type: 'VARCHAR(64)' },
        { name: 'release_date', type: 'DATE' },
        { name: 'status', type: 'VARCHAR(16)' },
        { name: 'accuracy', type: 'DECIMAL(5,4)' },
        { name: 'created_by', type: 'VARCHAR(64)' },
    ],
    FACT_BACKTESTING: [
        { name: 'test_id', type: 'VARCHAR(64)' },
        { name: 'model_version', type: 'VARCHAR(16)' },
        { name: 'test_date', type: 'DATE' },
        { name: 'predicted', type: 'DECIMAL(10,4)' },
        { name: 'actual', type: 'DECIMAL(10,4)' },
        { name: 'deviation', type: 'DECIMAL(8,4)' },
        { name: 'pass_fail', type: 'VARCHAR(8)' },
    ],
    // PRODUCT_CATALOG
    DIM_PRODUCT: [
        { name: 'product_id', type: 'VARCHAR(32)' },
        { name: 'product_name', type: 'VARCHAR(128)' },
        { name: 'category_id', type: 'VARCHAR(16)' },
        { name: 'price', type: 'DECIMAL(18,2)' },
        { name: 'sku', type: 'VARCHAR(32)' },
        { name: 'is_active', type: 'BOOLEAN' },
        { name: 'created_at', type: 'TIMESTAMP' },
    ],
    DIM_CATEGORY: [
        { name: 'category_id', type: 'VARCHAR(16)' },
        { name: 'category_name', type: 'VARCHAR(64)' },
        { name: 'parent_id', type: 'VARCHAR(16)' },
        { name: 'level', type: 'INTEGER' },
        { name: 'sort_order', type: 'INTEGER' },
    ],
    FACT_PRICING_HISTORY: [
        { name: 'pricing_id', type: 'VARCHAR(64)' },
        { name: 'product_id', type: 'VARCHAR(32)' },
        { name: 'old_price', type: 'DECIMAL(18,2)' },
        { name: 'new_price', type: 'DECIMAL(18,2)' },
        { name: 'change_date', type: 'TIMESTAMP' },
        { name: 'reason', type: 'VARCHAR(64)' },
    ],
    DIM_SUPPLIER: [
        { name: 'supplier_id', type: 'VARCHAR(32)' },
        { name: 'supplier_name', type: 'VARCHAR(128)' },
        { name: 'contact_email', type: 'VARCHAR(128)' },
        { name: 'country', type: 'VARCHAR(32)' },
        { name: 'rating', type: 'DECIMAL(3,1)' },
        { name: 'is_active', type: 'BOOLEAN' },
    ],
    FACT_INVENTORY: [
        { name: 'inventory_id', type: 'VARCHAR(64)' },
        { name: 'product_id', type: 'VARCHAR(32)' },
        { name: 'warehouse_id', type: 'VARCHAR(16)' },
        { name: 'quantity', type: 'INTEGER' },
        { name: 'last_restocked', type: 'DATE' },
        { name: 'min_threshold', type: 'INTEGER' },
    ],
    // ORDER_MANAGEMENT
    FACT_ORDERS: [
        { name: 'order_id', type: 'VARCHAR(64)' },
        { name: 'customer_id', type: 'VARCHAR(32)' },
        { name: 'order_date', type: 'TIMESTAMP' },
        { name: 'total_amount', type: 'DECIMAL(18,2)' },
        { name: 'status', type: 'VARCHAR(16)' },
        { name: 'channel', type: 'VARCHAR(20)' },
        { name: 'shipping_address', type: 'TEXT' },
    ],
    FACT_ORDER_ITEMS: [
        { name: 'item_id', type: 'VARCHAR(64)' },
        { name: 'order_id', type: 'VARCHAR(64)' },
        { name: 'product_id', type: 'VARCHAR(32)' },
        { name: 'quantity', type: 'INTEGER' },
        { name: 'unit_price', type: 'DECIMAL(18,2)' },
        { name: 'subtotal', type: 'DECIMAL(18,2)' },
    ],
    FACT_PAYMENTS: [
        { name: 'payment_id', type: 'VARCHAR(64)' },
        { name: 'order_id', type: 'VARCHAR(64)' },
        { name: 'payment_method', type: 'VARCHAR(20)' },
        { name: 'amount', type: 'DECIMAL(18,2)' },
        { name: 'payment_date', type: 'TIMESTAMP' },
        { name: 'status', type: 'VARCHAR(16)' },
    ],
    DIM_SHIPPING: [
        { name: 'shipping_id', type: 'VARCHAR(32)' },
        { name: 'carrier', type: 'VARCHAR(32)' },
        { name: 'method', type: 'VARCHAR(32)' },
        { name: 'cost', type: 'DECIMAL(10,2)' },
        { name: 'estimated_days', type: 'INTEGER' },
        { name: 'is_express', type: 'BOOLEAN' },
    ],
    FACT_RETURNS: [
        { name: 'return_id', type: 'VARCHAR(64)' },
        { name: 'order_id', type: 'VARCHAR(64)' },
        { name: 'reason', type: 'VARCHAR(64)' },
        { name: 'return_date', type: 'TIMESTAMP' },
        { name: 'refund_amount', type: 'DECIMAL(18,2)' },
        { name: 'status', type: 'VARCHAR(16)' },
    ],
    // FINANCIAL_REPORTING
    FACT_REVENUE: [
        { name: 'revenue_id', type: 'VARCHAR(64)' },
        { name: 'period', type: 'VARCHAR(10)' },
        { name: 'amount', type: 'DECIMAL(18,2)' },
        { name: 'source', type: 'VARCHAR(32)' },
        { name: 'cost_center', type: 'VARCHAR(16)' },
        { name: 'recorded_date', type: 'DATE' },
    ],
    FACT_EXPENSES: [
        { name: 'expense_id', type: 'VARCHAR(64)' },
        { name: 'period', type: 'VARCHAR(10)' },
        { name: 'amount', type: 'DECIMAL(18,2)' },
        { name: 'category', type: 'VARCHAR(32)' },
        { name: 'approved_by', type: 'VARCHAR(64)' },
        { name: 'expense_date', type: 'DATE' },
    ],
    DIM_COST_CENTER: [
        { name: 'center_id', type: 'VARCHAR(16)' },
        { name: 'center_name', type: 'VARCHAR(64)' },
        { name: 'department', type: 'VARCHAR(32)' },
        { name: 'budget', type: 'DECIMAL(18,2)' },
        { name: 'manager', type: 'VARCHAR(64)' },
    ],
    DIM_GL_ACCOUNT: [
        { name: 'account_id', type: 'VARCHAR(16)' },
        { name: 'account_name', type: 'VARCHAR(64)' },
        { name: 'account_type', type: 'VARCHAR(20)' },
        { name: 'parent_id', type: 'VARCHAR(16)' },
        { name: 'is_active', type: 'BOOLEAN' },
    ],
    FACT_JOURNAL_ENTRIES: [
        { name: 'entry_id', type: 'VARCHAR(64)' },
        { name: 'account_id', type: 'VARCHAR(16)' },
        { name: 'debit', type: 'DECIMAL(18,2)' },
        { name: 'credit', type: 'DECIMAL(18,2)' },
        { name: 'entry_date', type: 'DATE' },
        { name: 'description', type: 'VARCHAR(128)' },
        { name: 'posted_by', type: 'VARCHAR(64)' },
    ],
    // HR_ANALYTICS
    DIM_EMPLOYEE: [
        { name: 'employee_id', type: 'VARCHAR(32)' },
        { name: 'first_name', type: 'VARCHAR(64)' },
        { name: 'last_name', type: 'VARCHAR(64)' },
        { name: 'email', type: 'VARCHAR(128)' },
        { name: 'department_id', type: 'VARCHAR(16)' },
        { name: 'hire_date', type: 'DATE' },
        { name: 'is_active', type: 'BOOLEAN' },
    ],
    FACT_ATTENDANCE: [
        { name: 'attendance_id', type: 'VARCHAR(64)' },
        { name: 'employee_id', type: 'VARCHAR(32)' },
        { name: 'date', type: 'DATE' },
        { name: 'check_in', type: 'TIMESTAMP' },
        { name: 'check_out', type: 'TIMESTAMP' },
        { name: 'hours_worked', type: 'DECIMAL(4,2)' },
    ],
    DIM_DEPARTMENT: [
        { name: 'department_id', type: 'VARCHAR(16)' },
        { name: 'department_name', type: 'VARCHAR(64)' },
        { name: 'head_count', type: 'INTEGER' },
        { name: 'budget', type: 'DECIMAL(18,2)' },
        { name: 'location', type: 'VARCHAR(32)' },
    ],
    FACT_PAYROLL: [
        { name: 'payroll_id', type: 'VARCHAR(64)' },
        { name: 'employee_id', type: 'VARCHAR(32)' },
        { name: 'pay_period', type: 'VARCHAR(10)' },
        { name: 'gross_salary', type: 'DECIMAL(18,2)' },
        { name: 'deductions', type: 'DECIMAL(18,2)' },
        { name: 'net_salary', type: 'DECIMAL(18,2)' },
        { name: 'pay_date', type: 'DATE' },
    ],
    FACT_PERFORMANCE: [
        { name: 'review_id', type: 'VARCHAR(64)' },
        { name: 'employee_id', type: 'VARCHAR(32)' },
        { name: 'review_period', type: 'VARCHAR(10)' },
        { name: 'rating', type: 'DECIMAL(3,1)' },
        { name: 'reviewer_id', type: 'VARCHAR(32)' },
        { name: 'comments', type: 'TEXT' },
    ],
    // MARKETING_DATA
    DIM_CAMPAIGN: [
        { name: 'campaign_id', type: 'VARCHAR(32)' },
        { name: 'campaign_name', type: 'VARCHAR(128)' },
        { name: 'start_date', type: 'DATE' },
        { name: 'end_date', type: 'DATE' },
        { name: 'budget', type: 'DECIMAL(18,2)' },
        { name: 'channel_id', type: 'VARCHAR(16)' },
        { name: 'status', type: 'VARCHAR(16)' },
    ],
    FACT_IMPRESSIONS: [
        { name: 'impression_id', type: 'VARCHAR(64)' },
        { name: 'campaign_id', type: 'VARCHAR(32)' },
        { name: 'user_id', type: 'VARCHAR(32)' },
        { name: 'impression_date', type: 'TIMESTAMP' },
        { name: 'device_type', type: 'VARCHAR(20)' },
        { name: 'placement', type: 'VARCHAR(32)' },
    ],
    FACT_CLICKS: [
        { name: 'click_id', type: 'VARCHAR(64)' },
        { name: 'impression_id', type: 'VARCHAR(64)' },
        { name: 'campaign_id', type: 'VARCHAR(32)' },
        { name: 'click_date', type: 'TIMESTAMP' },
        { name: 'url', type: 'VARCHAR(256)' },
        { name: 'device_type', type: 'VARCHAR(20)' },
    ],
    FACT_CONVERSIONS: [
        { name: 'conversion_id', type: 'VARCHAR(64)' },
        { name: 'click_id', type: 'VARCHAR(64)' },
        { name: 'campaign_id', type: 'VARCHAR(32)' },
        { name: 'conversion_date', type: 'TIMESTAMP' },
        { name: 'revenue', type: 'DECIMAL(18,2)' },
        { name: 'conversion_type', type: 'VARCHAR(20)' },
    ],
    DIM_CHANNEL: [
        { name: 'channel_id', type: 'VARCHAR(16)' },
        { name: 'channel_name', type: 'VARCHAR(64)' },
        { name: 'channel_type', type: 'VARCHAR(20)' },
        { name: 'cost_per_click', type: 'DECIMAL(8,4)' },
        { name: 'is_active', type: 'BOOLEAN' },
    ],
};

// ── Generate a fallback column set for any unknown table ──
function getColumnsForTable(tableName) {
    if (TABLE_COLUMNS[tableName]) return TABLE_COLUMNS[tableName];
    // fallback: generate generic columns deterministically
    const hash = tableName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const count = 5 + (hash % 6);
    const generic = ['id', 'name', 'value', 'status', 'created_at', 'updated_at', 'type', 'code', 'amount', 'is_active', 'description'];
    const types = ['VARCHAR(64)', 'VARCHAR(32)', 'DECIMAL(18,2)', 'VARCHAR(16)', 'TIMESTAMP', 'DATE', 'INTEGER', 'VARCHAR(128)', 'DECIMAL(10,2)', 'BOOLEAN', 'TEXT'];
    return generic.slice(0, count).map((name, i) => ({ name, type: types[i % types.length] }));
}

// ── Deterministically assign rules to a column based on its name/type ──
function getRulesForColumn(col) {
    const rules = [];
    const name = col.name.toLowerCase();
    const type = col.type.toUpperCase();

    // Always: null check on ID and date columns
    if (name.includes('id') || name.includes('date') || name.includes('created') || name.includes('updated') || name === 'timestamp') {
        rules.push(RULES.find(r => r.id === 'null_check'));
    }
    // Uniqueness on primary-key-like columns
    if (name.endsWith('_id') && !name.includes('parent') && !name.includes('category') && !name.includes('department') && !name.includes('channel')) {
        rules.push(RULES.find(r => r.id === 'unique_check'));
    }
    // Value range on decimal/numeric
    if (type.includes('DECIMAL') || type.includes('INTEGER') || name.includes('amount') || name.includes('price') || name.includes('quantity') || name.includes('score') || name.includes('rating') || name.includes('budget')) {
        rules.push(RULES.find(r => r.id === 'value_range'));
    }
    // String length on VARCHAR
    if (type.includes('VARCHAR')) {
        rules.push(RULES.find(r => r.id === 'string_length'));
    }
    // Allowed values on status/type/channel fields
    if (name.includes('status') || name.includes('type') || name.includes('channel') || name.includes('method') || name.includes('segment') || name.includes('tier')) {
        rules.push(RULES.find(r => r.id === 'allowed_values'));
    }
    // Type check on everything
    rules.push(RULES.find(r => r.id === 'type_check'));
    // Positive numbers on amounts/prices
    if (name.includes('amount') || name.includes('price') || name.includes('salary') || name.includes('cost') || name.includes('revenue') || name.includes('budget')) {
        rules.push(RULES.find(r => r.id === 'positive_num'));
    }
    // Alpha only on name columns
    if (name.includes('first_name') || name.includes('last_name') || name === 'name' || name.includes('country') || name.includes('carrier')) {
        rules.push(RULES.find(r => r.id === 'alpha_only'));
    }
    // URL format on url columns
    if (name.includes('url') || name.includes('email')) {
        rules.push(RULES.find(r => r.id === 'url_format'));
    }
    // Statistical drift on score/value cols
    if (name.includes('score') || name.includes('value') || name.includes('pd_') || name.includes('lgd_') || name.includes('ead_')) {
        rules.push(RULES.find(r => r.id === 'mean_drift'));
        rules.push(RULES.find(r => r.id === 'stdev_drift'));
    }

    return rules.filter(Boolean);
}

// ══════════════════════════════════════════════════════════════
// SEVERITY BADGE
// ══════════════════════════════════════════════════════════════
function SeverityBadge({ sev }) {
    const colors = {
        Critical: { bg: 'var(--red-d)', color: 'var(--red)' },
        Error: { bg: 'var(--amber-d)', color: 'var(--amber)' },
        Warning: { bg: 'var(--blue-d)', color: 'var(--blue)' },
    };
    const s = colors[sev] || colors.Warning;
    return (
        <span style={{
            fontSize: 8, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
            padding: '2px 6px', borderRadius: 4, background: s.bg, color: s.color,
        }}>{sev}</span>
    );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function RulePreviewPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { schemaName, tables, returnPath, savedStep, savedForm } = location.state || {};

    const [selectedTable, setSelectedTable] = useState(null);
    const [search, setSearch] = useState('');

    // Parse the tables from the comma-separated string
    const tableList = useMemo(() => {
        if (!tables) return [];
        return tables.split(',').map(t => t.trim()).filter(Boolean);
    }, [tables]);

    // Compute column-rule mappings for each table
    const tableMappings = useMemo(() => {
        const mappings = {};
        tableList.forEach(tableName => {
            const cols = getColumnsForTable(tableName);
            const columnRules = cols.map(col => ({
                ...col,
                rules: getRulesForColumn(col),
            }));
            // Table-level rules
            const tableRules = RULES.filter(r => r.type === 'table');
            const totalRules = columnRules.reduce((sum, c) => sum + c.rules.length, 0) + tableRules.length;
            mappings[tableName] = { columns: columnRules, tableRules, totalRules, colCount: cols.length };
        });
        return mappings;
    }, [tableList]);

    // Filtered table list
    const filteredTables = useMemo(() => {
        if (!search) return tableList;
        return tableList.filter(t => t.toLowerCase().includes(search.toLowerCase()));
    }, [tableList, search]);

    // ── No state passed ──
    if (!schemaName || !tables) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 48 }}>⬡</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No preview data available</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
                    Please start from the Attach Dataset wizard and complete Rule Mapping first.
                </div>
                <button onClick={() => navigate(-1)} style={{
                    padding: '8px 20px', borderRadius: 6, border: '1px solid var(--bdr)',
                    background: 'var(--card)', color: 'var(--t2)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}>Go Back</button>
            </div>
        );
    }

    // Total stats
    const totalColumns = Object.values(tableMappings).reduce((sum, m) => sum + m.colCount, 0);
    const totalRules = Object.values(tableMappings).reduce((sum, m) => sum + m.totalRules, 0);

    const thS = {
        fontSize: 9, fontWeight: 600, letterSpacing: 0.7, textTransform: 'uppercase',
        color: 'var(--t3)', textAlign: 'left', padding: '9px 14px',
        borderBottom: '1px solid var(--bdr)', position: 'sticky', top: 0,
        background: 'var(--card)', zIndex: 2, whiteSpace: 'nowrap',
    };
    const tdS = { padding: '10px 14px', fontSize: 11.5, borderBottom: '1px solid var(--bdr)', verticalAlign: 'top' };

    // ══════════════════════════════════════════════════════════════
    // VIEW: Column-Rule Detail for a specific table
    // ══════════════════════════════════════════════════════════════
    if (selectedTable) {
        const mapping = tableMappings[selectedTable];
        if (!mapping) { setSelectedTable(null); return null; }

        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{
                    height: 48, background: 'var(--hdr-bg)', backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid var(--bdr)', padding: '0 28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--purple), var(--blue))', fontWeight: 700, fontSize: 12, color: '#fff',
                        }}>CR</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>Column Rules — <span style={{ color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>{selectedTable}</span></div>
                            <div style={{ fontSize: 10.5, color: 'var(--t2)' }}>{schemaName} · {mapping.colCount} columns · {mapping.totalRules} rules mapped</div>
                        </div>
                    </div>
                    <button onClick={() => setSelectedTable(null)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t2)',
                        background: 'var(--card)', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--bdr)', cursor: 'pointer',
                    }}>
                        <ArrowLeft size={13} /> Back to Tables
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflow: 'auto', padding: '16px 28px 24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>

                    {/* Table-level rules card */}
                    {mapping.tableRules.length > 0 && (
                        <div className="anim d1" style={{
                            background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)',
                            padding: 16, marginBottom: 16,
                        }}>
                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Shield size={14} color="var(--amber)" /> Table-Level Rules
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {mapping.tableRules.map(rule => (
                                    <div key={rule.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 500,
                                        padding: '5px 10px', borderRadius: 6,
                                        background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', color: 'var(--amber)',
                                    }}>
                                        <CheckCircle2 size={10} /> {rule.name}
                                        <SeverityBadge sev={rule.sev} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Column-level rules table */}
                    <div className="anim d2" style={{
                        background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', overflow: 'hidden',
                    }}>
                        <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                <thead>
                                    <tr>
                                        <th style={{ ...thS, width: 40 }}>#</th>
                                        <th style={thS}>Column Name</th>
                                        <th style={thS}>Data Type</th>
                                        <th style={thS}>Mapped Rules</th>
                                        <th style={{ ...thS, width: 80, textAlign: 'center' }}>Rule Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mapping.columns.map((col, i) => (
                                        <tr key={col.name}
                                            style={{ transition: 'background 0.12s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--card-h)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ ...tdS, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t3)', textAlign: 'center' }}>{i + 1}</td>
                                            <td style={tdS}>
                                                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--cyan)' }}>{col.name}</span>
                                            </td>
                                            <td style={tdS}>
                                                <span style={{
                                                    fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500, color: 'var(--t3)',
                                                    padding: '2px 8px', borderRadius: 4, background: 'var(--elev)', border: '1px solid var(--bdr)',
                                                }}>{col.type}</span>
                                            </td>
                                            <td style={tdS}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                    {col.rules.length === 0 && (
                                                        <span style={{ fontSize: 10, color: 'var(--t3)', fontStyle: 'italic' }}>No rules mapped</span>
                                                    )}
                                                    {col.rules.map((rule, ri) => (
                                                        <span key={ri} style={{
                                                            fontSize: 9, fontWeight: 600, padding: '3px 7px', borderRadius: 4,
                                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                                            background: rule.sev === 'Critical' ? 'var(--red-d)' : rule.sev === 'Error' ? 'var(--amber-d)' : 'var(--blue-d)',
                                                            color: rule.sev === 'Critical' ? 'var(--red)' : rule.sev === 'Error' ? 'var(--amber)' : 'var(--blue)',
                                                            border: `1px solid ${rule.sev === 'Critical' ? 'rgba(239,68,68,0.15)' : rule.sev === 'Error' ? 'rgba(251,191,36,0.15)' : 'rgba(96,165,250,0.15)'}`,
                                                        }}>
                                                            {rule.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ ...tdS, textAlign: 'center' }}>
                                                <span style={{
                                                    fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                                                    color: col.rules.length > 3 ? 'var(--green)' : col.rules.length > 0 ? 'var(--blue)' : 'var(--t3)',
                                                }}>{col.rules.length}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: 10, color: 'var(--t3)', padding: '10px 0 0', marginTop: 14, borderTop: '1px solid var(--bdr)',
                    }}>
                        <span>Table: {selectedTable} · Schema: {schemaName} · {mapping.colCount} columns · {mapping.totalRules} total rules</span>
                        <span>Rule Mapping Preview</span>
                    </div>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════
    // VIEW: Table List
    // ══════════════════════════════════════════════════════════════
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                height: 48, background: 'var(--hdr-bg)', backdropFilter: 'blur(16px)',
                borderBottom: '1px solid var(--bdr)', padding: '0 28px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, var(--green), var(--blue))', fontWeight: 700, fontSize: 12, color: '#fff',
                    }}>RP</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Rule Mapping Preview</div>
                        <div style={{ fontSize: 10.5, color: 'var(--t2)' }}>
                            {schemaName} · {tableList.length} tables · {totalColumns} columns · {totalRules} rules mapped
                        </div>
                    </div>
                </div>
                <button onClick={() => navigate(returnPath || -1, { state: { savedStep: savedStep, savedForm: savedForm } })} style={{
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t2)',
                    background: 'var(--card)', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--bdr)', cursor: 'pointer',
                }}>
                    <ArrowLeft size={13} /> Back to Wizard
                </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 28px 24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>

                {/* Summary cards */}
                <div className="anim d1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                        { label: 'Schema', val: schemaName, color: 'var(--blue)', accent: 'var(--blue)' },
                        { label: 'Tables Selected', val: tableList.length, color: 'var(--cyan)', accent: 'var(--cyan)' },
                        { label: 'Total Columns', val: totalColumns, color: 'var(--purple)', accent: 'var(--purple)' },
                        { label: 'Rules Mapped', val: totalRules, color: 'var(--green)', accent: 'var(--green)' },
                    ].map((c, i) => (
                        <div key={i} style={{
                            background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)',
                            padding: '14px 16px', position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: c.accent }} />
                            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--t2)', marginBottom: 6 }}>{c.label}</div>
                            <div style={{
                                fontSize: typeof c.val === 'number' ? 24 : 15, fontWeight: 700,
                                letterSpacing: -0.5, lineHeight: 1, color: c.color,
                                fontFamily: typeof c.val === 'number' ? 'var(--mono)' : 'var(--sans)',
                            }}>{c.val}</div>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="anim d2" style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card)',
                        border: '1px solid var(--bdr)', borderRadius: 'var(--rs)', padding: '8px 14px', flex: '0 0 300px',
                    }}>
                        <Search size={13} color="var(--t3)" />
                        <input placeholder="Search tables..." value={search} onChange={e => setSearch(e.target.value)}
                            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--t1)', fontFamily: 'var(--sans)', fontSize: 12, width: '100%' }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
                        {filteredTables.length} of {tableList.length} tables
                    </span>
                </div>

                {/* Table list */}
                <div className="anim d3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 10 }}>
                    {filteredTables.map((tableName, idx) => {
                        const m = tableMappings[tableName];
                        return (
                            <div key={tableName} onClick={() => setSelectedTable(tableName)}
                                style={{
                                    background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)',
                                    padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s',
                                    position: 'relative', overflow: 'hidden',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'rgba(96,165,250,0.03)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bdr)'; e.currentTarget.style.background = 'var(--card)'; }}
                            >
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--blue), var(--purple))' }} />

                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.15)',
                                        }}>
                                            <Table2 size={15} color="var(--blue)" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--mono)' }}>{tableName}</div>
                                            <div style={{ fontSize: 9.5, color: 'var(--t3)' }}>Table {idx + 1} of {tableList.length}</div>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} color="var(--t3)" />
                                </div>

                                <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
                                    <div style={{
                                        padding: '5px 10px', borderRadius: 5, background: 'var(--elev)', border: '1px solid var(--bdr)',
                                        display: 'flex', alignItems: 'center', gap: 5,
                                    }}>
                                        <span style={{ color: 'var(--t3)' }}>Columns:</span>
                                        <span style={{ fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>{m.colCount}</span>
                                    </div>
                                    <div style={{
                                        padding: '5px 10px', borderRadius: 5, background: 'var(--elev)', border: '1px solid var(--bdr)',
                                        display: 'flex', alignItems: 'center', gap: 5,
                                    }}>
                                        <span style={{ color: 'var(--t3)' }}>Rules:</span>
                                        <span style={{ fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--mono)' }}>{m.totalRules}</span>
                                    </div>
                                    <div style={{
                                        padding: '5px 10px', borderRadius: 5, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)',
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        color: 'var(--green)', fontWeight: 600,
                                    }}>
                                        <CheckCircle2 size={10} /> Mapped
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredTables.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)', fontSize: 12 }}>
                        No tables match your search
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 10, color: 'var(--t3)', padding: '10px 0 0', marginTop: 14, borderTop: '1px solid var(--bdr)',
                }}>
                    <span>Schema: {schemaName} · {tableList.length} tables · Click a table to view column-rule mappings</span>
                    <span>Rule Mapping Preview</span>
                </div>
            </div>
        </div>
    );
}
