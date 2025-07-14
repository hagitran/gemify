"use client";
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Footer() {
    const pathname = usePathname();
    if (pathname !== '/') return null;
    return (
        <footer className="flex gap-[12px] flex-wrap items-center justify-end px-8 py-8">
            <a
                className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-zinc-600"
                href="https://hagitran.com"
                target="_blank"
                rel="noopener noreferrer"
            >
                <Image
                    aria-hidden
                    src="/globe.svg"
                    alt="Globe icon"
                    width={16}
                    height={16}
                />
                By Hagi
            </a>
        </footer>
    );
} 