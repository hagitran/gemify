"use client";
import { useState, useRef, useEffect } from "react";
import { authClient } from "../lib/auth-client";
import supabase from "@/supabaseClient";
import { addUserReview } from "../places/actions";

interface ReviewActionsProps {
    place: { id: number; address?: string; display_name?: string; added_by?: string };
    userReview: { id: number } | null;
    onUserReviewChange: () => void;
}

export default function ReviewActions({ place, userReview, onUserReviewChange }: ReviewActionsProps) {
    const [showAddress, setShowAddress] = useState(false);
    const [copied, setCopied] = useState(false);
    const [discarding, setDiscarding] = useState(false);
    const { data: session } = authClient.useSession();
    const addressDivRef = useRef<HTMLDivElement>(null);

    const handleDiscardReview = async () => {
        if (!userReview) return;
        setDiscarding(true);
        const { error } = await supabase
            .from("user_reviews")
            .delete()
            .eq("id", userReview.id);
        console.log(error);
        setDiscarding(false);
        onUserReviewChange(); // Refetch after discard
    };

    const handleTryNow = async () => {
        setShowAddress(true);
        const address = place.display_name || place.address || "";
        if (address) {
            await navigator.clipboard.writeText(address);
            setCopied(true);
        }

        if (session?.user?.id && place?.id) {
            await addUserReview({ user_id: session.user.id, place_id: place.id });
            onUserReviewChange();

            // Log interaction
            const { data: existing } = await supabase
                .from("user_interactions")
                .select("id, count")
                .eq("user_id", session.user.id)
                .eq("place_id", place.id)
                .eq("action", "try")
                .maybeSingle();

            if (existing) {
                await supabase.from("user_interactions").update({ count: existing.count + 1 }).eq("id", existing.id);
            } else {
                await supabase.from("user_interactions").insert({
                    user_id: session.user.id,
                    place_id: place.id,
                    action: "try",
                    count: 1
                });
            }
        }

        // Update view count
        const { data } = await supabase.from("user_reviews").select("view_count").eq("id", userReview?.id).maybeSingle();
        if (data) {
            await supabase.from("user_reviews").update({ view_count: (data.view_count || 0) + 1 }).eq("id", userReview?.id);
        }
    };

    const handleCloseModal = () => {
        setShowAddress(false);
    };

    // Close modal on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCloseModal();
            }
        };

        if (showAddress) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [showAddress]);

    return (
        <>
            {userReview ? (
                <div className="flex gap-8 items-center">
                    <button
                        type="button"
                        className="px-4 py-2 text-md text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer flex flex-col bg-transparent border-none outline-none"
                        onClick={async () => {
                            setShowAddress(true);
                            const address = place.display_name || place.address || "";
                            if (address) {
                                await navigator.clipboard.writeText(address);
                                setCopied(true);
                            }
                        }}
                    >
                        Copy address
                        <div className="text-sm text-emerald-600">Share your gem</div>
                    </button>
                    {/* Only show Discard if user is NOT the place owner */}
                    {session?.user?.id !== place.added_by && (
                        <button
                            className="px-3 py-2 text-md text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors text-right cursor-pointer disabled:opacity-50 flex items-center gap-2"
                            onClick={handleDiscardReview}
                            disabled={discarding}
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {discarding ? 'Discarding...' : 'Discard'}
                        </button>
                    )}
                </div>
            ) : (
                <div
                    className="py-2 text-md text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer"
                    onClick={handleTryNow}
                >
                    Try now
                    <div className="text-sm text-zinc-400">View address</div>
                </div>
            )}

            {/* Address Modal */}
            {showAddress && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={handleCloseModal}
                >
                    <div
                        ref={addressDivRef}
                        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Modal content */}
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-zinc-900 mb-2">Address</h3>
                                <p className="text-zinc-700 text-sm leading-relaxed">
                                    {(place?.display_name || place?.address) ?? "No address available."}
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                {copied && (
                                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-medium">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied to clipboard!
                                    </div>
                                )}
                            </div>
                            {/* <div className="text-zinc-400 text-xs mt-2">
                                Map integration coming soon
                            </div> */}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 