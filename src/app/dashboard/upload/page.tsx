'use client';

import { UploadDropzone } from '@/lib/uploadthing';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FileUp, CheckCircle, Loader2 } from 'lucide-react';

export default function UploadPage() {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    return (
        <div className="h-full flex flex-col items-center justify-center p-10 bg-gradient-to-br from-white to-gray-50">

            <div className="text-center mb-10 max-w-lg">
                <h1 className="text-4xl font-bold mb-3 tracking-tight text-gray-900">Upload Intelligence</h1>
                <p className="text-gray-500 text-lg">Drop your syllabus, slides, or notes here. Studdy will scan them to build your Mission Map.</p>
            </div>

            <div className="w-full max-w-2xl">
                {isProcessing ? (
                    <div className="bg-white border border-gray-100 rounded-[32px] shadow-xl p-16 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative">
                            <Loader2 size={32} className="text-indigo-600 animate-spin" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Analyzing Structure...</h3>
                        <p className="text-gray-500">Extracting topics and identifying weak points.</p>
                    </div>
                ) : (
                    <div className="relative group">
                        {/* Decorative glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[34px] opacity-20 group-hover:opacity-40 blur transition duration-500"></div>

                        <div className="relative bg-white rounded-[32px] overflow-hidden shadow-xl">
                            <UploadDropzone
                                endpoint="resourceUploader"
                                onClientUploadComplete={(res) => {
                                    console.log("Files: ", res);
                                    setIsProcessing(true);
                                    setTimeout(() => {
                                        router.push('/workspace'); // Redirect to the Arena
                                    }, 2000);
                                }}
                                onUploadError={(error: Error) => {
                                    alert(`ERROR! ${error.message}`);
                                }}
                                appearance={{
                                    container: {
                                        background: 'transparent',
                                        borderColor: 'transparent',
                                        padding: '64px',
                                    },
                                    label: {
                                        color: '#6B7280', // text-gray-500
                                        fontWeight: '500'
                                    },
                                    button: {
                                        background: '#111827', // bg-gray-900
                                        color: '#FFFFFF',
                                        borderRadius: '12px',
                                        padding: '16px 32px',
                                        fontWeight: '600',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    },
                                    allowedContent: {
                                        color: '#9CA3AF'
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-12 flex gap-8 text-sm text-gray-400 font-medium">
                <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>PDF Scanned</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>AI Indexed</span>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Secure Storage</span>
                </div>
            </div>
        </div>
    );
}
