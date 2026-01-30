'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Zap, Brain, Target,
    Map as MapIcon, Swords,
    Bot, Fingerprint, Layers, CheckCircle, Smartphone,
    Library, MessageCircle, TrendingUp
} from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="bg-[#F3F4F6] text-[#1F2937] font-[family-name:var(--font-plus-jakarta)] overflow-x-hidden selection:bg-[#4C8233] selection:text-white">

            <NavBar />

            {/* --- HERO: THE PREMISE --- */}
            <section className="min-h-[85vh] flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto pt-20">
                {/* <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 p-4 bg-white rounded-2xl shadow-xl shadow-[#4C8233]/10 border border-[#4C8233]/20 inline-block"
                >
                    <div className="flex items-center gap-3 text-[#4C8233] font-bold">
                        <Bot size={24} />
                        <span>Meet Your New Study Partner</span>
                    </div>
                </motion.div> */}

                <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[0.95] tracking-tight text-[#1F2937]">
                    Never Study <br />
                    <span className="text-[#4C8233]">Alone Again.</span>
                </h1>

                <p className="text-xl md:text-2xl text-[#6B7280] max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                    getStuddy is an intelligent agent that organizes your courses, explains tough concepts, and turns studying into a game you actually want to win.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto">
                    <Link href="/dashboard/upload" className="flex-1 py-4 bg-[#4C8233] text-white rounded-xl text-lg font-bold shadow-xl shadow-[#4C8233]/20 hover:bg-[#3D6A29] transition-all flex items-center justify-center gap-2">
                        Get Started <Zap size={20} />
                    </Link>
                    <Link href="#features" className="flex-1 py-4 bg-white text-[#1F2937] border border-gray-200 rounded-xl text-lg font-bold hover:bg-gray-50 transition-all flex items-center justify-center">
                        See Features
                    </Link>
                </div>
            </section>


            {/* --- ACT 1: STRUCTURE (The Courses) --- */}
            <section id="features" className="py-32 px-6 bg-white border-y border-gray-100">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                    <div>
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                            <Library size={32} />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-[#1F2937]">Organize Your Chaos.</h2>
                        <p className="text-xl text-[#6B7280] leading-relaxed mb-8">
                            Dump your PDFs, syllabi, and lecture slides into Studdy. The Agent instantly structures them into clear <strong>Courses</strong> and <strong>Timelines</strong>.
                        </p>
                        <ul className="space-y-4">
                            <FeatureCheck text="Auto-generated Course Roadmaps" />
                            <FeatureCheck text="Deadline Tracking" />
                            <FeatureCheck text="All materials in one place" />
                        </ul>
                    </div>
                    <div className="glass-panel p-8 rounded-[40px] shadow-2xl bg-gray-50 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                        {/* Course Card Mockup */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-4">
                            <div className="flex justify-between items-center mb-4">
                                <div className="font-bold text-lg">Biology 101</div>
                                <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg">Active</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full w-full mb-2">
                                <div className="h-full bg-green-500 w-2/3 rounded-full"></div>
                            </div>
                            <div className="text-xs text-gray-400 font-medium">65% Mastery • Exam in 14 days</div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 opacity-60">
                            <div className="flex justify-between items-center mb-4">
                                <div className="font-bold text-lg">Art History</div>
                                <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">Paused</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full w-full mb-2">
                                <div className="h-full bg-gray-300 w-1/4 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ACT 2: THE COMPANION (Chat/Help) --- */}
            <section className="py-32 px-6 bg-[#F3F4F6]">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center md:flex-row-reverse">
                    <div className="order-last md:order-first">
                        {/* Chat Mockup */}
                        <div className="glass-panel p-8 rounded-[40px] shadow-2xl bg-white relative">
                            <div className="space-y-6">
                                {/* Studdy Msg */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#4C8233] flex items-center justify-center text-white font-bold text-xs shrink-0">S</div>
                                    <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none text-sm font-medium text-gray-800">
                                        Wait, don't move on yet. You missed the key point about <strong>Mitochondria</strong>. Let me break it down simply...
                                    </div>
                                </div>
                                {/* User Msg */}
                                <div className="flex flex-row-reverse gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">You</div>
                                    <div className="bg-[#1F2937] text-white p-4 rounded-2xl rounded-tr-none text-sm font-medium">
                                        Oh, I thought I got it. Can you give me an analogy?
                                    </div>
                                </div>
                                {/* Analogy Card */}
                                <div className="p-4 border border-[#4C8233]/30 bg-[#E8F5E9] rounded-2xl">
                                    <div className="text-xs font-bold text-[#4C8233] uppercase mb-2">💡 Insight</div>
                                    <p className="text-sm font-bold text-[#1F2937]">Think of Mitochondria as the Power Plant of a city...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                            <MessageCircle size={32} />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-[#1F2937]">Your 24/7 Tutor.</h2>
                        <p className="text-xl text-[#6B7280] leading-relaxed mb-8">
                            Stuck on a concept? Just ask. Imagine a tutor who knows your entire syllabus by heart and is always awake.
                        </p>
                        <ul className="space-y-4">
                            <FeatureCheck text="Instant Explanations (ELI5)" />
                            <FeatureCheck text="Socratic Questioning" />
                            <FeatureCheck text="Context-Aware Answers" />
                        </ul>
                    </div>
                </div>
            </section>

            {/* --- ACT 3: THE GAME (Fun) --- */}
            <section className="py-32 px-6 bg-[#111827] text-white rounded-[60px] mx-4 mb-20 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4C8233] opacity-20 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                    <div>
                        <div className="w-14 h-14 bg-gray-800 text-[#4C8233] rounded-2xl flex items-center justify-center mb-6 border border-gray-700">
                            <TrendingUp size={32} />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-6">Addictively Fun.</h2>
                        <p className="text-xl text-gray-400 leading-relaxed mb-8">
                            We turned studying into an RPG. Earn XP, keep your streak alive, and watch your Companion evolve as you get smarter.
                        </p>
                        <ul className="space-y-4">
                            <FeatureCheck text="Daily Streak Battles" dark />
                            <FeatureCheck text="Evolving Avatar System" dark />
                            <FeatureCheck text="Global Leaderboards" dark />
                        </ul>
                    </div>
                    <div className="flex justify-center">
                        {/* Evolution Card */}
                        <div className="relative w-80 h-96 bg-gray-900 border border-gray-700 rounded-[40px] flex flex-col items-center justify-center shadow-2xl">
                            <div className="absolute top-6 right-6 px-3 py-1 bg-[#4C8233] text-white text-xs font-bold rounded-full">LVL 4</div>

                            <div className="relative mb-8">
                                <div className="w-40 h-40 bg-gradient-to-b from-[#4C8233] to-[#2F4F2F] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(76,130,51,0.6)] animate-pulse-slow">
                                    <Swords size={60} className="text-white" />
                                </div>
                            </div>

                            <h3 className="text-2xl font-black mb-2">Scholar Class</h3>
                            <div className="text-gray-500 text-sm font-bold mb-6">450 / 1000 XP</div>

                            <div className="w-4/5 h-3 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full w-[45%] bg-[#4C8233]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-20 text-center">
                <h2 className="text-5xl font-black mb-8 text-[#1F2937]">Ready to Level Up?</h2>
                <Link href="/dashboard/upload" className="inline-block px-12 py-5 bg-[#4C8233] text-white rounded-2xl text-xl font-bold shadow-xl hover:scale-105 transition-transform">
                    Create Free Account
                </Link>
            </section>
        </div>
    );
}

// --- SUBCOMPONENTS ---

function FeatureCheck({ text, dark }: { text: string, dark?: boolean }) {
    return (
        <div className="flex items-center gap-3 font-medium text-lg">
            <CheckCircle size={20} className={dark ? "text-[#4C8233]" : "text-green-600"} />
            <span className={dark ? "text-gray-300" : "text-gray-600"}>{text}</span>
        </div>
    );
}

function NavBar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center pointer-events-none">
            <div className="glass-panel px-5 py-2.5 rounded-xl flex items-center gap-3 pointer-events-auto shadow-sm">
                <span className="font-extrabold text-xl tracking-tight text-[#2F4F2F]">getStuddy</span>
            </div>
            <div className="flex gap-4 pointer-events-auto">
                <Link href="/dashboard" className="px-5 py-2.5 glass-panel text-[#2F4F2F] font-bold hover:bg-white rounded-xl transition-all text-sm shadow-sm">
                    Log In
                </Link>
                <Link href="/dashboard/upload" className="px-5 py-2.5 bg-[#1F2937] text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all text-sm">
                    Launch App
                </Link>
            </div>
        </nav>
    )
}
