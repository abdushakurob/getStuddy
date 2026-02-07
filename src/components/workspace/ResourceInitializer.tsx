'use client';

import { useEffect } from 'react';
import { useResource } from '@/context/ResourceContext';

import { Highlight, Resource } from '@/context/ResourceContext';

interface ResourceInitializerProps {
    resourceId?: string;
    resourceTitle?: string;
    fileUrl: string;
    fileType: string;
    initialHighlights?: Highlight[];
    availableResources?: Resource[]; // New prop
}

export default function ResourceInitializer({
    resourceId = 'initial',
    resourceTitle = 'Current Resource',
    fileUrl,
    fileType,
    initialHighlights = [],
    availableResources = []
}: ResourceInitializerProps) {
    const { setCurrentResource, setHighlights, setAvailableResources } = useResource();

    useEffect(() => {
        if (fileUrl && fileType) {
            setCurrentResource({
                id: resourceId,
                _id: resourceId, // Ensure both exist for compatibility
                title: resourceTitle,
                url: fileUrl,
                type: fileType
            } as any); // Cast to any to bypass strict type check for now if Context type is missing _id
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
