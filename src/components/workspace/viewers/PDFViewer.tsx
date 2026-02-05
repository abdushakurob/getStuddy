'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

// Import react-pdf styles
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
    url: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [loading, setLoading] = useState<boolean>(true);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
    }

    const goToPrevPage = () => setPageNumber(Math.max(1, pageNumber - 1));
    const goToNextPage = () => setPageNumber(Math.min(numPages, pageNumber + 1));
    const zoomIn = () => setScale(Math.min(2.0, scale + 0.1));
    const zoomOut = () => setScale(Math.max(0.5, scale - 0.1));

    return (
        <div className="w-full h-full bg-[#F3F4F6] flex flex-col relative">

            {/* Top Controls Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    {/* Page Navigation */}
                    <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-[#4C8233] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-gray-900">{pageNumber}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-500">{numPages || '—'}</span>
                    </div>
                    <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-[#4C8233] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={zoomOut}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-[#4C8233] transition-colors"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-xs font-medium text-gray-600 w-12 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-[#4C8233] transition-colors"
                    >
                        <ZoomIn size={18} />
                    </button>
                </div>
            </div>

            {/* PDF Canvas */}
            <div className="flex-1 overflow-auto flex items-start justify-center p-6">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 size={32} className="text-[#4C8233] animate-spin mb-3" />
                        <p className="text-sm text-gray-500 font-medium">Loading document...</p>
                    </div>
                )}

                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onItemClick={({ pageNumber: clickedPage }) => {
                        // Handle internal PDF link clicks (like TOC)
                        if (clickedPage) {
                            setPageNumber(clickedPage);
                        }
                    }}
                    loading=""
                    className="shadow-lg"
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        className="bg-white shadow-xl rounded-lg overflow-hidden"
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                    />
                </Document>
            </div>

            {/* Bottom Progress Bar */}
            <div className="bg-white border-t border-gray-200 px-6 py-2 shrink-0">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[#4C8233] to-[#84A98C] transition-all duration-300"
                        style={{ width: `${(pageNumber / numPages) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
