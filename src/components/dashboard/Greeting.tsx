'use client';

import { useEffect, useState } from 'react';

export default function Greeting({ userName }: { userName: string }) {
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    // Prevent hydration mismatch by rendering nothing initially or a safe default
    if (!greeting) return <h1 className="text-3xl font-black text-[#1F2937] opacity-0">Good Morning, {userName}.</h1>;

    return (
        <h1 className="text-3xl font-black text-[#1F2937] animate-in fade-in slide-in-from-bottom-2">
            {greeting}, {userName}.
        </h1>
    );
}
