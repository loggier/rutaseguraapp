'use client';
import { cn } from '@/lib/utils';

export function EmptyMailbox({ className }: { className?: string }) {
    return (
        <svg
            className={cn("w-32 h-32 text-muted-foreground", className)}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <g transform="translate(20, 20) scale(0.8)">
                {/* Mailbox Body */}
                <path d="M160,80H40C26.7,80,16,90.7,16,104v48c0,13.3,10.7,24,24,24h120c13.3,0,24-10.7,24-24v-48C184,90.7,173.3,80,160,80z" fill="none" strokeWidth="6" />
                <path d="M16,104a32,32 0 0 1 32-32h88a32,32 0 0 1 32,32" fill="none" strokeWidth="6" />

                {/* Mailbox Door */}
                <path d="M16,104v48c0,13.3,10.7,24,24,24h4" fill="none" strokeWidth="6" />
                <path d="M44,176a20,20 0 0 1 -20-20L24,108a20,20 0 0 1 20-20h0" fill="none" strokeWidth="6" />

                {/* Post */}
                <line x1="100" y1="176" x2="100" y2="200" strokeWidth="8" />
                <line x1="88" y1="200" x2="112" y2="200" strokeWidth="8" />

                {/* Flag */}
                <path d="M140,72L140,40" fill="none" strokeWidth="6" />
                <path d="M140,40 h16 v16 h-16 Z" fill="#F44336" stroke="none" />

                {/* Mouse */}
                <g strokeWidth="4">
                    <path d="M70 72 C 60 50, 40 50, 30 72" />
                    <circle cx="50" cy="80" r="18" fill="white" stroke="currentColor"/>
                    <circle cx="43" cy="78" r="2" fill="currentColor"/>
                    <path d="M50 86 Q 55 90 60 86" />
                    <path d="M68 80 C 75 80 75 70 65 65" />
                    <path d="M32 80 C 25 80 25 70 35 65" />
                    <path d="M30 72 C 20 85, 25 95, 35 95" fill="white" stroke="currentColor" />
                    <path d="M35 95 Q 40 100 45 95 L 60 90" fill="none" />
                </g>
            </g>
        </svg>
    )
}
