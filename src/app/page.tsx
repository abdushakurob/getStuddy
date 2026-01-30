'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Zap, Brain, Star, Coins, Flame,
    ArrowRight, Trophy, Swords, Sparkles,
    Users, Target, MessageSquare
} from 'lucide-react';

export default function LandingPage() {
    return (
        <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'var(--text-main)' }}>

            {/* --- THE HUD --- */}
            <nav style={{
                padding: '20px 40px',
                borderBottom: '4px solid var(--border-thick)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(14, 18, 23, 0.9)',
                backdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 1000
            }}>
                <div style={{ fontWeight: '900', fontSize: '28px', letterSpacing: '-2px', color: 'var(--brand-primary)' }}>STUDDY</div>

                <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '32px' }}>
                        <NavAnchor href="#meet-me">Meet Me</NavAnchor>
                        <NavAnchor href="#the-plan">The Plan</NavAnchor>
                        <NavAnchor href="#the-squad">The Squad</NavAnchor>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', borderLeft: '2px solid var(--border-thick)', paddingLeft: '32px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Flame size={20} color="var(--color-streak)" fill="var(--color-streak)" />
                            <Star size={20} color="var(--color-xp)" fill="var(--color-xp)" />
                        </div>
                        <Link href="/arena" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>PLAY NOW</Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* --- HERO: STUDDY INTRODUCES HIMSELF --- */}
                <section style={{
                    minHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '80px 24px',
                    textAlign: 'center',
                    position: 'relative'
                }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: 'var(--glow-primary)', filter: 'blur(150px)', borderRadius: '50%', opacity: 0.3, zIndex: 0 }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                background: 'var(--bg-elevated)',
                                padding: '8px 20px',
                                border: '2px solid var(--brand-primary)',
                                borderRadius: '100px',
                                color: 'var(--brand-primary)',
                                fontWeight: '900',
                                fontSize: '12px',
                                letterSpacing: '2px',
                                marginBottom: '32px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <MessageSquare size={14} fill="var(--brand-primary)" /> INCOMING MESSAGE FROM STUDDY
                        </motion.div>

                        <h1 style={{ fontSize: 'clamp(50px, 12vw, 130px)', lineHeight: 0.85, marginBottom: '40px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '-4px' }}>
                            YO! I'M <br /> <span className="text-gradient">STUDDY.</span>
                        </h1>

                        <p style={{ fontSize: '24px', color: 'var(--text-main)', maxWidth: '750px', margin: '0 auto 56px', lineHeight: 1.3, fontWeight: 700 }}>
                            I stay up all night reading your slides so you don't have to. Drop your notes, and I’ll map out exactly how we win your next exam.
                        </p>

                        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
                            <Link href="/arena" className="btn btn-primary animate-pulse-glow" style={{ fontSize: '22px', padding: '24px 56px' }}>
                                LET'S GET IT
                            </Link>
                        </div>
                    </div>
                </section>

                {/* --- THE BUDDY: "I'VE GOT YOU" --- */}
                <section id="meet-me" style={{ padding: '100px 24px', background: 'var(--bg-surface)', borderTop: '4px solid var(--border-thick)' }}>
                    <div className="section-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: 'var(--brand-primary)', fontWeight: '900', fontSize: '14px', marginBottom: '16px', letterSpacing: '2px' }}>PARTNER UP</div>
                            <h2 style={{ fontSize: '64px', fontWeight: 900, marginBottom: '32px', textTransform: 'uppercase', lineHeight: 1 }}>I'm the brain <br /> in the background.</h2>
                            <p style={{ fontSize: '20px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '40px' }}>
                                Look, studying alone sucks. That’s why I’m here. You give me the material, and I’ll break it down into something that actually makes sense. I don’t just answer questions; I lead the way.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                <FeatureItem icon={<Brain size={24} />} title="I Never Sleep" text="I process your entire syllabus in seconds." />
                                <FeatureItem icon={<Target size={24} />} title="I Spot Weakness" text="I know exactly what you’re missing." />
                            </div>
                        </div>
                        <div className="card" style={{ padding: '40px', background: 'var(--bg-app)', borderStyle: 'dashed', position: 'relative' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '32px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)' }} />
                                <span style={{ fontWeight: '900', fontSize: '14px' }}>STUDDY: "Dw, I just scanned the PDF. Topic 3 is the heavy one. I've got a plan."</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ height: '40px', width: '100%', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid var(--border-thick)' }} />
                                <div style={{ height: '40px', width: '80%', background: 'var(--bg-elevated)', borderRadius: '8px', border: '2px solid var(--border-thick)' }} />
                                <div style={{ height: '40px', width: '90%', background: 'var(--brand-primary)', borderRadius: '8px', border: '2px solid var(--border-thick)', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '900', fontSize: '14px' }}>VIEW MY STUDY MAP</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- THE PATH: "WE LEVEL UP" --- */}
                <section id="the-plan" style={{ padding: '120px 24px' }}>
                    <div className="section-container" style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '72px', fontWeight: 900, marginBottom: '32px', textTransform: 'uppercase' }}>CHASE THAT MASTERY.</h2>
                        <p style={{ fontSize: '22px', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto 80px' }}>
                            I’m not just a tool; I’m your coach. Every session we finish adds to your XP. The more you put in, the higher we climb.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
                            <GameCard
                                icon={<Flame size={48} color="var(--color-streak)" fill="var(--color-streak)" />}
                                title="Feed My Fire"
                                desc="Show up every day and I’ll multiply your progress. If you’re consistent, I’m twice as effective."
                            />
                            <GameCard
                                icon={<Star size={48} color="var(--color-xp)" fill="var(--color-xp)" />}
                                title="Climb the Ranks"
                                desc="Every time you get a concept right, you earn XP. Let's see how fast we can hit Level 10."
                            />
                            <GameCard
                                icon={<Coins size={48} color="var(--color-credit)" fill="var(--color-credit)" />}
                                title="Score Power-Ups"
                                desc="Rack up credits and use them for when things get real. I'll drop mock exams and deep dives on command."
                            />
                        </div>
                    </div>
                </section>

                {/* --- THE SQUAD: "JOIN THE FRONT LINES" --- */}
                <section id="the-squad" style={{ padding: '120px 24px', background: 'var(--bg-surface)', borderTop: '4px solid var(--border-thick)' }}>
                    <div className="section-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '80px', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '64px', fontWeight: 900, marginBottom: '32px', textTransform: 'uppercase' }}>JOIN THE SQUAD</h2>
                            <p style={{ fontSize: '20px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '40px' }}>
                                You’re not the only one fighting for that ‘A’. Thousands of players are in the Arena right now. Hop in and show everyone who the top scholar is.
                            </p>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', marginLeft: '12px' }}>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} style={{ width: '56px', height: '56px', borderRadius: '50%', border: '4px solid var(--border-thick)', background: 'var(--bg-elevated)', marginLeft: '-16px', overflow: 'hidden' }}>
                                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, var(--bg-elevated), var(--border-thick))' }} />
                                        </div>
                                    ))}
                                </div>
                                <span style={{ fontWeight: '900', fontSize: '18px' }}>+ 2,400 crushing sessions daily</span>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '32px', boxShadow: '12px 12px 0 var(--border-thick)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <span style={{ fontWeight: '900', color: 'var(--brand-primary)' }}>GLOBAL ARENA</span>
                                <Trophy size={20} color="var(--color-credit)" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <MiniPlayerRow rank={1} name="Dave_A" level={42} />
                                <MiniPlayerRow rank={2} name="Sarah_S" level={38} />
                                <MiniPlayerRow rank={3} name="You" level={0} isUser />
                                <MiniPlayerRow rank={4} name="Chidi_X" level={29} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- JOIN THE ARENA --- */}
                <section style={{
                    padding: '160px 24px',
                    textAlign: 'center',
                    background: 'linear-gradient(to bottom, transparent, var(--glow-primary))',
                    borderTop: '4px solid var(--border-thick)'
                }}>
                    <div className="section-container">
                        <h2 style={{ fontSize: 'clamp(50px, 10vw, 100px)', fontWeight: 900, marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '-2px' }}>
                            READY TO WIN?
                        </h2>
                        <Link href="/arena" className="btn btn-primary" style={{ fontSize: '28px', padding: '28px 72px' }}>
                            LET'S START, STUDDY
                        </Link>
                    </div>
                </section>
            </main>

            <footer style={{ padding: '80px 40px', borderTop: '4px solid var(--border-thick)', backgroundColor: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ fontWeight: '900', fontSize: '32px', letterSpacing: '-2px', color: 'var(--brand-primary)' }}>STUDDY</div>
                    <div style={{ display: 'flex', gap: '40px' }}>
                        <NavAnchor href="#">Twitter</NavAnchor>
                        <NavAnchor href="#">Discord</NavAnchor>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// --- ACCESSORIES ---

function NavAnchor({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <a href={href} style={{ fontWeight: '900', textDecoration: 'none', color: 'var(--text-main)', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {children}
        </a>
    );
}

function FeatureItem({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--brand-primary)' }}>{icon}</div>
            <h4 style={{ fontWeight: '900', fontSize: '18px', textTransform: 'uppercase' }}>{title}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>{text}</p>
        </div>
    );
}

function GameCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
            <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '16px', textTransform: 'uppercase' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
        </div>
    );
}

function MiniPlayerRow({ rank, name, level, isUser = false }: { rank: number, name: string, level: number, isUser?: boolean }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: isUser ? 'var(--glow-primary)' : 'var(--bg-elevated)',
            borderRadius: '12px',
            border: isUser ? '2px solid var(--brand-primary)' : '2px solid var(--border-thick)',
            boxShadow: isUser ? '0 0 15px var(--glow-primary)' : 'none'
        }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontWeight: '900', color: 'var(--text-muted)', width: '20px' }}>{rank}</span>
                <span style={{ fontWeight: '800' }}>{name}</span>
            </div>
            <span style={{ fontWeight: '900', color: 'var(--color-xp)' }}>LV. {level}</span>
        </div>
    );
}
