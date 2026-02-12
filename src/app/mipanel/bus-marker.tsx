'use client';

import { memo } from 'react';
import { MarkerF } from '@react-google-maps/api';
import type { TrackedBus } from '@/lib/types';

type BusMarkerProps = {
    bus: TrackedBus;
    icon?: google.maps.Icon | string;
    activeIcon?: google.maps.Icon | string;
    isActive: boolean;
    isOnRoute: boolean;
    onClick: () => void;
};

export const BusMarker = memo(function BusMarker({ bus, icon, activeIcon, isActive, isOnRoute, onClick }: BusMarkerProps) {
    // Do not render if the bus has no coordinates
    if (bus.last_latitude == null || bus.last_longitude == null) {
        return null;
    }

    return (
        <MarkerF
            position={{ lat: bus.last_latitude, lng: bus.last_longitude }}
            icon={isActive ? activeIcon : icon}
            zIndex={isActive ? 100 : (isOnRoute ? 50 : 10)}
            opacity={isOnRoute ? 1.0 : 0.6}
            onClick={onClick}
        />
    );
});
