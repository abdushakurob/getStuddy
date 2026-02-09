'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Zap, CheckCircle, ArrowRight, LayoutGrid,
    Map as MapIcon, StickyNote, Bot, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
    return (
        <div className="bg-[var(--bg-app)] min-h-screen text-[var(--text-main)] font-[family-name:var(--font-plus-jakarta)] overflow-x-hidden selection:bg-[var(--brand-primary)] selection:text-white">

            <NavBar />

            {/* --- HERO: YOUR AGENTIC STUDY NAVIGATOR --- */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 text-center max-w-6xl mx-auto pt-32 pb-20">

                {/* Background Blobs (Army Green Tint) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--brand-primary)] opacity-10 rounded-full blur-[120px] -z-10" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <span className="px-4 py-1.5 glass-panel rounded-full text-sm font-bold text-[var(--brand-primary)] inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                        Agentic Study Navigator <span className="text-gray-400 font-medium">• Powered by Gemini</span>
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-6xl md:text-8xl font-black mb-8 leading-[1.0] tracking-tight text-[var(--text-main)]"
                >
                    Stop Managing. <br />
                    <span className="text-[var(--brand-primary)]">Start Learning.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-xl md:text-2xl text-[var(--text-muted)] max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
                >
                    An AI agent that negotiates your study plan, surfaces the exact right PDFs, videos, and diagrams at the right time, and keeps you focused. You do the learning. It handles the logistics.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm mx-auto z-20"
                >
                    <Link href="/dashboard" className="flex-1 btn-primary flex items-center justify-center gap-2 group">
                        Get Started <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="#how-it-works" className="flex-1 btn-secondary flex items-center justify-center">
                        See How It Works
                    </Link>
                </motion.div>

                {/* Hero Visual Mockup - Agent Interaction */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-20 w-full max-w-4xl mx-auto"
                >
                    <div className="glass-panel p-4 rounded-[40px]">
                        <div className="aspect-[16/9] bg-white rounded-3xl overflow-hidden relative group border border-gray-100 shadow-sm flex flex-col">
                            <div className="h-12 border-b border-gray-100 bg-white flex items-center px-6 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div className="flex-1 p-8 bg-gray-50/50 flex flex-col justify-center items-center relative overflow-hidden">
                                <div className="absolute top-10 left-10 bg-white p-4 rounded-xl shadow-sm border border-gray-100 max-w-xs rotate-[-2deg]">
                                    <p className="text-xs text-gray-400 font-bold mb-1">USER</p>
                                    <p className="text-sm font-medium text-gray-800">I only have 45 minutes. Can we just focus on the Osmosis diagram?</p>
                                </div>
                                <div className="absolute bottom-10 right-10 bg-[var(--text-main)] p-4 rounded-xl shadow-lg max-w-xs rotate-[2deg]">
                                    <p className="text-xs text-gray-400 font-bold mb-1">AGENT</p>
                                    <p className="text-sm font-medium text-white">Negotiating plan... Done.</p>
                                    <div className="mt-2 bg-white/10 p-2 rounded text-xs text-gray-200">
                                        <div className="flex items-center gap-2">
                                            <Zap size={12} className="text-[var(--brand-primary)]" />
                                            <span>Focus: Biology Textbook (Page 42)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>


            {/* --- PILLAR 1: NEGOTIATED PLANNING --- */}
            <SectionWrapper>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                    <div>
                        <SectionIcon icon={MapIcon} color="blue" />
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-[var(--text-main)]">Negotiated Planning</h2>
                        <p className="text-xl text-[var(--text-muted)] leading-relaxed mb-8">
                            Static schedules fail because life happens. Studdy negotiates with you. Tell it you're tired, busy, or hyper-focused, and it rebuilds your roadmap instantly. Collaborative, not rigid.
                        </p>
                        <ul className="space-y-4">
                            <FeatureCheck text="Dynamic schedule adjustment" />
                            <FeatureCheck text="Collaborative goal setting" />
                            <FeatureCheck text="Responds to your energy levels" />
                        </ul>
                    </div>
                    <div className="glass-panel p-8 rounded-[40px] rotate-1 transition-transform duration-500 hover:rotate-0">
                        {/* Visual: Chat negotiation */}
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 max-w-[80%]">
                                <p className="text-sm text-gray-600">Here is the full 2-hour plan for Chapter 4.</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-2xl rounded-tr-none border border-blue-100 max-w-[80%] ml-auto">
                                <p className="text-sm text-blue-900">Too long. I have soccer practice in an hour.</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-[var(--brand-primary)] shadow-sm max-w-[90%]">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap size={16} className="text-[var(--brand-primary)]" />
                                    <span className="text-xs font-bold text-[var(--brand-primary)]">PLAN UPDATED</span>
                                </div>
                                <p className="text-sm text-gray-800 font-bold">New Mission: 45-Minute Sprint</p>
                                <p className="text-xs text-gray-500 mt-1">Focusing strictly on high-yield concepts from the summary.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionWrapper>


            {/* --- PILLAR 2: MULTIMODAL CONTEXT --- */}
            <SectionWrapper className="bg-white border-y border-[var(--border-thick)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center md:flex-row-reverse">
                    <div className="order-last md:order-first relative">
                        {/* Visual: Resource Surfacing */}
                        <div className="relative glass-panel p-8 rounded-[40px] overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-[var(--brand-primary)] opacity-5 blur-[80px] rounded-full"></div>
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <Bot size={20} className="text-gray-500" />
                                    </div>
                                    <div className="text-sm font-medium text-gray-600">I've cued up the video at 14:20 and opened the diagram.</div>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex gap-4 items-center transform translate-x-4">
                                    <div className="w-12 h-16 bg-red-50 border border-red-100 rounded flex items-center justify-center text-red-400">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">Lecture_04_Mitosis.mp4</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">14:20</span>
                                            <span className="text-xs text-[var(--brand-primary)] font-bold">Playing</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <SectionIcon icon={LayoutGrid} color="green" />
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-[var(--text-main)]">Multimodal Context Study</h2>
                        <p className="text-xl text-[var(--text-muted)] leading-relaxed mb-8">
                            Learning isn't just text. It's video, diagrams, and audio. The Agent seamlessly connects your PDFs with your lecture videos, autonomously switching contexts so you never lose flow.
                        </p>
                        <ul className="space-y-4">
                            <FeatureCheck text="Context-aware video seeking" />
                            <FeatureCheck text="Intelligent PDF scrolling" />
                            <FeatureCheck text="Cross-modal information synthesis" />
                        </ul>
                    </div>
                </div>
            </SectionWrapper>


            {/* --- PILLAR 3: PARKING LOT --- */}
            <SectionWrapper>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                    <div>
                        <SectionIcon icon={StickyNote} color="purple" />
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-[var(--text-main)]">The Parking Lot</h2>
                        <p className="text-xl text-[var(--text-muted)] leading-relaxed mb-8">
                            Curiosity kills focus. When you have an off-topic thought ("Wait, how does this relate to X?"), the Agent "parks" it for later. Stay in flow now. Explore the rabbit holes after the mission is complete.
                        </p>
                        <ul className="space-y-4">
                            <FeatureCheck text="Protect your flow state" />
                            <FeatureCheck text="Never lose a good question" />
                            <FeatureCheck text="Dedicated exploration time" />
                        </ul>
                    </div>
                    <div className="relative">
                        {/* Visual: Sticky Notes */}
                        <div className="glass-panel p-8 rounded-[40px] relative min-h-[300px] flex items-center justify-center bg-gray-50">
                            <div className="absolute top-6 right-6 rotate-3 transform transition-transform hover:-rotate-2">
                                <div className="bg-yellow-200 text-yellow-900 p-4 w-40 h-40 shadow-md font-handwriting flex items-center justify-center text-center text-sm font-bold leading-tight">
                                    "Is this related to quantum tunneling?"
                                </div>
                            </div>
                            <div className="absolute bottom-10 left-10 -rotate-2 transform transition-transform hover:rotate-1">
                                <div className="bg-yellow-100 text-yellow-800 p-4 w-40 h-40 shadow-sm font-handwriting flex items-center justify-center text-center text-sm font-medium leading-tight">
                                    "Check professor's email about the midterm"
                                </div>
                            </div>
                            <div className="z-10 bg-white px-6 py-3 rounded-full shadow-xl border border-gray-100 flex items-center gap-2">
                                <CheckCircle size={16} className="text-[var(--brand-primary)]" />
                                <span className="font-bold text-gray-800 text-sm">Parked. Staying on topic.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionWrapper>


            {/* --- CTA --- */}
            <section className="py-32 px-6 text-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-5xl md:text-7xl font-black mb-8 text-[var(--text-main)]">
                        Your Logistics. <br />
                        <span className="text-[var(--brand-primary)]">Handled.</span>
                    </h2>
                    <p className="text-xl text-[var(--text-muted)] mb-12 font-medium max-w-xl mx-auto">
                        Experience the first study tool that actually understands what you're trying to do.
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        <Link href="/dashboard" className="btn-primary flex items-center gap-2 group text-xl px-12 py-5 rounded-[20px]">
                            Start Learning Now
                        </Link>
                        <span className="text-sm font-bold text-gray-400">No credit card required</span>
                    </div>
                </motion.div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-12 border-t border-[var(--border-thick)] text-center text-gray-400 text-sm font-medium">
                <div className="flex justify-center gap-8 mb-8">
                    <a href="#" className="hover:text-[var(--brand-primary)]">Manifesto</a>
                    <a href="#" className="hover:text-[var(--brand-primary)]">Agent logic</a>
                    <a href="#" className="hover:text-[var(--brand-primary)]">Pricing</a>
                    <a href="#" className="hover:text-[var(--brand-primary)]">Contact</a>
                </div>
                <p>© 2026 goStuddy • Agentic Learning Systems</p>
            </footer>

        </div>
    );
}

// --- SUBCOMPONENTS ---

function SectionWrapper({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <section className={cn("py-32 px-6", className)}>
            <div className="max-w-6xl mx-auto">
                {children}
            </div>
        </section>
    );
}

function SectionIcon({ icon: Icon, color, className }: { icon: any, color: string, className?: string }) {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-[#4C8233]/10 text-[var(--brand-primary)]",
        purple: "bg-purple-50 text-purple-600",
        red: "bg-red-50 text-red-500",
    };

    return (
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8", colorClasses[color], className)}>
            <Icon size={32} strokeWidth={2.5} />
        </div>
    );
}

function FeatureCheck({ text, dark }: { text: string, dark?: boolean }) {
    return (
        <div className="flex items-center gap-3 font-medium text-lg">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", dark ? "bg-white/10 text-[var(--brand-primary)]" : "bg-[#4C8233]/10 text-[var(--brand-primary)]")}>
                <CheckCircle size={14} strokeWidth={3} />
            </div>
            <span className={dark ? "text-gray-300" : "text-[var(--text-muted)]"}>{text}</span>
        </div>
    );
}

function FeatureCard({ title, desc, delay }: { title: string, desc: string, delay: number }) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay }}
            viewport={{ once: true }}
            className="glass-panel p-8 rounded-3xl hover:border-[var(--brand-primary)] transition-colors"
        >
            <h3 className="text-xl font-bold text-[var(--text-main)] mb-3">{title}</h3>
            <p className="text-[var(--text-muted)] leading-relaxed font-medium">{desc}</p>
        </motion.div>
    )
}

function NavBar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
            <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3 pointer-events-auto">
                <span className="font-extrabold text-xl tracking-tight text-[var(--brand-dark)]">goStuddy</span>
            </div>
            <div className="flex gap-4 pointer-events-auto">
                <Link href="/dashboard" className="btn-secondary text-sm">
                    Log In
                </Link>
                <Link href="/dashboard/signup" className="btn-primary text-sm shadow-xl shadow-[#4C8233]/20">
                    Sign Up
                </Link>
            </div>
        </nav>
    )
}

// function Brain(props: any) { return <Zap {...props} /> } 
