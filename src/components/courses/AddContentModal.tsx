'use client';

import { useState, useRef } from 'react';
import { Upload, Youtube, Link as LinkIcon, FileText, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useUploadThing } from "@/lib/uploadthing";
import { useRouter } from 'next/navigation';

interface AddContentModalProps {
    courseId: string;
    folderId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function AddContentModal({ courseId, folderId, isOpen, onClose }: AddContentModalProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');

    // -- Link State --
    const [linkUrl, setLinkUrl] = useState('');
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [linkStatus, setLinkStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    // -- Upload State --
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
    const [fileName, setFileName] = useState<string | null>(null);

    const [uploadProgress, setUploadProgress] = useState(0);

    const { startUpload } = useUploadThing("resourceUploader", {
        onClientUploadComplete: () => {
            setUploadStatus('success');
            setUploadProgress(100);
            setTimeout(() => {
                router.refresh();
                onClose();
                setUploadStatus('idle');
                setFileName(null);
                setUploadProgress(0);
            }, 1000);
        },
        onUploadError: (error: Error) => {
            console.error(error);
            setUploadStatus('error');
            setUploadProgress(0);
        },
        onUploadProgress: (p) => {
            setUploadProgress(p);
        }
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);

        if (files.length === 1) {
            setFileName(files[0].name);
        } else {
            setFileName(`${files.length} files selected`);
        }

        setUploadStatus('uploading');

        // Check for PowerPoint
        const pptFile = files.find(f => f.name.endsWith('.pptx') || f.name.endsWith('.ppt'));
        if (pptFile) {
            alert(`⚠️ File '${pptFile.name}' is a PowerPoint. Please 'Save as PDF' first. The AI needs PDF format.`);
            setUploadStatus('idle');
            return;
        }

        await startUpload(files, {
            courseId,
            folderId: folderId || "null"
        });
    };

    const handleAddLink = async () => {
        if (!linkUrl) return;
        setIsAddingLink(true);
        setLinkStatus('processing');
        try {
            const { addYouTubeResource } = await import('@/lib/actions-course');
            await addYouTubeResource(courseId, folderId, linkUrl);
            setLinkStatus('success');
            setTimeout(() => {
                onClose();
                setLinkStatus('idle');
                setLinkUrl('');
            }, 1000);
        } catch (e) {
            console.error(e);
            setLinkStatus('error');
            alert('Failed to add link. Ensure it is a valid YouTube URL.');
        } finally {
            setIsAddingLink(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 pb-2 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Add Content</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 gap-6 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'upload' ? 'border-[#4C8233] text-[#4C8233]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Upload Files
                    </button>
                    <button
                        onClick={() => setActiveTab('link')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'link' ? 'border-[#4C8233] text-[#4C8233]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        YouTube Link
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 min-h-[250px] flex flex-col">

                    {activeTab === 'upload' ? (
                        <div className="flex-1 flex flex-col gap-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple // Enable multiple selection
                                accept=".pdf,image/*,audio/*,video/*"
                                onChange={handleFileSelect}
                            />

                            {uploadStatus === 'idle' || uploadStatus === 'error' ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#4C8233]/50 hover:bg-[#4C8233]/5 transition-all group p-8"
                                >
                                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Upload size={32} className="text-gray-400 group-hover:text-[#4C8233]" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-gray-900">Click to upload</p>
                                        <p className="text-xs text-gray-500 mt-1">PDF, Audio, Video, Images</p>
                                        <p className="text-[10px] text-gray-400 mt-2 font-medium">Multiple files supported</p>
                                        <p className="text-[10px] text-red-400 mt-1 font-medium">Max 20MB per file</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-in fade-in">
                                    <p className="opacity-80 mt-1">
                                        Uploading to Course...
                                    </p>

                                    <div className="relative">
                                        {/* Status Icon */}
                                        {uploadStatus === 'success' ? (
                                            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 animate-in zoom-in">
                                                <CheckCircle size={40} />
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-[#4C8233]/10 flex items-center justify-center text-[#4C8233]">
                                                <Loader2 size={40} className="animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center flex flex-col items-center gap-2">
                                        <p className="font-bold text-lg text-gray-900">
                                            {uploadStatus === 'uploading' && `Uploading... ${Math.round(uploadProgress)}%`}
                                            {uploadStatus === 'processing' && "AI Analyzing..."}
                                            {uploadStatus === 'success' && "Ready!"}
                                        </p>

                                        {/* Progress Bar */}
                                        {uploadStatus === 'uploading' && (
                                            <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#4C8233] transition-all duration-300 ease-out"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        )}

                                        <p className="text-sm text-gray-500">{fileName}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100 text-red-800">
                                <Youtube size={24} />
                                <div className="text-sm">
                                    <p className="font-bold">Paste a YouTube Link</p>
                                    <p className="opacity-80">We'll analyze the video content for you.</p>
                                </div>
                            </div>

                            <input
                                type="text"
                                placeholder="https://youtube.com/watch?v=... or Playlist URL"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4C8233] font-medium"
                                autoFocus
                            />

                            <div className="flex-1 flex flex-col justify-end">
                                {linkStatus === 'processing' ? (
                                    <button disabled className="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-xl flex items-center justify-center gap-2">
                                        <Loader2 size={18} className="animate-spin" />
                                        Processing...
                                    </button>
                                ) : linkStatus === 'success' ? (
                                    <button disabled className="w-full py-3 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                        <CheckCircle size={18} />
                                        Added!
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleAddLink}
                                        disabled={!linkUrl}
                                        className="w-full py-3 bg-[#4C8233] text-white font-bold rounded-xl hover:bg-[#3A6B25] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <LinkIcon size={18} />
                                        Add Link
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
