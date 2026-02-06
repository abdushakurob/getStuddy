'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Highlighter, MessageSquare, Trash2 } from 'lucide-react';
import { useResource, Highlight } from '@/context/ResourceContext';
import { useParams } from 'next/navigation';
import { saveHighlight, deleteHighlight } from '@/lib/actions-session';

// Import react-pdf styles
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
    url: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
    const params = useParams();
    const sessionId = params?.sessionId as string;

    const { registerDocumentHandler, setTotalPages, highlights, addHighlight, removeHighlight } = useResource();
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [loading, setLoading] = useState<boolean>(true);
    const [pageLabels, setPageLabels] = useState<string[] | null>(null);

    // Selection State
    const [selection, setSelection] = useState<{
        text: string;
        rects: { x: number, y: number, width: number, height: number }[];
    } | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const pageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        registerDocumentHandler({
            jump: (page) => setPageNumber(page),
            setZoom: (level) => setScale(level / 100),
            jumpToLabel: (label) => {
                if (pageLabels) {
                    const index = pageLabels.indexOf(label);
                    if (index !== -1) {
                        setPageNumber(index + 1); // 0-based index to 1-based page
                    } else {
                        const p = parseInt(label);
                        if (!isNaN(p)) setPageNumber(p);
                    }
                } else {
                    const p = parseInt(label);
                    if (!isNaN(p)) setPageNumber(p);
                }
            }
        });
    }, [registerDocumentHandler, pageLabels]);

    async function onDocumentLoadSuccess(pdf: any) {
        setNumPages(pdf.numPages);
        setTotalPages(pdf.numPages);
        setLoading(false);

        try {
            const labels = await pdf.getPageLabels();
            if (labels && labels.length > 0) {
                setPageLabels(labels);
            }
        } catch (e) {
            console.error("Failed to load page labels", e);
        }
    }

    const goToPrevPage = () => setPageNumber(Math.max(1, pageNumber - 1));
    const goToNextPage = () => setPageNumber(Math.min(numPages, pageNumber + 1));
    const zoomIn = () => setScale(Math.min(2.0, scale + 0.1));
    const zoomOut = () => setScale(Math.max(0.5, scale - 0.1));

    // --- Selection Handling ---

    const handleMouseUp = () => {
        const windowSelection = window.getSelection();
        if (!windowSelection || windowSelection.isCollapsed || !pageRef.current) {
            setSelection(null);
            setMenuPosition(null);
            return;
        }

        const range = windowSelection.getRangeAt(0);
        const rects = range.getClientRects();
        const pageRect = pageRef.current.getBoundingClientRect();

        // Check if selection is inside this page
        let isInside = false;
        const normalizedRects = [];
        for (let i = 0; i < rects.length; i++) {
            const r = rects[i];
            if (
                r.top >= pageRect.top &&
                r.bottom <= pageRect.bottom &&
                r.left >= pageRect.left &&
                r.right <= pageRect.right
            ) {
                isInside = true;
                normalizedRects.push({
                    x: (r.left - pageRect.left) / pageRect.width,
                    y: (r.top - pageRect.top) / pageRect.height,
                    width: r.width / pageRect.width,
                    height: r.height / pageRect.height
                });
            }
        }

        if (isInside && normalizedRects.length > 0) {
            const text = windowSelection.toString();
            setSelection({ text, rects: normalizedRects });

            // Position menu above the first rect
            const first = rects[0];
            const menuX = first.left + (first.width / 2) - 50; // Center
            const menuY = first.top - 50;

            // Adjust relative to page container logic if needed, but absolute fixed is easier for overlay
            // Or better: relative to viewport? 
            // Let's use absolute positioning relative to Page Container for simplicity?
            // Actually, viewport fixed is safer for Z-index.

            // Normalized menu position relative to Page
            setMenuPosition({
                x: normalizedRects[0].x * 100, // %
                y: normalizedRects[0].y * 100  // %
            });
        } else {
            setSelection(null);
            setMenuPosition(null);
        }
    };

    const handleCreateHighlight = async () => {
        if (!selection || !sessionId) return;

        const newHighlight: Highlight = {
            id: crypto.randomUUID(), // Temp ID
            text: selection.text,
            pageIndex: pageNumber - 1, // 0-based
            rects: selection.rects,
            color: 'yellow',
            note: ''
        };

        // Optimistic Update
        addHighlight(newHighlight);
        setSelection(null);
        setMenuPosition(null);
        window.getSelection()?.removeAllRanges();

        try {
            await saveHighlight(sessionId, newHighlight);
        } catch (e) {
            console.error("Failed to save highlight", e);
            // Revert? (Not implemented for brevity)
        }
    };

    const handleDeleteHighlight = async (id: string) => {
        removeHighlight(id);
        if (sessionId) await deleteHighlight(sessionId, id);
    };

    // Filter highlights for current page
    const pageHighlights = highlights.filter(h => h.pageIndex === pageNumber - 1);

    return (
        <div className="w-full h-full bg-[#F3F4F6] flex flex-col relative" onMouseUp={handleMouseUp}>

            {/* Top Controls Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-[#4C8233] disabled:opacity-30 transition-colors"
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
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-[#4C8233] disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={zoomOut} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-[#4C8233]">
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-xs font-medium text-gray-600 w-12 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button onClick={zoomIn} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-[#4C8233]">
                        <ZoomIn size={18} />
                    </button>
                </div>
            </div>

            {/* PDF Canvas */}
            <div className="flex-1 overflow-auto flex items-start justify-center p-6 relative">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 size={32} className="text-[#4C8233] animate-spin mb-3" />
                        <p className="text-sm text-gray-500 font-medium">Loading document...</p>
                    </div>
                )}

                <div className="relative shadow-xl rounded-lg" ref={pageRef}>
                    <Document
                        file={url}
                        onLoadSuccess={onDocumentLoadSuccess}
                        className="flex flex-col"
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            className="bg-white rounded-lg overflow-hidden"
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                        />
                    </Document>

                    {/* Highlights Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        {pageHighlights.map((h, i) => (
                            <div key={h.id || i}>
                                {h.rects.map((r, ri) => (
                                    <div
                                        key={ri}
                                        className="absolute bg-yellow-300 mix-blend-multiply opacity-40 hover:opacity-60 transition-opacity cursor-pointer pointer-events-auto"
                                        style={{
                                            left: `${r.x * 100}%`,
                                            top: `${r.y * 100}%`,
                                            width: `${r.width * 100}%`,
                                            height: `${r.height * 100}%`,
                                        }}
                                        title={h.text}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete highlight?')) handleDeleteHighlight(h.id!);
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Floating Menu */}
                    {menuPosition && (
                        <div
                            className="absolute z-50 flex items-center gap-1 bg-gray-900 text-white rounded-lg shadow-xl p-1 animate-in fade-in zoom-in-95 duration-200"
                            style={{
                                left: `${menuPosition.x}%`,
                                top: `${menuPosition.y}%`,
                                transform: 'translate(-50%, -140%)'
                            }}
                        >
                            <button
                                onClick={handleCreateHighlight}
                                className="p-2 hover:bg-gray-700 rounded-md transition-colors flex items-center gap-1"
                            >
                                <Highlighter size={14} className="text-yellow-400" />
                                <span className="text-xs font-bold">Highlight</span>
                            </button>
                            <div className="w-px h-4 bg-gray-700 mx-0.5" />
                            <button
                                onClick={() => { /* "Ask Agent" Logic - Send text to AgentCanvas somehow? */
                                    const event = new CustomEvent('ask-agent', { detail: selection?.text });
                                    window.dispatchEvent(event);
                                    // Or use specific Context method if available? ResourceContext is for Viewer control.
                                    // For now, let's just Copy or Alert.
                                    alert("Ask feature coming next!");
                                }}
                                className="p-2 hover:bg-gray-700 rounded-md transition-colors flex items-center gap-1"
                            >
                                <MessageSquare size={14} />
                                <span className="text-xs font-bold">Ask</span>
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* Bottom Progress */}
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
