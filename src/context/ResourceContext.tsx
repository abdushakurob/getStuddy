'use client';

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

// Resource type
type Resource = {
    url: string;
    type: string;
};

// Highlight Type
export type Highlight = {
    _id?: string;
    id?: string;
    text: string;
    pageIndex: number;
    rects: { x: number, y: number, width: number, height: number }[];
    color?: string;
    note?: string;
};

// The "Universal Remote" Interface
interface ResourceControl {
    // Current Resource
    currentResource: Resource | null;
    setCurrentResource: (resource: Resource | null) => void;

    // Highlights Logic
    highlights: Highlight[];
    setHighlights: (highlights: Highlight[]) => void;
    addHighlight: (h: Highlight) => void;
    removeHighlight: (id: string) => void;

    // Media Controls (Audio/Video)
    seekTo: (timeInSeconds: number) => void;
    play: () => void;
    pause: () => void;
    mediaState: 'playing' | 'paused' | 'buffering' | 'idle';
    currentTime: number;
    duration: number;

    // Document Controls (PDF, DOCX, Images)
    jumpToPage: (pageNumber: number) => void;
    jumpToLabel: (label: string) => void;
    nextPage: () => void;
    prevPage: () => void;
    currentPage: number;
    totalPages: number;
    setTotalPages: (total: number) => void;
    zoomLevel: number;
    setZoom: (level: number) => void;

    // Registration (Viewers call this to register their internal handlers)
    registerMediaHandler: (handlers: MediaHandlers) => void;
    registerDocumentHandler: (handlers: DocumentHandlers) => void;
}

type MediaHandlers = {
    seek: (t: number) => void;
    play: () => void;
    pause: () => void;
};

type DocumentHandlers = {
    jump: (p: number) => void;
    jumpToLabel?: (l: string) => void;
    setZoom: (z: number) => void;
};

const ResourceContext = createContext<ResourceControl | null>(null);

export function ResourceProvider({ children }: { children: React.ReactNode }) {
    // State
    const [currentResource, setCurrentResource] = useState<Resource | null>(null);
    const [highlights, setHighlights] = useState<Highlight[]>([]);

    const [mediaState, setMediaState] = useState<'playing' | 'paused' | 'buffering' | 'idle'>('idle');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [zoomLevel, setZoomLevel] = useState(100);

    // Refs to actual implementations (The TV screen)
    const mediaRef = useRef<MediaHandlers | null>(null);
    const docRef = useRef<DocumentHandlers | null>(null);

    // --- Actions ---

    const addHighlight = useCallback((h: Highlight) => {
        setHighlights(prev => [...prev, h]);
    }, []);

    const removeHighlight = useCallback((id: string) => {
        setHighlights(prev => prev.filter(x => x.id !== id && x._id !== id));
    }, []);

    const seekTo = useCallback((time: number) => {
        if (mediaRef.current) {
            mediaRef.current.seek(time);
            setCurrentTime(time);
        }
    }, []);

    const play = useCallback(() => {
        mediaRef.current?.play();
        setMediaState('playing');
    }, []);

    const pause = useCallback(() => {
        mediaRef.current?.pause();
        setMediaState('paused');
    }, []);

    const jumpToPage = useCallback((page: number) => {
        if (docRef.current) {
            // Safety check against known total
            const safePage = Math.max(1, Math.min(page, totalPages));
            docRef.current.jump(safePage);
            setCurrentPage(safePage);
        }
    }, [totalPages]);

    const jumpToLabel = useCallback((label: string) => {
        if (docRef.current && docRef.current.jumpToLabel) {
            docRef.current.jumpToLabel(label);
        } else {
            // Fallback to integer parse
            const pageNum = parseInt(label);
            if (!isNaN(pageNum)) {
                jumpToPage(pageNum);
            }
        }
    }, [jumpToPage]);

    const nextPage = useCallback(() => jumpToPage(currentPage + 1), [currentPage, jumpToPage]);
    const prevPage = useCallback(() => jumpToPage(currentPage - 1), [currentPage, jumpToPage]);

    const setZoom = useCallback((level: number) => {
        if (docRef.current) {
            docRef.current.setZoom(level);
            setZoomLevel(level);
        }
    }, []);

    const registerMediaHandler = useCallback((handlers: MediaHandlers) => {
        mediaRef.current = handlers;
    }, []);

    const registerDocumentHandler = useCallback((handlers: DocumentHandlers) => {
        docRef.current = handlers;
    }, []);


    return (
        <ResourceContext.Provider value={{
            currentResource, setCurrentResource,
            highlights, setHighlights, addHighlight, removeHighlight,
            seekTo, play, pause, mediaState, currentTime, duration,
            jumpToPage, jumpToLabel, nextPage, prevPage, currentPage, totalPages, setTotalPages, zoomLevel, setZoom,
            registerMediaHandler, registerDocumentHandler
        }}>
            {children}
        </ResourceContext.Provider>
    );
}

export const useResource = () => {
    const context = useContext(ResourceContext);
    if (!context) throw new Error('useResource must be used within ResourceProvider');
    return context;
};
