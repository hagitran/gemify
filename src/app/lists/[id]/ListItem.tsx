"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getPlaceReviews } from "../actions";
import ListReviewCard from "./ListReviewCard"
import PlacePersonalizationBanner from "@/app/places/[id]/PlacePersonalizationBanner";

interface Note {
    id: number;
    note: string;
    user_id: string;
    image_path: string;
    user?: { name: string };
    price: number;
    ambiance?: string;
    created_at?: string;
}

interface ListItemProps {
    index?: number;
    place: {
        id: number;
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
}

export default function ListItem({ index, place }: ListItemProps) {
    const price = place.price ? '$'.repeat(place.price) : '';
    const type = place.type ? place.type.charAt(0).toUpperCase() + place.type.slice(1) : '';
    const [imageError, setImageError] = useState(false);
    const [reviews, setReviews] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    const handleImageError = () => {
        console.log('Image failed to load:', place.image_path);
        setImageError(true);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [reviewsData] = await Promise.all([
                    getPlaceReviews(place.id),
                ]);
                setReviews(reviewsData as unknown as Note[]);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [place.id]);

    // Use the original upload version for ongoing review, but handle errors gracefully
    let imageUrl = place.image_path;
    if (imageUrl && imageUrl.includes('/thumbnails/') && !imageError) {
        imageUrl = imageUrl.replace('/thumbnails/', '/uploads/');
    }
    return (
        <div className="w-full mb-4">
            <div className="relative w-full h-48 bg-zinc-100 rounded-lg sm:rounded-xl overflow-hidden shadow">
                <Link href={`/places/${place.id}`}>
                    <div className="absolute top-5 left-4 z-10">
                        {index && <span className="bg-white/80 text-zinc-800 text-base font-medium rounded px-3 py-2 w-max">{index}</span>}
                    </div>
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={place.name || place.display_name || "Preview"}
                            fill
                            className="object-cover w-full h-full"
                            sizes="(max-width: 768px) 100vw, 768px"
                            unoptimized={false}
                            priority={false}
                            onError={handleImageError}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 text-lg bg-zinc-200">
                            No Image
                        </div>
                    )}
                    {/* Overlay for name and tags */}
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-2 sm:p-4 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                            <h2 className="text-2xl sm:text-2xl font-bold text-white drop-shadow">
                                {place.name || place.display_name}
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            {type && <span className="bg-white/80 text-zinc-800 text-base font-medium rounded px-3 py-2">{type}</span>}
                            {price && <span className="bg-white/80 text-zinc-800 text-base font-medium rounded px-3 py-2">{price}</span>}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Review Card */}
            {(!loading && reviews.length > 0) ? (
                <div className="flex flex-col sm:flex-row mt-2 gap-4">
                    <div className="flex flex-col w-full sm:w-2/5">
                        <div className="underline underline-offset-2 decoration-emerald-600 font-medium py-2">Users say</div>
                        <ListReviewCard
                            note={reviews[0]}
                        />
                    </div>
                    <div className="flex flex-col w-full sm:w-3/5 px-0 sm:px-2">
                        <div className="underline underline-offset-2 decoration-emerald-600 font-medium py-2">We think</div>
                        <PlacePersonalizationBanner type="list" place={{
                            name: place.name,
                            city: place.city,
                            type: place.type,
                            price: place.price,
                            ambiance: place.ambiance ? [place.ambiance] : undefined
                        }}></PlacePersonalizationBanner>
                    </div>
                </div>
            ) :
                <Link className="" href={"/places/" + place.id}>
                    <div className="underline underline-offset-2 decoration-emerald-600 font-medium p-2 text-right">We don&apos;t have much info, help us out?</div>
                </Link>
            }
        </div>
    );
} 