import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDown, ChevronRight, Building2, Globe, Briefcase, Users, FolderOpen,
  LogOut, LayoutDashboard, Shield, Activity, Lock, Database, Plus, Trash2, AlertTriangle, X,
  Sun, Moon
} from 'lucide-react';
import { getAncestorChain } from '../data/orgStructure';

const typeConfig = {
  org: { icon: Building2, color: 'var(--green)', label: 'Organization' },
  domain: { icon: Globe, color: 'var(--blue)', label: 'Domain' },
  bu: { icon: Briefcase, color: 'var(--purple)', label: 'Business Unit' },
  team: { icon: Users, color: 'var(--cyan)', label: 'Team' },
  project: { icon: FolderOpen, color: 'var(--amber)', label: 'Project' },
  schema: { icon: Database, color: '#f472b6', label: 'Schema' },
};

// ── Delete Confirmation Modal ──
function DeleteConfirmModal({ projectName, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '380px', background: 'var(--card)', border: '1px solid var(--bdr)',
        borderRadius: '16px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--red-d)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={18} color="var(--red)" />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--t1)' }}>Delete Project</div>
          </div>
          <div onClick={onCancel} style={{ cursor: 'pointer', color: 'var(--t3)', padding: '4px' }}>
            <X size={16} />
          </div>
        </div>

        {/* Body */}
        <div style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.7, marginBottom: '20px' }}>
          Are you sure you want to delete{' '}
          <strong style={{ color: 'var(--t1)' }}>{projectName}</strong>?
          This will permanently remove the project and all its schemas, tables, and validation data.
          This action cannot be undone.
        </div>

        {/* Warning box */}
        <div style={{
          padding: '10px 14px', borderRadius: '8px',
          background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)',
          fontSize: '10px', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '20px',
        }}>
          <AlertTriangle size={12} />
          All associated schemas, DQ rules, historical runs, and trend data will be lost.
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '9px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            background: 'var(--elev)', border: '1px solid var(--bdr)', color: 'var(--t2)',
            cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            padding: '9px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
            background: 'var(--red)', border: 'none', color: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Trash2 size={12} /> Delete Project
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Navigable tree item ──
function NavItem({ node, path, depth = 0, activePath, isTeamUser, onDeleteProject }) {
  const [open, setOpen] = useState(depth < 2);
  const navigate = useNavigate();
  const hasChildren = node.children && node.children.length > 0;
  const config = typeConfig[node.type] || typeConfig.project;
  const Icon = config.icon;
  const pathStr = path.join('/');
  const isActive = activePath === pathStr;

  // Only team-level users see the attach (+) button, only on their own team node
  const canAttach = isTeamUser && node.type === 'team';
  // Only team-level users can delete projects
  const canDelete = isTeamUser && node.type === 'project';

  const handleClick = () => navigate(`/dashboard/${pathStr}`);

  const handleAttach = (e) => {
    e.stopPropagation();
    navigate(`/dashboard/attach/${pathStr}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDeleteProject?.(node, path);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: `6px 10px 6px ${12 + depth * 16}px`,
          cursor: 'pointer', transition: 'all 0.15s', borderRadius: '6px', margin: '1px 6px',
          background: isActive ? 'var(--elev)' : 'transparent',
          borderLeft: isActive ? `2px solid ${config.color}` : '2px solid transparent',
        }}
        onClick={handleClick}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--card-h)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      >
        {hasChildren ? (
          <span
            onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: 'var(--t3)' }}
          >
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        ) : <span style={{ width: 12 }} />}
        <Icon size={13} color={config.color} strokeWidth={2} />
        <span style={{
          fontSize: '11px', fontWeight: isActive ? 600 : 500,
          color: isActive ? 'var(--t1)' : 'var(--t2)',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {node.emoji ? `${node.emoji} ` : ''}{node.name}
        </span>

        {/* Attach button (team only) */}
        {canAttach && (
          <span onClick={handleAttach} title={`Attach dataset to ${node.name}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '18px', height: '18px', borderRadius: '5px',
              background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)',
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.2)'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.15)'; }}
          >
            <Plus size={10} color="var(--blue)" strokeWidth={2.5} />
          </span>
        )}

        {/* Delete button (project, team users only) */}
        {canDelete && (
          <span onClick={handleDelete} title={`Delete ${node.name}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '18px', height: '18px', borderRadius: '5px',
              background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.1)',
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.2)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.1)'; }}
          >
            <Trash2 size={9} color="var(--red)" />
          </span>
        )}

        {/* Type badge — no layer colors */}
        <span style={{
          fontSize: '8px', fontWeight: 600, padding: '2px 5px', borderRadius: '3px',
          background: `${config.color}15`, color: config.color,
          textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0,
        }}>
          {node.type === 'bu' ? 'BU' : node.type}
        </span>
      </div>
      {open && hasChildren && (
        <div>
          {node.children.map(child => (
            <NavItem
              key={child.id}
              node={child}
              path={[...path, child.id]}
              depth={depth + 1}
              activePath={activePath}
              isTeamUser={isTeamUser}
              onDeleteProject={onDeleteProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Ancestor breadcrumb item ──
function AncestorItem({ node, isLast }) {
  const config = typeConfig[node.type] || typeConfig.project;
  const Icon = config.icon;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '5px 10px 5px 12px', margin: '1px 6px', borderRadius: '6px',
          background: 'transparent', opacity: 0.55, cursor: 'default', position: 'relative',
        }}
        title={`${config.label}: ${node.name} (read-only — outside your access scope)`}
      >
        <Icon size={12} color={config.color} strokeWidth={2} />
        <span style={{
          fontSize: '10.5px', fontWeight: 500, color: 'var(--t3)',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {node.emoji ? `${node.emoji} ` : ''}{node.name}
        </span>
        <Lock size={9} color="var(--t3)" style={{ flexShrink: 0 }} />
        <span style={{
          fontSize: '7.5px', fontWeight: 600, padding: '1.5px 5px', borderRadius: '3px',
          background: 'rgba(255,255,255,0.04)', color: 'var(--t3)', textTransform: 'uppercase',
          letterSpacing: '0.4px', flexShrink: 0,
        }}>
          {node.type === 'bu' ? 'BU' : node.type}
        </span>
      </div>
      {!isLast && (
        <div style={{ position: 'absolute', left: '28px', marginTop: '0px' }} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN SIDEBAR
// ══════════════════════════════════════════════════════════════

export default function Sidebar() {
  const { user, logout, getTree } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tree = useMemo(() => getTree(), [getTree]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('dq_theme') || 'dark');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('dq_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }; // { node, path }

  const ancestors = useMemo(() => {
    if (!user) return [];
    return getAncestorChain(user.scopePath);
  }, [user]);

  if (!tree || !user) return null;

  const urlPath = location.pathname.replace('/dashboard/', '').replace('/dashboard', '');
  const activePath = urlPath || user.scopePath.join('/');
  const hasAncestors = ancestors.length > 0;
  const isTeamUser = user.role === 'team';

  const handleDeleteProject = (node, path) => {
    setDeleteTarget({ node, path });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    // Walk the tree to find the parent and remove the project
    const { path } = deleteTarget;
    const parentPath = path.slice(0, -1);
    // Find parent node in the actual tree
    let parent = tree;
    for (const seg of parentPath.slice(user.scopePath.length)) {
      parent = parent.children?.find(c => c.id === seg);
      if (!parent) break;
    }
    if (parent && parent.children) {
      const projectId = path[path.length - 1];
      const idx = parent.children.findIndex(c => c.id === projectId);
      if (idx !== -1) {
        parent.children.splice(idx, 1);
      }
    }
    setDeleteTarget(null);
    // Navigate back to team dashboard
    navigate(`/dashboard/${user.scopePath.join('/')}`);
  };

  return (
    <div style={{
      width: 'var(--sidebar-w)', height: '100vh', background: 'var(--card)',
      borderRight: '1px solid var(--bdr)', display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--bdr)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px',
          background: 'linear-gradient(135deg, var(--green), var(--blue))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Shield size={16} color="var(--bg)" strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            DQ Monitor
          </div>
          <div style={{ fontSize: '9.5px', color: 'var(--t3)' }}>ADA Global</div>
        </div>
      </div>

      {/* User info */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--bdr)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '6px',
          background: `${typeConfig[user.role]?.color || 'var(--green)'}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 700,
          color: typeConfig[user.role]?.color || 'var(--green)',
        }}>
          {user.name.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
          <div style={{ fontSize: '9px', color: 'var(--t3)', fontFamily: 'var(--mono)' }}>{user.email}</div>
        </div>
        <span style={{
          fontSize: '8px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px',
          background: `${typeConfig[user.role]?.color || 'var(--green)'}15`,
          color: typeConfig[user.role]?.color || 'var(--green)',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          {user.role}
        </span>
      </div>

      {/* Quick score */}
      {tree.metrics && (
        <div style={{
          margin: '10px 10px 4px', padding: '10px 12px',
          background: 'var(--elev)', borderRadius: 'var(--rs)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Activity size={14} color="var(--green)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', color: 'var(--t3)', fontWeight: 500 }}>Health Score</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.5px' }}>
              {tree.metrics.healthScore}%
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', color: 'var(--t3)' }}>Pass Rate</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--blue)' }}>
              {tree.metrics.passRate}%
            </div>
          </div>
        </div>
      )}

      {/* Ancestor breadcrumb */}
      {hasAncestors && (
        <div style={{ flexShrink: 0 }}>
          <div style={{
            padding: '8px 16px 3px', fontSize: '9px', fontWeight: 600,
            color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.7px',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <Lock size={9} /> Hierarchy (Read-Only)
          </div>
          <div style={{ padding: '2px 0 0' }}>
            {ancestors.map((a, i) => (
              <div key={a.node.id} style={{ position: 'relative' }}>
                {i < ancestors.length - 1 && (
                  <div style={{ position: 'absolute', left: '24px', top: '26px', bottom: '-2px', width: '1px', background: 'var(--bdr)' }} />
                )}
                {i === ancestors.length - 1 && (
                  <div style={{ position: 'absolute', left: '24px', top: '26px', bottom: '-8px', width: '1px', background: 'var(--bdr)', opacity: 0.5 }} />
                )}
                <AncestorItem node={a.node} isLast={i === ancestors.length - 1} />
              </div>
            ))}
          </div>
          <div style={{ margin: '4px 12px 0', borderTop: '1px dashed var(--bdr)' }} />
        </div>
      )}

      {/* Nav label */}
      <div style={{
        padding: `${hasAncestors ? '6px' : '10px'} 16px 4px`, fontSize: '9px', fontWeight: 600,
        color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.7px',
        display: 'flex', alignItems: 'center', gap: '5px',
      }}>
        <LayoutDashboard size={10} />
        {hasAncestors ? 'Your Scope' : 'Navigation'}
      </div>

      {/* Nav tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        <NavItem
          node={tree}
          path={user.scopePath}
          depth={0}
          activePath={activePath}
          isTeamUser={isTeamUser}
          onDeleteProject={handleDeleteProject}
        />
      </div>

      {/* Theme toggle */}
      <div style={{ padding: '6px 12px 0' }}>
        <div
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
            cursor: 'pointer', borderRadius: '6px', transition: 'all 0.15s',
            fontSize: '11px', fontWeight: 600, color: 'var(--t2)',
            background: 'var(--elev)', border: '1px solid var(--bdr)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-h)'; e.currentTarget.style.color = 'var(--t1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--elev)'; e.currentTarget.style.color = 'var(--t2)'; }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span style={{ flex: 1 }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          <div style={{
            width: '34px', height: '18px', borderRadius: '9px',
            background: theme === 'dark' ? 'var(--bdr)' : 'var(--blue)',
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}>
            <div style={{
              width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
              position: 'absolute', top: '2px',
              left: theme === 'dark' ? '2px' : '18px',
              transition: 'left 0.2s',
            }} />
          </div>
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--bdr)' }}>
        <div
          onClick={() => { logout(); navigate('/'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
            cursor: 'pointer', borderRadius: '6px', transition: 'all 0.15s',
            fontSize: '11px', fontWeight: 600, color: 'var(--t3)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-d)'; e.currentTarget.style.color = 'var(--red)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)'; }}
        >
          <LogOut size={14} /> Sign Out
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          projectName={deleteTarget.node.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
