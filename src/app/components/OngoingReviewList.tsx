"use client";

import OngoingReviewCard from "./OngoingReviewCard";
import supabase from "@/supabaseClient";
import { useState } from "react";

interface Place {
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
}

export interface OngoingReview {
    id: number;
    place: Place;
}

export default function OngoingReviewList({ initialReviews }: { initialReviews: OngoingReview[] }) {
    const [ongoingReviews, setOngoingReviews] = useState(initialReviews);

    async function handleDiscardReview(reviewId: number) {
        await supabase.from("user_reviews").delete().eq("id", reviewId);
        setOngoingReviews((prev) => prev.filter(r => r.id !== reviewId));
    }

    if (!ongoingReviews || ongoingReviews.length === 0) {
        return <div className="text-zinc-400">No ongoing places.</div>;
    }

    return (
        <ul className="flex flex-col gap-4">
            {ongoingReviews.map((review) => (
                <li key={review.id}>
                    <OngoingReviewCard
                        place={review.place}
                        reviewId={review.id}
                        onDiscard={() => handleDiscardReview(review.id)}
                    />
                </li>
            ))}
        </ul>
    );
} 