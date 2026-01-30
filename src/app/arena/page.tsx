'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Swords, History, Settings, UserCircle } from 'lucide-react';

/*
  ARENA PAGE
  The cockpit for the student. Focus is on the Agent's decision.
*/

export default function ArenaPage() {
    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header with Stats */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
                <div>
                    <h1 style={{ fontSize: '24px' }}>Data Structures & Algorithms</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Winter Semester 2026</p>
                </div>

                <div style={{ display: 'flex', gap: '32px' }}>
                    <StatBox label="Focus State" value="Bright" color="var(--brand-primary)" />
                    <StatBox label="XP (Fuel)" value="12,450" color="var(--xp-gold)" />
                    <StatBox label="Readiness" value="68%" color="var(--brand-primary)" />
                </div>
            </header>

            {/* Studdy - The Companion focus area */}
            <section style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px' }}>

                {/* Core Suggestion (Agent's autonomous path) */}
                <div className="box" style={{ border: '2px solid var(--brand-primary)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <span className="badge-accent" style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--brand-soft)',
                            color: 'var(--brand-primary)',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700'
                        }}>
                            AGENT SUGGESTION
                        </span>
                        <h2 style={{ fontSize: '28px', marginTop: '16px' }}>Ready for a 15-minute training on Binary Search Trees?</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '17px', marginTop: '12px' }}>
                            Your knowledge on tree traversal has decayed by 14% over the last 3 days. Let's sharpen this branch.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button className="btn btn-primary" style={{ padding: '16px 32px' }}>
                            <Play size={20} style={{ marginRight: '8px' }} /> Start Training Now
                        </button>
                        <button className="btn btn-outline">Analyze Syllabus</button>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <ActionButton icon={<Swords size={20} />} label="Enter Battle Arena" sub="Test your full course mastery" />
                    <ActionButton icon={<History size={20} />} label="Study Records" sub="Review past session highlights" />
                    <ActionButton icon={<UserCircle size={20} />} label="Student Profile" sub="Manage levels and evolutions" />
                    <ActionButton icon={<Settings size={20} />} label="Configuration" sub="Course settings and notifications" />
                </div>
            </section>

            {/* Progress Footer */}
            <footer style={{ marginTop: '48px', padding: '24px', backgroundColor: 'var(--bg-soft)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: '600' }}>
                    <span>Module Progression</span>
                    <span>4 / 12 Topics Mastered</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '33%', height: '100%', backgroundColor: 'var(--brand-primary)' }}></div>
                </div>
            </footer>
        </div>
    );
}

/* Helper Components for clean code (Internal to this page for now) */

function StatBox({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{label}</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: color }}>{value}</p>
        </div>
    );
}

function ActionButton({ icon, label, sub }: { icon: React.ReactNode, label: string, sub: string }) {
    return (
        <div className="box" style={{
            padding: '16px',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s'
        }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-soft)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
        >
            <div style={{ color: 'var(--text-muted)' }}>{icon}</div>
            <div>
                <p style={{ fontWeight: '600', fontSize: '15px' }}>{label}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</p>
            </div>
        </div>
    );
}
