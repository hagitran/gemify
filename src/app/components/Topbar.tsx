"use client";

import Link from "next/link";
import Image from "next/image";
import { UserDropdown } from "./UserDropdown";
import { QuerySelector } from "./QuerySelector";
import { authClient } from "../lib/auth-client";
import { usePathname } from "next/navigation";

export function Topbar() {
    const pathname = usePathname();
    const isRootPage = pathname === "/";

    const {
        data: session,
        isPending,
    } = authClient.useSession();

    const handleSignOut = async () => {
        try {
            await authClient.signOut();
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-zinc-50 border-b border-zinc-200 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 cursor-pointer">
                    <div className="flex flex-row items-end gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            <strong className="text-emerald-600">Gem</strong>ify
                        </h1>
                        <span className="text-md text-zinc-500 hidden sm:inline">discover hidden gems</span>
                    </div>
                </Link>

                {/* Center Section */}
                <div className="flex items-center gap-4">
                    {isRootPage && (
                        <QuerySelector
                            onCityChange={() => { }}
                            onRootChange={() => { }}
                        />
                    )}
                </div>

                <div className="flex gap-2">
                    <Link
                        href="/add"
                        className="px-4 py-2 text-sm text-zinc-700 hover:text-emerald-600 transition-colors"
                    >
                        Share a gem
                        <div className="text-xs text-zinc-400">It's fast I promise</div>
                    </Link>
                    {/* User Profile */}
                    <div className="flex items-center gap-4">
                        {isPending ? (
                            <div className="flex items-center gap-2 text-zinc-400">
                                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">Loading...</span>
                            </div>
                        ) : session && session.user ? (
                            <UserDropdown
                                userName={session.user.name || session.user.email || 'User'}
                                userEmail={session.user.email}
                                onSignOut={handleSignOut}
                            />
                        ) : (
                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm text-zinc-700 hover:text-emerald-600 transition-colors"
                            >
                                Sign In
                                <div className="text-xs text-zinc-400">Own your gems</div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}