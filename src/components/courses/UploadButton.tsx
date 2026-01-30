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

    const { startUpload } = useUploadThing("resourceUploader", {
        onClientUploadComplete: () => {
            setUploadStatus('success');
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
        if (!e.target.files || e.target.files.length === 0) return;

        setUploadStatus('uploading');
        const files = Array.from(e.target.files);

        // Pass context data to the uploader
        // We use "null" string to prevent undefined from being dropped
        console.log(`[UploadButton] Starting upload. Course: ${courseId}, Folder: ${folderId}`);
        await startUpload(files, {
            courseId,
            folderId: folderId || "null"
        });
    };

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf"
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
                                'Upload PDF'}
                </span>
            </button>
        </div>
    );
}
