'use client';

import { useUploadThing } from "@/lib/uploadthing";
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

interface UploadButtonProps {
    courseId: string;
    folderId: string | null;
}

export default function UploadButton({ courseId, folderId }: UploadButtonProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [warningMsg, setWarningMsg] = useState<string | null>(null);

    const { startUpload } = useUploadThing("resourceUploader", {
        onClientUploadComplete: () => {
            // Update UI IMMEDIATELY
            setUploadStatus('success');
            // Then refresh (which might be slow)
            router.refresh();
            // Reset to idle after a moment
            setTimeout(() => setUploadStatus('idle'), 2000);
        },
        onUploadError: (error: Error) => {
            console.error(error);
            setUploadStatus('error');
            setTimeout(() => setUploadStatus('idle'), 3000);
        },
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setWarningMsg(null);
        if (!e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);
        const file = files[0];

        // Check for PowerPoint
        if (file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) {
            setWarningMsg("⚠️ Please 'Save as PDF' first. The AI needs PDF format to see your charts and diagrams.");
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploadStatus('uploading');

        // Pass context data to the uploader
        await startUpload(files, {
            courseId,
            folderId: folderId || "null"
        });
    };

    return (
        <div className="flex flex-col items-end gap-2">
            {warningMsg && (
                <div className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-lg animate-in fade-in slide-in-from-right-2">
                    {warningMsg}
                </div>
            )}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,image/*,audio/*,video/*,.pptx,.ppt"
                onChange={handleFileSelect}
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadStatus === 'uploading'}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-bold shadow-lg transition-all duration-300 ${uploadStatus === 'error' ? 'bg-red-500 shadow-red-500/20' :
                    uploadStatus === 'success' ? 'bg-green-500 shadow-green-500/20' :
                        'bg-[#4C8233] shadow-[#4C8233]/20 hover:bg-[#3D6A29]'
                    }`}
            >
                {uploadStatus === 'uploading' ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : uploadStatus === 'success' ? (
                    <CheckCircle size={16} />
                ) : uploadStatus === 'error' ? (
                    <AlertCircle size={16} />
                ) : (
                    <Upload size={16} />
                )}

                <span>
                    {uploadStatus === 'uploading' ? 'Uploading...' :
                        uploadStatus === 'success' ? 'Done!' :
                            uploadStatus === 'error' ? 'Failed' :
                                'Upload Resources'}
                </span>
            </button>
        </div>
    );
}
