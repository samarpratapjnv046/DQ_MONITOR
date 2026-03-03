import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { findNode, addProjectToNode } from '../data/orgStructure';
import {
    FolderOpen, ArrowLeft, CheckCircle2, AlertCircle, User, Calendar,
    Star, FileText, Layers, Mail
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

    const segments = pathParam?.replace('create-project/', '').split('/').filter(Boolean) || user.scopePath;
    const node = findNode(segments);

    const now = new Date();
    const createdDateStr = now.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    }) + ' · ' + now.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
    });

    const [form, setForm] = useState({
        projectName: '',
        ownerName: '',
        teamOwnerEmail: '',
        starName: '',
        description: '',
        createdDate: createdDateStr,
    });
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState({});

    const u = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const validate = () => {
        const errs = {};
        if (!form.projectName.trim()) errs.projectName = 'Project name is required';
        if (!form.ownerName.trim()) errs.ownerName = 'Owner name is required';
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

        // Mutate the live org tree to add the new project
        addProjectToNode(segments, {
            projectName: form.projectName.trim(),
            ownerName: form.ownerName.trim(),
            starName: form.starName.trim(),
        });
        refreshTree(); // Force sidebar re-render

        setSubmitted(true);
    };

    if (!node) {
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
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--t1)' }}>Project Created Successfully</div>
                <div style={{ fontSize: '12px', color: 'var(--t2)', textAlign: 'center', maxWidth: '420px', lineHeight: 1.7 }}>
                    <strong style={{ color: 'var(--t1)' }}>{form.projectName}</strong> has been created under{' '}
                    <strong style={{ color: 'var(--t1)' }}>{node.name}</strong>.
                </div>
                <div style={{
                    background: 'var(--card)', border: '1px solid var(--bdr)', borderRadius: '12px',
                    padding: '16px 24px', display: 'flex', gap: '28px', fontSize: '11px',
                }}>
                    <div><span style={{ color: 'var(--t3)' }}>Project:</span> <strong>{form.projectName}</strong></div>
                    <div><span style={{ color: 'var(--t3)' }}>Owner:</span> <strong>{form.ownerName}</strong></div>
                    {form.starName && <div><span style={{ color: 'var(--t3)' }}>Star:</span> <strong>{form.starName}</strong></div>}
                    <div><span style={{ color: 'var(--t3)' }}>Created:</span> <strong>{form.createdDate}</strong></div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button onClick={() => navigate(`/dashboard/${segments.join('/')}`)} style={btnPrimary}>Go to Dashboard</button>
                    <button onClick={() => { setSubmitted(false); setForm(f => ({ ...f, projectName: '', ownerName: '', teamOwnerEmail: '', starName: '', description: '' })); }} style={btnSecondary}>Create Another</button>
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
                <button onClick={() => navigate(`/dashboard/${segments.join('/')}`)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
                    color: 'var(--t2)', background: 'var(--card)', border: '1px solid var(--bdr)',
                    padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                }}>
                    <ArrowLeft size={13} /> Back to Dashboard
                </button>
                <div style={{ width: 1, height: 20, background: 'var(--bdr)' }} />
                <FolderOpen size={14} color="var(--amber)" />
                <div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Create New Project</span>
                    <span style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 8 }}>
                        in {node.name} ({node.type === 'team' ? 'Team' : node.type})
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
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>New Project</div>
                                <div style={{ fontSize: '11px', color: 'var(--t3)' }}>
                                    Add a new project to <strong style={{ color: 'var(--t2)' }}>{node.name}</strong>
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

                        {/* Owner Name */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <User size={11} color="var(--blue)" /> Owner Name *
                                </span>
                            </label>
                            <input
                                style={{ ...inputStyle, borderColor: errors.ownerName ? 'var(--red)' : 'var(--bdr)' }}
                                placeholder="e.g. Ravi Kumar"
                                value={form.ownerName}
                                onChange={e => { u('ownerName', e.target.value); setErrors(er => ({ ...er, ownerName: '' })); }}
                            />
                            {errors.ownerName && (
                                <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertCircle size={10} /> {errors.ownerName}
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

                        {/* Star Name + Created Date */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                            <div>
                                <label style={labelStyle}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Star size={11} color="var(--purple)" /> Star Name
                                    </span>
                                </label>
                                <input
                                    style={inputStyle}
                                    placeholder="e.g. Bellatrix (optional)"
                                    value={form.starName}
                                    onChange={e => u('starName', e.target.value)}
                                />
                            </div>
                            <div>
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
                            <span>The new project will be created under <strong>{node.name}</strong>. Schemas can be attached to this project after creation using the schema attach wizard.</span>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => navigate(`/dashboard/${segments.join('/')}`)} style={btnSecondary}>
                                Cancel
                            </button>
                            <button onClick={handleSubmit} style={{
                                ...btnPrimary,
                                opacity: form.projectName.trim() && form.ownerName.trim() && form.teamOwnerEmail.trim() ? 1 : 0.6,
                            }}>
                                <FolderOpen size={14} /> Create Project
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
