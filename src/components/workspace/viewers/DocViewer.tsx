'use client';

interface DocViewerProps {
    url: string;
    type: 'docx' | 'pptx' | 'txt' | string;
}

export default function DocViewer({ url, type }: DocViewerProps) {
    // Use Google Docs Viewer for Office files with Studdy styling
    const embedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

    return (
        <div className="w-full h-full bg-[#F3F4F6] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                        {type.toUpperCase()} Document
                    </span>
                    <div className="px-3 py-1 bg-[#A3B18A]/10 text-[#4C8233] rounded-lg text-xs font-bold">
                        PREVIEW
                    </div>
                </div>
            </div>

            {/* Document Frame */}
            <div className="flex-1 p-6">
                <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden">
                    <iframe
                        src={embedUrl}
                        className="w-full h-full border-none"
                        title="Document Preview"
                    />
                </div>
            </div>
        </div>
    );
}
