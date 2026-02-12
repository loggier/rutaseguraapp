'use client';

import { useEffect, useRef, memo } from 'react';
import { MarkerF } from '@react-google-maps/api';
import type { TrackedBus } from '@/lib/types';

const SMOOTH_MOVE_DURATION_MS = 4500; 

type BusMarkerProps = {
    bus: TrackedBus;
    icon?: google.maps.Icon | string;
    activeIcon?: google.maps.Icon | string;
    isActive: boolean;
    isOnRoute: boolean; // New prop
    onClick: () => void;
};

export const BusMarker = memo(function BusMarker({ bus, icon, activeIcon, isActive, isOnRoute, onClick }: BusMarkerProps) {
    const markerRef = useRef<google.maps.Marker | null>(null);
    const animationFrameId = useRef<number>();

    // This effect runs only when the component mounts and unmounts for cleanup
    useEffect(() => {
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    // This effect handles position updates smoothly
    useEffect(() => {
        if (!markerRef.current || bus.last_latitude == null || bus.last_longitude == null) {
            return;
        }

        const newPosition = { lat: bus.last_latitude, lng: bus.last_longitude };
        const currentMarkerPosition = markerRef.current.getPosition();
        
        if (!currentMarkerPosition) {
            markerRef.current.setPosition(newPosition);
            return;
        }

        const startPosition = { lat: currentMarkerPosition.lat(), lng: currentMarkerPosition.lng() };

        if (startPosition.lat === newPosition.lat && startPosition.lng === newPosition.lng) {
            return;
        }

        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }

        let startTime: number | null = null;
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / SMOOTH_MOVE_DURATION_MS, 1);

            const lat = startPosition.lat + (newPosition.lat - startPosition.lat) * progress;
            const lng = startPosition.lng + (newPosition.lng - startPosition.lng) * progress;
            
            markerRef.current?.setPosition({ lat, lng });

            if (progress < 1) {
                animationFrameId.current = requestAnimationFrame(animate);
            }
        };

        animationFrameId.current = requestAnimationFrame(animate);

    }, [bus.last_latitude, bus.last_longitude]); // Reruns only when coordinates change

    // This effect handles changes to icon, z-index, and opacity
    useEffect(() => {
        if (!markerRef.current) return;
        markerRef.current.setIcon(isActive ? activeIcon : icon);
        markerRef.current.setZIndex(isActive ? 100 : (isOnRoute ? 50 : 10));
        markerRef.current.setOpacity(isOnRoute ? 1.0 : 0.6);
    }, [isActive, isOnRoute, icon, activeIcon]);

    const onLoad = (marker: google.maps.Marker) => {
        markerRef.current = marker;
        marker.setOpacity(isOnRoute ? 1.0 : 0.6); // Set initial opacity
        // The click handler is attached here manually to prevent re-renders on the MarkerF component
        marker.addListener('click', onClick);
    };
    
    // The MarkerF is rendered once with an initial position. All subsequent updates are handled
    // via the marker instance in the useEffect hooks to allow for smooth animation.
    return (
        <MarkerF
            onLoad={onLoad}
            position={{ lat: bus.last_latitude!, lng: bus.last_longitude! }}
        />
    );
});
