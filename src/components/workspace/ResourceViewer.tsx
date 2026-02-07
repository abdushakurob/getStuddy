'use client';

import dynamic from 'next/dynamic';
import { useResource } from '@/context/ResourceContext';
import ImageViewer from './viewers/ImageViewer';
import DocViewer from './viewers/DocViewer';
import MediaPlayer from './viewers/MediaPlayer';
import { FileText, Loader2 } from 'lucide-react';

// Dynamically import PDFViewer to avoid SSR issues with DOMMatrix
const PDFViewer = dynamic(() => import('./viewers/PDFViewer'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-[#F3F4F6] flex items-center justify-center">
            <Loader2 size={32} className="text-[#4C8233] animate-spin" />
        </div>
    )
});

export default function ResourceViewer() {
    const { currentResource } = useResource();

    if (!currentResource) {
        return (
            <div className="w-full h-full bg-[#F3F4F6] flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
                    <FileText size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">No Resource Selected</h3>
                <p className="text-sm text-gray-500 text-center max-w-sm">
                    Your companion will load materials as you progress through the session.
                </p>
            </div>
        );
    }

    const { url, type } = currentResource;

    if (!url) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>Unable to load this resource: Missing URL</p>
            </div>
        );
    }

    // Determine which viewer to use
    if (type === 'video') {
        return <MediaPlayer url={url} type="video" />;
    }

    if (type === 'audio') {
        return <MediaPlayer url={url} type="audio" />;
    }

    if (type === 'pdf') {
        return <PDFViewer url={url} />;
    }

    if (type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type)) {
        return <ImageViewer url={url} />;
    }

    if (['docx', 'pptx', 'doc', 'ppt', 'txt'].includes(type)) {
        return <DocViewer url={url} type={type} />;
    }

    // Fallback for unknown types
    return (
        <div className="w-full h-full bg-[#F3F4F6] flex items-center justify-center p-8">
            <div className="text-center">
                <Loader2 size={32} className="text-[#4C8233] animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">Loading {type} resource...</p>
            </div>
        </div>
    );
}
