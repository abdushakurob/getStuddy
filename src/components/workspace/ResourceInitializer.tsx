'use client';

import { useEffect } from 'react';
import { useResource } from '@/context/ResourceContext';

interface ResourceInitializerProps {
    fileUrl: string;
    fileType: string;
}

export default function ResourceInitializer({ fileUrl, fileType }: ResourceInitializerProps) {
    const { setCurrentResource } = useResource();

    useEffect(() => {
        if (fileUrl && fileType) {
            setCurrentResource({
                url: fileUrl,
                type: fileType
            });
        }
    }, [fileUrl, fileType, setCurrentResource]);

    return null; // This is just an initializer, no UI
}
