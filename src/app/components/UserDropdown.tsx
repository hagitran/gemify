"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface UserDropdownProps {
    userName: string;
    userEmail?: string;
    onSignOut: () => void;
}

export function UserDropdown({ userName, userEmail, onSignOut }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);



    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSignOut = () => {
        onSignOut();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:text-emerald-600 transition-colors rounded-lg hover:bg-zinc-50 cursor-pointer"
            >
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{userName.replace(/@.*/, '')}</span>
                    {userEmail && (
                        <span className="text-xs text-zinc-500">{userEmail}</span>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <Link href={`/profiles/${userName}`} className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-50">
                    <button className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            View profile
                        </div>
                    </button>

                    <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors hover:text-red-600 cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign out
                        </div>
                    </button>
                </Link>
            )}
        </div>
    );
} 