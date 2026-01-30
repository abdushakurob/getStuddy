'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Sparkles, AlertCircle } from 'lucide-react';

/*
  TRAINING PAGE
  A focused chat-led interface where Studdy guides the student.
  Aesthetics: Clean, spacious, conversation-first.
*/

export default function TrainPage() {
    const [messages] = useState([
        { role: 'agent', content: "Welcome back. We're focusing on Binary Search Trees today. Before we dive into balancing, can you recall the primary rule of a BST?" }
    ]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Session Header */}
            <header style={{
                padding: '20px 40px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-surface)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link href="/arena" style={{ color: 'var(--text-main)' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: '16px' }}>Binary Search Trees</h1>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Session: 14m remaining</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>
                        Focus: <span style={{ color: 'var(--brand-primary)' }}>High</span>
                    </div>
                    <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}>End Session</button>
                </div>
            </header>

            {/* Chat Area */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {messages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--brand-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '14px',
                                flexShrink: 0
                            }}>
                                S
                            </div>
                            <div style={{ fontSize: '17px', lineHeight: '1.6', color: 'var(--text-main)', marginTop: '2px' }}>
                                {msg.content}
                            </div>
                        </div>
                    ))}

                </div>
            </main>

            {/* Input Area */}
            <footer style={{ padding: '32px 40px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Type your explanation or query..."
                        style={{
                            width: '100%',
                            padding: '16px 20px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--bg-soft)',
                            color: 'var(--text-main)',
                            fontSize: '16px',
                            outline: 'none'
                        }}
                    />
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '8px' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <Sparkles size={20} />
                        </button>
                        <button style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer' }}>
                            <Send size={20} />
                        </button>
                    </div>
                </div>
                <div style={{ maxWidth: '800px', margin: '12px auto 0', display: 'flex', gap: '24px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={14} /> Credits consumed per message: 5 Refinement
                    </p>
                </div>
            </footer>
        </div>
    );
}
