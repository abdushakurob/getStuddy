'use client';

import { useState } from 'react';
import {
    Folder, FileText, MoreVertical, Plus, ChevronRight, Home, Upload, Loader2, ArrowLeft, RotateCcw,
    LayoutGrid, List, Music, Video, Image as ImageIcon, Presentation
} from 'lucide-react';
import Link from 'next/link';
import { createFolder, retryResourceAnalysis } from '@/lib/actions-course';
import { useFormStatus } from 'react-dom';
import AddContentModal from './AddContentModal';

interface ExplorerProps {
    courseId: string;
    initialData: {
        folders: any[];
        resources: any[];
        navigation: any[];
        courseTitle: string;
    };
    currentFolderId: string | null;
}

export default function CourseExplorer({ courseId, initialData, currentFolderId }: ExplorerProps) {
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [retryingId, setRetryingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleRetry = async (resourceId: string) => {
        setRetryingId(resourceId);
        try {
            await retryResourceAnalysis(resourceId);
        } catch (error) {
            console.error('Retry failed:', error);
        } finally {
            setRetryingId(null);
        }
    };

    // Helper to get icon by file type
    const getFileIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={24} />;
            case 'audio': return <Music size={24} />;
            case 'image': return <ImageIcon size={24} />;
            case 'slide': return <Presentation size={24} />;
            default: return <FileText size={24} />;
        }
    };

    // State for Unified Modal
    const [isAddContentOpen, setIsAddContentOpen] = useState(false);

    return (
        <div className="flex flex-col h-full bg-[#F3F4F6] rounded-[32px] overflow-hidden border border-gray-100 shadow-inner relative">

            {/* Unified Modal */}
            <AddContentModal
                courseId={courseId}
                folderId={currentFolderId}
                isOpen={isAddContentOpen}
                onClose={() => setIsAddContentOpen(false)}
            />

            {/* --- TOOLBAR --- */}
            <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between">

                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500 overflow-x-auto no-scrollbar">
                    <Link href={`/dashboard/courses/${courseId}`} className={`flex items-center gap-1 hover:text-black transition-colors ${!currentFolderId ? 'text-black' : ''}`}>
                        <Home size={16} />
                        <span>{initialData.courseTitle}</span>
                    </Link>
                    {initialData.navigation.slice(1).map((crumb: any) => (
                        <div key={crumb.id} className="flex items-center gap-2 shrink-0">
                            <ChevronRight size={14} className="text-gray-300" />
                            <Link href={`/dashboard/courses/${courseId}?folderId=${crumb.id}`} className="hover:text-black transition-colors whitespace-nowrap">
                                {crumb.name}
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List size={16} />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-gray-200 mx-1" />

                    <button
                        onClick={() => setIsCreateFolderOpen(true)}
                        className="p-2 bg-gray-100 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-200 transition-colors"
                        title="New Folder"
                    >
                        <Folder size={18} />
                    </button>

                    <button
                        onClick={() => setIsAddContentOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#4C8233] text-white rounded-xl text-sm font-bold hover:bg-[#3A6B25] transition-all shadow-lg shadow-green-900/10 transform active:scale-95"
                    >
                        <Plus size={16} />
                        <span>Add Material</span>
                    </button>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 overflow-y-auto p-6">

                {/* Empty State */}
                {initialData.folders.length === 0 && initialData.resources.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <Folder size={32} />
                        </div>
                        <p className="font-bold text-gray-500">This folder is empty.</p>
                    </div>
                )}

                {/* GRID VIEW */}
                {viewMode === 'grid' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                        {/* Folders */}
                        {initialData.folders.map((folder: any) => (
                            <Link
                                key={folder.id}
                                href={`/dashboard/courses/${courseId}?folderId=${folder.id}`}
                                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 group hover:border-[#4C8233] hover:shadow-md transition-all aspect-square justify-center cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:bg-[#4C8233]/10 group-hover:text-[#4C8233] transition-colors">
                                    <Folder size={24} fill="currentColor" className="opacity-80" />
                                </div>
                                <span className="text-xs font-bold text-gray-600 group-hover:text-black line-clamp-2 leading-tight">
                                    {folder.name}
                                </span>
                            </Link>
                        ))}

                        {/* Files */}
                        {initialData.resources.map((file: any) => (
                            <div
                                key={file.id}
                                className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center text-center gap-3 group transition-all aspect-square justify-center relative ${file.status === 'error'
                                    ? 'border-red-200 bg-red-50/50'
                                    : file.status === 'processing'
                                        ? 'border-amber-200 bg-amber-50/50'
                                        : 'border-gray-100 hover:border-gray-300'
                                    }`}
                            >
                                {/* Status Icon Overlay */}
                                {file.status === 'processing' && <Loader2 size={16} className="absolute top-2 right-2 animate-spin text-amber-500" />}
                                {file.status === 'error' && <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-red-500 text-white font-bold text-xs rounded-full">!</span>}
                                {file.status === 'ready' && <span className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 bg-green-500 text-white font-bold text-[10px] rounded-full">✓</span>}

                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${file.status === 'error' ? 'bg-red-100 text-red-500' : file.status === 'processing' ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-500'}`}>
                                    {getFileIcon(file.type)}
                                </div>
                                <span className="text-xs font-bold text-gray-600 line-clamp-2 leading-tight break-all">
                                    {file.title}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* LIST VIEW */}
                {viewMode === 'list' && (
                    <div className="flex flex-col gap-2">
                        {/* Headers */}
                        <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 mb-2">
                            <span className="w-8">Type</span>
                            <span>Name</span>
                            <span>Status</span>
                        </div>

                        {/* Folders */}
                        {initialData.folders.map((folder: any) => (
                            <Link
                                key={folder.id}
                                href={`/dashboard/courses/${courseId}?folderId=${folder.id}`}
                                className="grid grid-cols-[auto_1fr_auto] gap-4 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-[#4C8233] hover:shadow-md transition-all group cursor-pointer"
                            >
                                <div className="w-8 flex justify-center text-blue-500 group-hover:text-[#4C8233]">
                                    <Folder size={20} fill="currentColor" className="opacity-80" />
                                </div>
                                <span className="text-sm font-bold text-gray-700 group-hover:text-black">
                                    {folder.name}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">Folder</span>
                            </Link>
                        ))}

                        {/* Files */}
                        {initialData.resources.map((file: any) => (
                            <div
                                key={file.id}
                                className={`grid grid-cols-[auto_1fr_auto] gap-4 items-center bg-white p-3 rounded-xl border shadow-sm transition-all group ${file.status === 'error'
                                    ? 'border-red-200 bg-red-50/50'
                                    : file.status === 'processing'
                                        ? 'border-amber-200 bg-amber-50/50'
                                        : 'border-gray-100 hover:border-gray-300'
                                    }`}
                            >
                                <div className={`w-8 flex justify-center ${file.status === 'error' ? 'text-red-500' : file.status === 'processing' ? 'text-amber-600' : 'text-gray-500'}`}>
                                    {getFileIcon(file.type)}
                                </div>
                                <span className="text-sm font-bold text-gray-700 truncate">
                                    {file.title}
                                </span>
                                <div className="flex items-center gap-2">
                                    {file.status === 'processing' && <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-100 px-2 py-1 rounded-full"><Loader2 size={10} className="animate-spin" /> Analyzing</span>}
                                    {file.status === 'error' && (
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-100 px-2 py-1 rounded-full">Failed</span>
                                            <button onClick={() => handleRetry(file.id)} className="p-1 hover:bg-red-200 rounded-full text-red-500 transition-colors" title="Retry">
                                                <RotateCcw size={14} />
                                            </button>
                                        </div>
                                    )}
                                    {file.status === 'ready' && <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full">Ready</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}
            {isCreateFolderOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
                        <h3 className="text-lg font-black text-[#1F2937] mb-4">New Folder</h3>
                        <form action={async (formData) => {
                            await createFolder(courseId, currentFolderId, formData);
                            setIsCreateFolderOpen(false);
                        }}>
                            <input
                                name="name"
                                autoFocus
                                placeholder="Folder Name..."
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm font-bold mb-4 focus:outline-none focus:border-[#4C8233]"
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setIsCreateFolderOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                                <SubmitButton />
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="flex-1 py-3 bg-[#4C8233] text-white text-sm font-bold rounded-xl hover:bg-[#3D6A29] flex items-center justify-center">
            {pending ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
        </button>
    )
}
