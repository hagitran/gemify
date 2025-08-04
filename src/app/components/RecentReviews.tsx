"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getRecentReviews } from "../actions";

interface Review {
    id: number;
    note: string;
    price: number | null;
    ambiance: string | null;
    created_at: string;
    place: {
        id: number;
        name: string;
        type: string | null;
        city: string | null;
        image_path: string | null;
    };
    user: {
        name: string | null;
    };
}

export default function RecentReviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    const isPlacePage = pathname?.startsWith('/places/');
    const title = isPlacePage ? "Try another gem" : "What people are saying";
    const containerClass = isPlacePage ? "w-full flex flex-col items-center" : "w-full";
    const cardClass = isPlacePage ? "w-64 flex-shrink-0" : "w-80 flex-shrink-0";
    const scrollClass = isPlacePage ? "flex gap-6 overflow-x-auto pb-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" : "flex gap-4 overflow-x-auto pb-4";
    const cardCount = isPlacePage ? 3 : 4;

    useEffect(() => {
        const fetchRecentReviews = async () => {
            try {
                const result = await getRecentReviews();
                if (result.reviews) {
                    setReviews(result.reviews);
                }
            } catch (error) {
                console.error("Error fetching recent reviews:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentReviews();
    }, []);

    if (loading) {
        return (
            <div className="w-full">
                <h2 className="text-2xl font-bold mb-6">What people are saying</h2>
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

    if (reviews.length === 0) {
        return null;
    }

    return (
        <div className={containerClass}>
            <h2 className="text-2xl font-bold mb-6">{title}</h2>
            <div className={scrollClass}>
                {reviews.slice(0, cardCount).map((review) => (
                    <Link
                        key={review.id}
                        href={`/places/${review.place.id}`}
                        className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200"
                    >
                        <div className={`relative h-48 bg-gray-100 ${cardClass}`}>
                            {review.place.image_path ? (
                                <Image
                                    src={review.place.image_path}
                                    alt={review.place.name}
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
                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                        />
                                    </svg>
                                </div>
                            )}

                            {/* Gradient overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                            {/* Overlaid content */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <h3 className="font-semibold text-white mb-2 truncate">
                                    {review.place.name}
                                </h3>
                                <p className="text-sm text-gray-100 mb-3 line-clamp-2 opacity-80 h-6 truncate">
                                    {review.note}
                                </p>

                                {/* User info and date */}
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex flex-row items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                                            {review.user.name?.[0]?.toUpperCase() || 'A'}
                                        </div>
                                        <span className="text-gray-200">{review.user.name || "Anonymous"}</span>
                                    </div>
                                    <span className="text-gray-300">
                                        {new Date(review.created_at).toLocaleDateString("en-US", {
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