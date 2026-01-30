'use client';

import { useState } from 'react';
import { Folder, FileText, MoreVertical, Plus, ChevronRight, Home, Upload, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createFolder } from '@/lib/actions-course';
import { useFormStatus } from 'react-dom';
import UploadButton from './UploadButton';

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

    // In a real app, we'd use useOptimistic or SWR to handle navigation state without full page reloads,
    // but for now we rely on Server Component navigation (Link) for simplicity and SEO/Url correctness.

    return (
        <div className="flex flex-col h-full bg-[#F3F4F6] rounded-[32px] overflow-hidden border border-gray-100 shadow-inner">

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
                    {currentFolderId && (
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Current folder is usually the last crumb, but if we are deeply nested the logic above handles it */}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCreateFolderOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                    >
                        <Plus size={16} />
                        <span>Folder</span>
                    </button>
                    <UploadButton
                        key={currentFolderId || 'root'}
                        courseId={courseId}
                        folderId={currentFolderId}
                    />
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
                            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 group hover:border-gray-300 transition-all aspect-square justify-center relative"
                        >
                            <div className="w-12 h-12 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center">
                                <FileText size={24} />
                            </div>
                            <span className="text-xs font-bold text-gray-600 line-clamp-2 leading-tight break-all">
                                {file.title}
                            </span>
                        </div>
                    ))}
                </div>
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
