'use client';

import { createCourse } from '@/lib/actions-course';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import { Plus, X, Loader2, Palette } from 'lucide-react';

export default function CreateCourseForm() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#1F2937] text-white rounded-2xl font-bold shadow-lg shadow-gray-200 hover:scale-105 active:scale-95 transition-all"
            >
                <Plus size={20} />
                <span>New Course</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-[#1F2937] mb-2">Create Course</h2>
                            <p className="text-gray-500 font-medium">Add a new subject to your library.</p>
                        </div>

                        <form action={async (formData) => {
                            await createCourse(formData);
                            setIsOpen(false);
                        }} className="space-y-6">

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Course Title</label>
                                <input
                                    name="title"
                                    type="text"
                                    placeholder="e.g. Advanced Thermodynamics"
                                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#4C8233] font-bold text-[#1F2937] placeholder-gray-400 transition-colors"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Description (Optional)</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    placeholder="Brief summary or professor's name..."
                                    className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:border-[#4C8233] font-medium text-[#1F2937] placeholder-gray-400 transition-colors resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Color Tag</label>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {['#00F2D3', '#4C8233', '#FFD700', '#FF6B6B', '#9B51E0', '#3B82F6'].map((color) => (
                                        <label key={color} className="cursor-pointer group relative">
                                            <input type="radio" name="color" value={color} className="peer sr-only" defaultChecked={color === '#00F2D3'} />
                                            <div className="w-10 h-10 rounded-full border-2 border-transparent peer-checked:border-black peer-checked:scale-110 transition-all flex items-center justify-center" style={{ backgroundColor: color }}>
                                                <div className="w-2.5 h-2.5 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <SubmitButton />
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full py-4 bg-[#4C8233] text-white rounded-2xl font-bold text-lg hover:bg-[#3D6A29] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
            {pending ? <Loader2 className="animate-spin" /> : 'Create Course'}
        </button>
    );
}
