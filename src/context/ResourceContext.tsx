'use client';

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

// Resource type
type Resource = {
    url: string;
    type: string;
};

// The "Universal Remote" Interface
interface ResourceControl {
    // Current Resource
    currentResource: Resource | null;
    setCurrentResource: (resource: Resource | null) => void;

    // Media Controls (Audio/Video)
    seekTo: (timeInSeconds: number) => void;
    play: () => void;
    pause: () => void;
    mediaState: 'playing' | 'paused' | 'buffering' | 'idle';
    currentTime: number;
    duration: number;

    // Document Controls (PDF, DOCX, Images)
    jumpToPage: (pageNumber: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    currentPage: number;
    totalPages: number;
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
    setZoom: (z: number) => void;
};

const ResourceContext = createContext<ResourceControl | null>(null);

export function ResourceProvider({ children }: { children: React.ReactNode }) {
    // State
    const [currentResource, setCurrentResource] = useState<Resource | null>(null);
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
            const safePage = Math.max(1, Math.min(page, totalPages));
            docRef.current.jump(safePage);
            setCurrentPage(safePage);
        }
    }, [totalPages]);

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
            seekTo, play, pause, mediaState, currentTime, duration,
            jumpToPage, nextPage, prevPage, currentPage, totalPages, zoomLevel, setZoom,
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
