'use client';

import { useState } from 'react';
import { RotateCw } from 'lucide-react';

interface FlashcardBlockProps {
    data: {
        front: string;
        back: string;
    }
}

export default function FlashcardBlock({ data }: FlashcardBlockProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="my-4 h-64 perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative w-full h-full duration-500 transform-style-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`}>

                {/* FRONT */}
                <div className="absolute w-full h-full bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center p-6 backface-hidden">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Front</span>
                    <p className="text-xl font-medium text-center text-gray-800">{data.front}</p>
                    <div className="absolute bottom-4 right-4 text-gray-300">
                        <RotateCw size={20} />
                    </div>
                </div>

                {/* BACK */}
                <div className="absolute w-full h-full bg-[#1F2937] text-white rounded-xl shadow-lg border border-gray-700 flex flex-col items-center justify-center p-6 backface-hidden rotate-y-180">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Back</span>
                    <p className="text-xl font-medium text-center">{data.back}</p>
                </div>

            </div>
        </div>
    );
}
