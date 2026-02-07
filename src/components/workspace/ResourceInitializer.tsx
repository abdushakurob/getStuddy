'use client';

import { useEffect } from 'react';
import { useResource } from '@/context/ResourceContext';

import { Highlight, Resource } from '@/context/ResourceContext';

interface ResourceInitializerProps {
    fileUrl: string;
    fileType: string;
    initialHighlights?: Highlight[];
    availableResources?: Resource[]; // New prop
}

export default function ResourceInitializer({ fileUrl, fileType, initialHighlights = [], availableResources = [] }: ResourceInitializerProps) {
    const { setCurrentResource, setHighlights, setAvailableResources } = useResource();

    useEffect(() => {
        if (fileUrl && fileType) {
            setCurrentResource({
                id: 'initial', // Placeholder or matching ID? Ideally we pass full resource obj.
                title: 'Current',
                url: fileUrl,
                type: fileType
            });
        }
        if (initialHighlights) {
            setHighlights(initialHighlights);
        }
        if (availableResources) {
            setAvailableResources(availableResources);
        }
    }, [fileUrl, fileType, initialHighlights, availableResources, setCurrentResource, setHighlights, setAvailableResources]);

    return null; // This is just an initializer, no UI
}
