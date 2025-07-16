"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface OngoingReviewCardProps {
    place: {
        id: string;
        name: string;
        city: string;
        type: string;
        image_path: string;
        price: number;
        lat?: number;
        long?: number;
        display_name?: string;
        osm_id?: string;
        added_by: string;
        ambiance?: string;
    };
    reviewId?: number;
    onDiscard?: () => Promise<void>;
    onReview?: () => void;
}

export default function OngoingReviewCard({ place, reviewId, onDiscard, onReview }: OngoingReviewCardProps) {
    const price = place.price ? '$'.repeat(place.price) : '';
    const type = place.type ? place.type.charAt(0).toUpperCase() + place.type.slice(1) : '';
    const [discarding, setDiscarding] = useState(false);

    const handleDiscard = async () => {
        if (!onDiscard) return;
        setDiscarding(true);
        await onDiscard();
        setDiscarding(false);
    };

    // Always use the original upload version for ongoing review
    let imageUrl = place.image_path;
    if (imageUrl && imageUrl.includes('/thumbnails/')) {
        imageUrl = imageUrl.replace('/thumbnails/', '/uploads/');
    }

    return (
        <div className="relative w-full max-w-full sm:max-w-2xl h-56 sm:h-64 bg-zinc-100 rounded-lg sm:rounded-2xl overflow-hidden shadow mb-4">
            <Link href={`/places/${place.id}`}>
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={place.name || place.display_name || "Preview"}
                        fill
                        className="object-cover w-full h-full"
                        sizes="(max-width: 768px) 100vw, 768px"
                        unoptimized={false}
                        priority={false}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400 text-3xl sm:text-4xl bg-zinc-200">
                        No Image
                    </div>
                )}
                {/* Overlay for name and tags */}
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 sm:p-6 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <h2 className="text-2xl sm:text-2xl font-bold text-white drop-shadow">{place.name || place.display_name}</h2>
                        {/* Badge removed for now */}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                        {type && <span className="bg-white/80 text-zinc-800 text-base font-medium rounded px-3 py-2">{type}</span>}
                        {price && <span className="bg-white/80 text-zinc-800 text-base font-medium rounded px-3 py-2">{price}</span>}
                    </div>
                </div>
            </Link>
            {/* Action button and discard overlay */}
            <div className="absolute top-2 right-2 z-10 flex flex-row items-end gap-2">
                <button
                    className="px-4 py-2 bg-white text-black rounded font-medium hover:opacity-90 cursor-pointer transition-colors text-xs shadow duration-200"
                    onClick={onReview}
                >
                    Review
                </button>
                {reviewId && onDiscard && (
                    <button
                        className="px-2 py-2 w-full text-xs font-medium text-red-600 bg-white rounded hover:opacity-90 duration-200 transition-colors text-right cursor-pointer disabled:opacity-50 flex items-center gap-2"
                        onClick={handleDiscard}
                        disabled={discarding}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        Discard
                    </button>
                )}
            </div>
        </div>
    );
} 