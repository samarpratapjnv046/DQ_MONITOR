import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { findNode, addProjectToNode } from '../data/orgStructure';
import {
    FolderOpen, ArrowLeft, CheckCircle2, AlertCircle, User, Calendar,
    FileText, Layers, Mail, Users
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════

const inputStyle = {
    width: '100%', padding: '10px 14px', fontSize: '12px', fontWeight: 500,
    background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: '8px',
    color: 'var(--t1)', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
};
const labelStyle = { fontSize: '11px', fontWeight: 600, color: 'var(--t2)', marginBottom: '6px', display: 'block' };
const btnPrimary = {
    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700,
    color: '#0B0F1A', background: 'linear-gradient(135deg, var(--green), var(--blue))',
    padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
};
const btnSecondary = {
    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600,
    color: 'var(--t2)', background: 'var(--card)', padding: '10px 20px', borderRadius: '8px',
    border: '1px solid var(--bdr)', cursor: 'pointer', transition: 'all 0.2s',
};

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export default function CreateProjectPage() {
    const { '*': pathParam } = useParams();
    const { user, refreshTree } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Detect edit mode from the full URL path
    const isEdit = location.pathname.includes('/edit-project/');

    const segments = pathParam?.split('/').filter(Boolean) || user.scopePath;

    // In edit mode, segments point to the project node itself
    // In create mode, segments point to the parent (team) node
    const editNode = isEdit ? findNode(segments) : null;
    const parentSegments = isEdit ? segments.slice(0, -1) : segments;
    const parentNode = findNode(parentSegments);
    const node = isEdit ? editNode : findNode(segments);

    const now = new Date();
    const createdDateStr = now.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    }) + ' · ' + now.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
    });

    // Derive default values for edit mode
    const defaultTeamEmail = (() => {
        if (!isEdit || !editNode) return '';
        if (editNode.teamOwnerEmail) return editNode.teamOwnerEmail;
        // Derive from owner name
        if (editNode.owner) {
            const parts = editNode.owner.toLowerCase().split(/\s+/);
            return parts.join('.') + '@adaglobal.com';
        }
        return user?.email || '';
    })();

    const defaultMemberEmails = (() => {
        if (!isEdit || !editNode) return '';
        if (editNode.memberEmails && editNode.memberEmails.length > 0) return editNode.memberEmails.join(', ');
        // Use some users from the parent team node
        const team = findNode(parentSegments);
        if (team?.users) {
            return team.users.slice(0, 3).map(u => u.email).filter(Boolean).join(', ');
        }
        return '';
    })();

    const [form, setForm] = useState({
        projectName: isEdit && editNode ? editNode.name : '',
        teamOwnerEmail: isEdit ? defaultTeamEmail : '',
        memberEmails: isEdit ? defaultMemberEmails : '',
        description: isEdit && editNode ? (editNode.description || '') : '',
        createdDate: isEdit && editNode ? (editNode.createdDate || createdDateStr) : createdDateStr,
    });
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState({});

    const u = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const memberEmailsList = form.memberEmails ? form.memberEmails.split(',').map(e => e.trim()).filter(Boolean) : [];

    const validate = () => {
        const errs = {};
        if (!form.projectName.trim()) errs.projectName = 'Project name is required';
        if (!form.teamOwnerEmail.trim()) errs.teamOwnerEmail = 'Team owner email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.teamOwnerEmail.trim())) errs.teamOwnerEmail = 'Please enter a valid email';
        return errs;
    };

    const handleSubmit = () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setErrors({});

        if (isEdit && editNode) {
            // Update existing project
            editNode.name = form.projectName.trim();
            editNode.teamOwnerEmail = form.teamOwnerEmail.trim();
            editNode.memberEmails = memberEmailsList;
            editNode.description = form.description.trim();
            refreshTree();
        } else {
            // Create new project
            const newProject = addProjectToNode(segments, {
                projectName: form.projectName.trim(),
                ownerName: form.teamOwnerEmail.trim(),
                starName: '',
            });
            if (newProject) {
                newProject.teamOwnerEmail = form.teamOwnerEmail.trim();
                newProject.memberEmails = memberEmailsList;
                newProject.description = form.description.trim();
                newProject.createdDate = form.createdDate;
            }
            refreshTree();
        }

        setSubmitted(true);
    };

    const displayNode = parentNode || node;

    if (!displayNode) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--t3)' }}>
                <AlertCircle size={40} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--t1)' }}>Node not found</div>
            </div>
        );
    }

    // ── Success screen ──
    if (submitted) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '20px',
                    background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeUp 0.5s ease',
                }}>
                    <CheckCircle2 size={36} color="var(--green)" />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--t1)' }}>
                    {isEdit ? 'Project Updated Successfully' : 'Project Created Successfully'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--t2)', textAlign: 'center', maxWidth: '420px', lineHeight: 1.7 }}>
                    <strong style={{ color: 'var(--t1)' }}>{form.projectName}</strong> has been
                    {isEdit ? ' updated' : ' created'} under{' '}
                    <strong style={{ color: 'var(--t1)' }}>{displayNode.name}</strong>.
                </div>
                <div style={{
                    background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: '12px',
                    padding: '16px 24px', display: 'flex', gap: '28px', fontSize: '11px',
                }}>
                    <div><span style={{ color: 'var(--t3)' }}>Project:</span> <strong>{form.projectName}</strong></div>
                    {memberEmailsList.length > 0 && <div><span style={{ color: 'var(--t3)' }}>Members:</span> <strong>{memberEmailsList.length}</strong></div>}
                    <div><span style={{ color: 'var(--t3)' }}>Created:</span> <strong>{form.createdDate}</strong></div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button onClick={() => navigate(`/dashboard/${parentSegments.join('/')}`)} style={btnPrimary}>Go to Dashboard</button>
                    {!isEdit && (
                        <button onClick={() => { setSubmitted(false); setForm(f => ({ ...f, projectName: '', teamOwnerEmail: '', memberEmails: '', description: '' })); }} style={btnSecondary}>Create Another</button>
                    )}
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════
    // FORM
    // ══════════════════════════════════════════════════════════════

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top bar */}
            <div style={{
                height: 48, background: 'var(--hdr-bg)', backdropFilter: 'blur(16px)',
                borderBottom: '1px solid var(--bdr)', padding: '0 24px',
                display: 'flex', alignItems: 'center', gap: 14,
            }}>
                <button onClick={() => navigate(`/dashboard/${parentSegments.join('/')}`)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
                    color: 'var(--t2)', background: 'var(--card)', border: '1px solid var(--bdr)',
                    padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                }}>
                    <ArrowLeft size={13} /> Back to Dashboard
                </button>
                <div style={{ width: 1, height: 20, background: 'var(--bdr)' }} />
                <FolderOpen size={14} color="var(--amber)" />
                <div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{isEdit ? 'Edit Project' : 'Create New Project'}</span>
                    <span style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 8 }}>
                        in {displayNode.name} ({displayNode.type === 'team' ? 'Team' : displayNode.type})
                    </span>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '40px 24px' }}>
                <div style={{ width: '100%', maxWidth: '620px' }}>
                    {/* Card */}
                    <div style={{
                        background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: '16px',
                        padding: '32px', animation: 'fadeUp 0.5s ease forwards', opacity: 0,
                        animationDelay: '0.05s', animationFillMode: 'forwards',
                    }}>
                        {/* Icon + Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(96,165,250,0.15))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <FolderOpen size={22} color="var(--amber)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{isEdit ? 'Edit Project' : 'New Project'}</div>
                                <div style={{ fontSize: '11px', color: 'var(--t3)' }}>
                                    {isEdit ? <>Update <strong style={{ color: 'var(--t2)' }}>{editNode?.name}</strong></> : <>Add a new project to <strong style={{ color: 'var(--t2)' }}>{displayNode.name}</strong></>}
                                </div>
                            </div>
                        </div>

                        {/* Project Name */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FolderOpen size={11} color="var(--amber)" /> Project Name *
                                </span>
                            </label>
                            <input
                                style={{ ...inputStyle, borderColor: errors.projectName ? 'var(--red)' : 'var(--bdr)' }}
                                placeholder="e.g. PD Model Retail Mortgage"
                                value={form.projectName}
                                onChange={e => { u('projectName', e.target.value); setErrors(er => ({ ...er, projectName: '' })); }}
                            />
                            {errors.projectName && (
                                <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertCircle size={10} /> {errors.projectName}
                                </div>
                            )}
                        </div>

                        {/* Team Owner Email */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Mail size={11} color="var(--cyan)" /> Team Owner Email *
                                </span>
                            </label>
                            <input
                                style={{ ...inputStyle, borderColor: errors.teamOwnerEmail ? 'var(--red)' : 'var(--bdr)' }}
                                placeholder="e.g. teamlead@company.com"
                                value={form.teamOwnerEmail}
                                onChange={e => { u('teamOwnerEmail', e.target.value); setErrors(er => ({ ...er, teamOwnerEmail: '' })); }}
                            />
                            <div style={{ fontSize: '9px', color: 'var(--t3)', marginTop: '3px' }}>Email of the team-level owner responsible for this project</div>
                            {errors.teamOwnerEmail && (
                                <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertCircle size={10} /> {errors.teamOwnerEmail}
                                </div>
                            )}
                        </div>

                        {/* Member Emails */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Users size={11} color="var(--purple)" /> Member Emails
                                </span>
                            </label>
                            <div style={{
                                ...inputStyle, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center',
                                padding: '8px 12px', minHeight: 44, cursor: 'text',
                            }}>
                                {memberEmailsList.map((email, i) => (
                                    <span key={i} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        fontSize: 10, fontWeight: 600, padding: '4px 9px', borderRadius: 5,
                                        background: 'rgba(167,139,250,0.12)', color: 'var(--purple)',
                                        border: '1px solid rgba(167,139,250,0.2)',
                                    }}>
                                        {email}
                                        <span onClick={() => {
                                            const next = memberEmailsList.filter((_, idx) => idx !== i);
                                            u('memberEmails', next.join(', '));
                                        }} style={{ cursor: 'pointer', fontWeight: 700, opacity: 0.7, fontSize: 11 }}>✕</span>
                                    </span>
                                ))}
                                <input
                                    placeholder={memberEmailsList.length === 0 ? 'Type email & press Enter to add members' : ''}
                                    style={{
                                        background: 'none', border: 'none', outline: 'none', color: 'var(--t1)',
                                        fontFamily: 'inherit', fontSize: 12, flex: 1, minWidth: 140, padding: '2px 0',
                                    }}
                                    onKeyDown={e => {
                                        if ((e.key === 'Enter' || e.key === ',') && e.target.value.trim()) {
                                            e.preventDefault();
                                            const email = e.target.value.trim().replace(/,$/, '');
                                            if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                                                const next = [...memberEmailsList, email];
                                                u('memberEmails', next.join(', '));
                                                e.target.value = '';
                                            }
                                        }
                                        if (e.key === 'Backspace' && !e.target.value && memberEmailsList.length > 0) {
                                            const next = memberEmailsList.slice(0, -1);
                                            u('memberEmails', next.join(', '));
                                        }
                                    }}
                                />
                            </div>
                            <div style={{ fontSize: '9px', color: 'var(--t3)', marginTop: '3px' }}>Press Enter or comma to add multiple member emails</div>
                        </div>

                        {/* Created Date */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Calendar size={11} color="var(--green)" /> Created Date
                                </span>
                            </label>
                            <input
                                style={{ ...inputStyle, background: 'var(--bg)', color: 'var(--t3)', cursor: 'default' }}
                                value={form.createdDate}
                                readOnly
                            />
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: 24 }}>
                            <label style={labelStyle}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FileText size={11} color="var(--cyan)" /> Description
                                </span>
                            </label>
                            <textarea
                                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                                placeholder="Brief description of this project (optional)"
                                value={form.description}
                                onChange={e => u('description', e.target.value)}
                            />
                        </div>

                        {/* Info box */}
                        <div style={{
                            padding: '10px 14px', borderRadius: '8px',
                            background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)',
                            fontSize: '10px', color: 'var(--blue)', display: 'flex', alignItems: 'start', gap: '8px',
                            marginBottom: '24px', lineHeight: 1.6,
                        }}>
                            <Layers size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>
                                {isEdit
                                    ? <>You are editing <strong>{editNode?.name}</strong>. Changes will take effect immediately.</>
                                    : <>The new project will be created under <strong>{displayNode.name}</strong>. Schemas can be attached to this project after creation using the schema attach wizard.</>
                                }
                            </span>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => navigate(`/dashboard/${parentSegments.join('/')}`)} style={btnSecondary}>
                                Cancel
                            </button>
                            <button onClick={handleSubmit} style={{
                                ...btnPrimary,
                                opacity: form.projectName.trim() && form.teamOwnerEmail.trim() ? 1 : 0.6,
                            }}>
                                <FolderOpen size={14} /> {isEdit ? 'Save Changes' : 'Create Project'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
