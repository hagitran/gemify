"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getRecommendedLists } from "../actions";

interface List {
    id: number;
    name: string;
    created_at: string;
    karma: number;
    user: {
        name: string | null;
    };
    cover_image?: string | null;
    place_count?: number;
}

export default function RecommendedLists() {
    const [lists, setLists] = useState<List[]>([]);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    const isListPage = pathname?.startsWith('/lists/');
    const title = isListPage ? "Discover more lists" : "Curated lists";
    const containerClass = isListPage ? "w-full flex flex-col items-center" : "w-full";
    const cardClass = isListPage ? "w-64 flex-shrink-0" : "w-80 flex-shrink-0";
    const scrollClass = isListPage ? "flex gap-6 overflow-x-auto pb-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" : "flex gap-4 overflow-x-auto pb-4";
    const cardCount = isListPage ? 3 : 4;

    useEffect(() => {
        const fetchRecommendedLists = async () => {
            try {
                const result = await getRecommendedLists();
                if (result.lists) {
                    setLists(result.lists);
                } else {
                    setLists([]);
                }
            } catch (error) {
                console.error("Error fetching recommended lists:", error);
                setLists([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendedLists();
    }, []);

    if (loading) {
        return (
            <div className="w-full">
                <h2 className="text-2xl font-bold mb-6">Curated lists</h2>
                <div className="flex justify-center gap-4 pb-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg p-4 animate-pulse w-[268px] flex-shrink-0">
                            <div className="h-32 bg-gray-200 rounded-lg mb-3"></div>
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (lists.length === 0) {
        return null;
    }

    return (
        <div className={containerClass}>
            <h2 className="text-2xl font-bold mb-6">{title}</h2>
            <div className={scrollClass}>
                {lists.slice(0, cardCount).map((list) => (
                    <Link
                        key={list.id}
                        href={`/lists/${list.id}`}
                        className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200"
                    >
                        <div className={`relative h-48 bg-gray-100 ${cardClass}`}>
                            {list.cover_image ? (
                                <Image
                                    src={list.cover_image}
                                    alt={list.name}
                                    fill
                                    className="object-cover w-full h-full"
                                    sizes="(max-width: 768px) 100vw, 768px"
                                    unoptimized={false}
                                    priority={false}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <svg
                                        className="w-12 h-12"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                </div>
                            )}

                            {/* Gradient overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                            {/* Overlaid content */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <h3 className="font-semibold text-white truncate">
                                    {list.name}
                                </h3>
                                <div className="flex flex-row gap-2 items-center mb-2">
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full">
                                            {list.place_count} places
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full">
                                            {list.karma} views
                                        </span>
                                    </div>
                                </div>

                                {/* User info and date */}
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex flex-row items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                                            {list.user.name?.[0]?.toUpperCase() || 'A'}
                                        </div>
                                        <span className="text-gray-200">{list.user.name || "Anonymous"}</span>
                                    </div>
                                    <span className="text-gray-300">
                                        {new Date(list.created_at).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
} 