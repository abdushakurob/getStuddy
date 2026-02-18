'use client';

import { useState } from 'react';
import { Upload, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UploadButton from '@/components/courses/UploadButton';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadSuggestionProps {
    reason?: string;
    onUploadClick?: () => void;
    courseId?: string | null;
    folderId?: string | null;
    sessionId?: string;
}

export default function UploadSuggestion({ reason, onUploadClick, courseId, folderId = null, sessionId }: UploadSuggestionProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 mb-4"
            >
                {/* Dismiss button */}
                <button
                    onClick={() => setDismissed(true)}
                    className="absolute top-3 right-3 p-1 hover:bg-white/50 rounded-full transition-colors"
                >
                    <X size={16} className="text-gray-500" />
                </button>

                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Sparkles size={20} className="text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pr-6">
                        <h4 className="font-semibold text-gray-900 mb-1">
                            Upload a document to help
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                            {reason || "I can help you better if you upload relevant materials like notes, textbooks, or slides."}
                        </p>

                        {courseId || sessionId ? (
                            <UploadButton courseId={courseId} folderId={folderId} sessionId={sessionId} />
                        ) : (
                            <Button
                                onClick={onUploadClick}
                                size="sm"
                                disabled={!onUploadClick}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Upload size={16} className="mr-2" />
                                Upload Document
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
