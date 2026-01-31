'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Zap, Library, MessageCircle, TrendingUp,
    CheckCircle, ArrowRight, LayoutGrid, Clock, Trophy, Heart,
    FlameIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
    return (
        <div className="bg-[var(--bg-app)] min-h-screen text-[var(--text-main)] font-[family-name:var(--font-plus-jakarta)] overflow-x-hidden selection:bg-[var(--brand-primary)] selection:text-white">

            <NavBar />

            {/* --- HERO: MEET YOUR AI STUDY BUDDY --- */}
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
                        The AI Companion for Students
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-6xl md:text-8xl font-black mb-8 leading-[1.0] tracking-tight text-[var(--text-main)]"
                >
                    Meet Your <br />
                    <span className="text-[var(--brand-primary)]">AI Study Buddy</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-xl md:text-2xl text-[var(--text-muted)] max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
                >
                    goStuddy reads your course materials, collaborates with you on study plans, and keeps you consistent—adapting to how you actually learn.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm mx-auto z-20"
                >
                    <Link href="/dashboard/upload" className="flex-1 btn-primary flex items-center justify-center gap-2 group">
                        Get Started Free <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="#features" className="flex-1 btn-secondary flex items-center justify-center">
                        Watch Demo
                    </Link>
                </motion.div>

                {/* Hero Visual Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-20 w-full max-w-4xl mx-auto"
                >
                    <div className="glass-panel p-4 rounded-[40px]">
                        <div className="aspect-[16/9] bg-white rounded-3xl overflow-hidden relative group border border-gray-100">
                            {/* Fake UI: Chat Interface */}
                            <div className="absolute inset-0 flex flex-col bg-[#FAFAFA]">
                                <div className="h-16 border-b border-gray-100 bg-white flex items-center px-8 justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] shadow-sm" />
                                        <div className="w-32 h-3 bg-gray-100 rounded-full" />
                                    </div>
                                </div>
                                <div className="flex-1 p-8 space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] shrink-0 text-white flex items-center justify-center font-bold text-xs">S</div>
                                        <div className="bg-white border border-gray-100 p-6 rounded-2xl rounded-tl-sm shadow-sm max-w-lg">
                                            <div className="space-y-2">
                                                Hello! I've analyzed your bio syllabus...
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 flex-row-reverse">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                                        <div className="bg-[var(--text-main)] p-6 rounded-2xl rounded-tr-sm shadow-sm text-white">
                                            I can only study 3x per week.
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] shrink-0 text-white flex items-center justify-center font-bold text-xs">S</div>
                                        <div className="bg-white border border-gray-100 p-6 rounded-2xl rounded-tl-sm shadow-sm">
                                            Got it. Adjusting your timeline to maximize retention...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>


            {/* --- FEATURE 1: ORGANIZE YOUR WAY --- */}
            <SectionWrapper>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                    <div>
                        <SectionIcon icon={LayoutGrid} color="blue" />
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-[var(--text-main)]">Organize Your Way</h2>
                        <p className="text-xl text-[var(--text-muted)] leading-relaxed mb-8">
                            Structure your courses however makes sense to you. Folders for lectures, past exams, notes—arrange it your way. goStuddy learns from how you organize.
                        </p>
                        <ul className="space-y-4">
                            <FeatureCheck text="Flexible course organization" />
                            <FeatureCheck text="Smart material categorization" />
                            <FeatureCheck text="Your structure, amplified by AI" />
                        </ul>
                    </div>
                    <div className="glass-panel p-8 rounded-[40px] rotate-2 hover:rotate-0 transition-transform duration-500">
                        {/* Interactive Drag Drop Mockup */}
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs">Course Explorer</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    key={i}
                                    className="aspect-square rounded-2xl bg-white border border-[var(--border-thick)] flex flex-col items-center justify-center gap-3 cursor-pointer group hover:border-[var(--brand-primary)] hover:shadow-lg transition-all"
                                >
                                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-colors">
                                        <Library size={24} />
                                    </div>
                                    <span className="font-bold text-sm text-gray-500 group-hover:text-[var(--brand-primary)]">Folder {i}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </SectionWrapper>


            {/* --- FEATURE 2: PLAN TOGETHER --- */}
            <SectionWrapper className="bg-white border-y border-[var(--border-thick)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center md:flex-row-reverse">
                    <div className="order-last md:order-first relative h-[500px]">
                        {/* Chat Plan Visual */}
                        <div className="absolute inset-x-0 bottom-0 top-10 bg-[var(--bg-app)] rounded-[40px] border border-[var(--border-thick)] shadow-2xl p-6 flex flex-col justify-end gap-4">
                            <div className="bg-white p-4 rounded-xl rounded-bl-sm border border-[var(--border-thick)] shadow-sm max-w-[80%] self-start">
                                <p className="text-sm font-medium text-gray-600">Based on your syllabus, the exam is on May 15th.</p>
                            </div>
                            <div className="bg-[var(--text-main)] p-4 rounded-xl rounded-br-sm shadow-lg max-w-[80%] self-end text-white">
                                <p className="text-sm font-medium">Okay, but I work weekends.</p>
                            </div>
                            <div className="bg-[var(--brand-primary)] p-4 rounded-xl rounded-bl-sm shadow-md max-w-[90%] self-start text-white">
                                <p className="text-sm font-bold flex items-center gap-2">
                                    <Zap size={16} fill="currentColor" />
                                    Plan updated: Weekday intensity increased by 15%.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <SectionIcon icon={Clock} color="green" />
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-[var(--text-main)]">Plan Together</h2>
                        <p className="text-xl text-[var(--text-muted)] leading-relaxed mb-8">
                            Upload your materials. goStuddy analyzes everything, then suggests a study plan based on your goals. Approve it, adjust it, or redesign it completely.
                        </p>
                        <ul className="space-y-4">
                            <FeatureCheck text="AI-generated study roadmaps" />
                            <FeatureCheck text="Fully customizable plans" />
                            <FeatureCheck text="Adapts to your schedule and pace" />
                        </ul>
                    </div>
                </div>
            </SectionWrapper>


            {/* --- FEATURE 3: ADAPTIVE SESSIONS --- */}
            <SectionWrapper>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                    <div>
                        <SectionIcon icon={Brain} color="purple" />
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-[var(--text-main)]">Study Sessions That Adapt</h2>
                        <p className="text-xl text-[var(--text-muted)] leading-relaxed mb-8">
                            goStuddy guides you through concepts, generates practice questions from your materials, and adjusts difficulty in real-time based on how you're doing.
                        </p>
                        <ul className="space-y-4">
                            <FeatureCheck text="Explanations grounded in your course" />
                            <FeatureCheck text="Practice from your past exams" />
                            <FeatureCheck text="Difficulty that matches your level" />
                        </ul>
                    </div>
                    <div className="relative">
                        {/* Card Stack Visual */}
                        <div className="absolute top-0 left-0 w-full h-[400px] bg-white rounded-3xl border border-[var(--border-thick)] shadow-sm rotate-6 opacity-40 scale-90"></div>
                        <div className="absolute top-4 left-0 w-full h-[400px] bg-white rounded-3xl border border-[var(--border-thick)] shadow-sm -rotate-3 opacity-70 scale-95"></div>
                        <div className="relative w-full h-[400px] bg-white rounded-3xl border border-[var(--border-thick)] shadow-xl flex flex-col p-8">
                            <div className="flex-1 flex items-center justify-center text-center">
                                <div>
                                    <span className="text-xs font-bold text-[var(--brand-primary)] uppercase tracking-widest mb-4 block">Question</span>
                                    <h3 className="text-2xl font-bold text-[var(--text-main)]">Explain the process of Osmosis.</h3>
                                </div>
                            </div>
                            <div className="h-14 bg-gray-50 rounded-xl border border-[var(--border-thick)] flex items-center justify-center text-gray-400 font-bold hover:bg-[var(--brand-primary)] hover:text-white transition-colors cursor-pointer">
                                Reveal Answer
                            </div>
                        </div>
                    </div>
                </div>
            </SectionWrapper>


            {/* --- FEATURE 4: BUILD HABIT --- */}
            <SectionWrapper>
                <div className="bg-[var(--text-main)] text-white rounded-[4rem] p-12 md:p-20 shadow-2xl relative overflow-hidden">
                    {/* Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--brand-primary)] opacity-20 blur-[120px] rounded-full pointer-events-none"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center relative z-10">
                        <div className="order-last md:order-first flex justify-center">
                            <div className="relative w-80 h-80">
                                <div className="absolute inset-0 bg-[var(--brand-primary)] rounded-full blur-[60px] opacity-20 animate-pulse"></div>
                                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] w-full h-full flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-2">
                                        <FlameIcon size={80} className="font-black mb-2 " />
                                        <div className="text-8xl font-black mb-2"> 12</div>
                                    </div>
                                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">Day Streak</div>
                                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                                        <div className="h-full w-[80%] bg-[var(--brand-primary)]"></div>
                                    </div>
                                    <div className="mt-4 text-xs font-bold text-[var(--brand-primary)]">Level 5 Scholar</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="w-14 h-14 bg-white/10 text-[var(--brand-primary)] rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                <Trophy size={28} />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black mb-6">Build the Habit</h2>
                            <p className="text-xl text-gray-400 leading-relaxed mb-8">
                                Earn rewards for showing up. Track mastery across topics. Watch your progress compound. goStuddy makes consistency feel achievable.
                            </p>
                            <ul className="space-y-4">
                                <FeatureCheck text="Streaks that motivate" dark />
                                <FeatureCheck text="Clear progress tracking" dark />
                                <FeatureCheck text="Rewards that reinforce effort" dark />
                            </ul>
                        </div>
                    </div>
                </div>
            </SectionWrapper >


            {/* --- FEATURE 5: STAYS WITH YOU --- */}
            < SectionWrapper >
                <div className="text-center max-w-4xl mx-auto mb-20">
                    <SectionIcon icon={Heart} color="red" className="mx-auto" />
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-[var(--text-main)]">Stays With You</h2>
                    <p className="text-xl text-[var(--text-muted)] leading-relaxed">
                        Struggling on a topic? goStuddy notices and adjusts. Crushing it? It moves faster. Busy week? It reschedules. Your study buddy adapts to your life, not the other way around.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard title="Real-time adaptation" desc="Miss a day? The plan auto-shifts." delay={0} />
                    <FeatureCard title="Flexible pacing" desc="Go deep on hard topics, skim the easy ones." delay={0.1} />
                    <FeatureCard title="Learns your patterns" desc="It knows when you're most productive." delay={0.2} />
                </div>
            </SectionWrapper >


            {/* --- CTA --- */}
            < section className="py-32 px-6 text-center" >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-5xl md:text-7xl font-black mb-8 text-[var(--text-main)]">
                        Ready for a <br />
                        <span className="text-[var(--brand-primary)]">Better Way to Study?</span>
                    </h2>
                    <p className="text-xl text-[var(--text-muted)] mb-12 font-medium">Stop feeling overwhelmed. Start building habits that stick.</p>

                    <div className="flex flex-col items-center gap-4">
                        <Link href="/dashboard/upload" className="btn-primary flex items-center gap-2 group text-xl px-12 py-5 rounded-[20px]">
                            Create Free Account
                        </Link>
                        <span className="text-sm font-bold text-gray-400">No credit card required</span>
                    </div>
                </motion.div>
            </section >

            {/* --- FOOTER --- */}
            < footer className="py-12 border-t border-[var(--border-thick)] text-center text-gray-400 text-sm font-medium" >
                <div className="flex justify-center gap-8 mb-8">
                    <a href="#" className="hover:text-[var(--brand-primary)]">About</a>
                    <a href="#" className="hover:text-[var(--brand-primary)]">Features</a>
                    <a href="#" className="hover:text-[var(--brand-primary)]">Pricing</a>
                    <a href="#" className="hover:text-[var(--brand-primary)]">Contact</a>
                </div>
                <p>© 2026 goStuddy • Your AI Study Buddy</p>
            </footer >

        </div >
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
                <Link href="/dashboard/upload" className="btn-primary text-sm shadow-xl shadow-[#4C8233]/20">
                    Launch App
                </Link>
            </div>
        </nav>
    )
}

function Brain(props: any) { return <Zap {...props} /> } 
