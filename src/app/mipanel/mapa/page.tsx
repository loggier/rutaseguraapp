'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page is now the main /mipanel page. 
// We redirect any old links to the new location.
export default function OldMapaPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/mipanel');
    }, [router]);

    return null;
}
