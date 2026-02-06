'use client';

import { useEffect } from 'react';
import { useResource } from '@/context/ResourceContext';

import { Highlight } from '@/context/ResourceContext';

interface ResourceInitializerProps {
    fileUrl: string;
    fileType: string;
    initialHighlights?: Highlight[];
}

export default function ResourceInitializer({ fileUrl, fileType, initialHighlights = [] }: ResourceInitializerProps) {
    const { setCurrentResource, setHighlights } = useResource();

    useEffect(() => {
        if (fileUrl && fileType) {
            setCurrentResource({
                url: fileUrl,
                type: fileType
            });
        }
        if (initialHighlights) {
            setHighlights(initialHighlights);
        }
    }, [fileUrl, fileType, initialHighlights, setCurrentResource, setHighlights]);

    return null; // This is just an initializer, no UI
}
