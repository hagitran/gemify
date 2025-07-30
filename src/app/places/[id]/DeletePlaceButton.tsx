"use client";
import { authClient } from "../../lib/auth-client";
import supabase from "@/supabaseClient";
import { useRouter } from "next/navigation";
import { DeletePlaceButtonProps } from "../types";

export default function DeletePlaceButton({ placeId, addedBy }: DeletePlaceButtonProps) {
    const { data: session } = authClient.useSession();
    const router = useRouter();

    const isOwner = session?.user?.id && session.user.id === addedBy;

    if (!isOwner) return null;

    const handleDeletePlace = async () => {
        if (!confirm('Are you sure you want to delete this place? This action cannot be undone.')) {
            return;
        }

        try {
            // Delete all reviews for this place first
            await supabase.from("user_reviews").delete().eq("place_id", placeId);

            // Delete the place
            await supabase.from("places").delete().eq("id", placeId);

            // Redirect to home page
            router.push("/");
        } catch (error) {
            console.error("Error deleting place:", error);
            alert("Failed to delete place. Please try again.");
        }
    };

    return (
        <button
            onClick={handleDeletePlace}
            className="text-white/80 hover:text-red-400 text-sm underline underline-offset-2 transition-colors cursor-pointer font-medium"
        >
            delete
        </button>
    );
} 