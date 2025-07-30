"use client";
import { useEffect } from "react";
import { authClient } from "@/app/lib/auth-client";
import supabase from "@/supabaseClient";
import { addUserReview } from "../actions";
import { ViewInteractionLoggerProps } from "../types";

export default function ViewInteractionLogger({ placeId }: ViewInteractionLoggerProps) {
    const { data: session } = authClient.useSession();

    useEffect(() => {
        const logInteraction = async () => {
            if (session?.user?.id && placeId) {
                await addUserReview({ user_id: session.user.id, place_id: placeId });

                // Log interaction
                const { data: existing } = await supabase
                    .from("user_interactions")
                    .select("id, count")
                    .eq("user_id", session.user.id)
                    .eq("place_id", placeId)
                    .eq("action", "view")
                    .maybeSingle();

                if (existing) {
                    await supabase.from("user_interactions").update({ count: existing.count + 1 }).eq("id", existing.id);
                } else {
                    await supabase.from("user_interactions").insert({
                        user_id: session.user.id,
                        place_id: placeId,
                        action: "view",
                        count: 1
                    });
                }
                await fetch("/api/characteristics", {
                    method: "POST",
                    body: JSON.stringify({ user_id: session.user.id }),
                    headers: { "Content-Type": "application/json" },
                });

            }
        };

        logInteraction();
    }, [session?.user?.id, placeId]);

    return null; // This component doesn't render anything
} 