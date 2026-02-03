'use client';

interface ImageViewerProps {
    url: string;
}

export default function ImageViewer({ url }: ImageViewerProps) {
    return (
        <div className="w-full h-full bg-[#F3F4F6] flex items-center justify-center p-6">
            <div className="max-w-full max-h-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <img
                    src={url}
                    alt="Learning material"
                    className="w-full h-full object-contain"
                />
            </div>
        </div>
    );
}
