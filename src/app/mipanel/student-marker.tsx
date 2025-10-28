
'use client';

import React from 'react';
import { MarkerF } from '@react-google-maps/api';
import type { Estudiante } from '@/lib/types';

type StudentMarkerProps = {
  hijo: Estudiante;
  position: { lat: number; lng: number };
  isActive: boolean;
  onClick: () => void;
};

export function StudentMarker({ hijo, position, isActive, onClick }: StudentMarkerProps) {
  if (hijo.avatar_url) {
    const baseSize = 40;
    const activeSize = 48;
    const borderWidth = 3;
    const pinHeight = 8;
    const shadowOffset = 2;

    const bubbleSize = isActive ? activeSize : baseSize;
    const avatarSize = bubbleSize - borderWidth * 2;

    const bubbleWidth = bubbleSize + shadowOffset * 2;
    const bubbleHeight = bubbleSize + pinHeight + shadowOffset * 2;
    const borderColor = isActive ? '#01C998' : '#A1A1AA';

    const bubbleSvg = `
        <svg width="${bubbleWidth}" height="${bubbleHeight}" viewBox="0 0 ${bubbleWidth} ${bubbleHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <defs>
                <filter id="shadow" x="0" y="0" width="${bubbleWidth}" height="${bubbleHeight}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="1"/>
                    <feGaussianBlur stdDeviation="1.5"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <path d="M ${bubbleWidth / 2} ${bubbleSize + pinHeight} L ${bubbleWidth / 2 - pinHeight / 1.5} ${bubbleSize} H ${bubbleWidth / 2 + pinHeight / 1.5} Z" fill="${borderColor}" />
                <circle cx="${bubbleWidth / 2}" cy="${bubbleSize / 2}" r="${bubbleSize / 2}" fill="${borderColor}"/>
                <circle cx="${bubbleWidth / 2}" cy="${bubbleSize / 2}" r="${(bubbleSize - borderWidth) / 2}" fill="white"/>
            </g>
        </svg>`.trim();

    return (
      <React.Fragment>
        <MarkerF
          position={position}
          icon={{
            url: `data:image/svg+xml;base64,${btoa(bubbleSvg)}`,
            scaledSize: new google.maps.Size(bubbleWidth, bubbleHeight),
            anchor: new google.maps.Point(bubbleWidth / 2, bubbleHeight - shadowOffset),
          }}
          zIndex={isActive ? 95 : 90}
          onClick={onClick}
        />
        <MarkerF
          position={position}
          icon={{
            url: hijo.avatar_url,
            scaledSize: new google.maps.Size(avatarSize, avatarSize),
            anchor: new google.maps.Point(avatarSize / 2, bubbleSize / 2 + avatarSize / 1.35),
          }}
          zIndex={isActive ? 96 : 91}
          onClick={onClick}
        />
      </React.Fragment>
    );
  } else {
    const pinColor = isActive ? '#01C998' : '#0D2C5B';
    const initials = ((hijo.nombre?.[0] || '') + (hijo.apellido?.[0] || '')).toUpperCase();
    const svgContent = `<text x="192" y="230" font-family="sans-serif" font-size="160" font-weight="bold" fill="white" text-anchor="middle" dy=".1em">${initials}</text>`;
    const svg = `
        <svg width="48" height="58" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
            <path fill="${pinColor}" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67a24 24 0 0 1-35.464 0z"/>
            ${svgContent}
        </svg>
    `.trim();
    const markerIcon = `data:image/svg+xml;base64,${btoa(svg)}`;

    return (
      <MarkerF
        position={position}
        icon={{
          url: markerIcon,
          scaledSize: new google.maps.Size(isActive ? 42 : 36, isActive ? 54 : 48),
          anchor: new google.maps.Point(isActive ? 21 : 18, isActive ? 54 : 48),
        }}
        title={`Parada de ${hijo.nombre}`}
        zIndex={isActive ? 95 : 90}
        onClick={onClick}
      />
    );
  }
}
