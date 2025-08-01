"use client";

import Link from "next/link";
import { UserDropdown } from "./UserDropdown";
import { QuerySelector } from "./QuerySelector";
import { authClient } from "../lib/auth-client";
import { usePathname } from "next/navigation";
import { useCityRoot } from "../CityRootContext";

export function Topbar() {
    const pathname = usePathname();
    const isRootPage = pathname === "/";

    const {
        data: session,
        isPending,
    } = authClient.useSession();

    const { city, setCity, root, setRoot } = useCityRoot();

    const handleSignOut = async () => {
        try {
            await authClient.signOut();
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <header
            className={`sticky top-0 z-50 w-full bg-zinc-50 border-b border-zinc-200 px-2 sm:px-8 py-3 ${!isRootPage ? 'hidden sm:block' : ''}`}
        >
            <div className="w-full justify-evenly flex items-center">
                {/* Logo */}
                <Link href="/" className="items-center gap-2 cursor-pointer hidden lg:flex">
                    <div className="flex flex-row items-end gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            <strong className="text-md text-emerald-600">Gem</strong>ify
                        </h1>
                        <span className="text-md text-zinc-500 hidden sm:inline">discover hidden gems</span>
                    </div>
                </Link>

                {/* Center Section: QuerySelector always visible */}
                <div className="flex-1 flex items-center gap-2 sm:justify-center justify-start sm:gap-4 sm:px-8 sm:py-2">
                    {isRootPage && (
                        <QuerySelector
                            city={city}
                            root={root}
                            onCityChange={setCity}
                            onRootChange={setRoot}
                        />
                    )}
                </div>

                {/* Right Section: hide on mobile, show on sm+ */}
                <div className="gap-2 hidden sm:flex">
                    <Link
                        href="/lists"
                        className="px-4 py-2 text-sm text-zinc-700 hover:text-emerald-600 transition-colors"
                    >
                        Explore lists
                        <div className="text-xs text-zinc-400">Curated by you</div>
                    </Link>
                    <Link
                        href="/add"
                        className="px-4 py-2 text-sm text-zinc-700 hover:text-emerald-600 transition-colors"
                    >
                        Share a gem
                        <div className="text-xs text-zinc-400">It&apos;s fast I promise</div>
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