'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';

interface QuizBlockProps {
    data: {
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
    }
}

export default function QuizBlock({ data }: QuizBlockProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (index: number) => {
        if (isSubmitted) return;
        setSelected(index);
        setIsSubmitted(true);
    };

    const isCorrect = selected === data.correctIndex;

    return (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm my-4">
            <h3 className="font-bold text-gray-800 mb-4">{data.question}</h3>

            <div className="space-y-2">
                {data.options.map((option, idx) => {
                    let stateStyles = "border-gray-200 hover:bg-gray-50";
                    if (isSubmitted) {
                        if (idx === data.correctIndex) stateStyles = "bg-green-100 border-green-300 text-green-800";
                        else if (idx === selected) stateStyles = "bg-red-50 border-red-200 text-red-800";
                        else stateStyles = "opacity-50 border-gray-100";
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleSubmit(idx)}
                            disabled={isSubmitted}
                            className={`w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center ${stateStyles}`}
                        >
                            <span>{option}</span>
                            {isSubmitted && idx === data.correctIndex && <Check size={16} />}
                            {isSubmitted && idx === selected && idx !== data.correctIndex && <X size={16} />}
                        </button>
                    );
                })}
            </div>

            {isSubmitted && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
                    <strong>{isCorrect ? 'Correct!' : 'Explanation:'}</strong> {data.explanation}
                </div>
            )}
        </div>
    );
}
