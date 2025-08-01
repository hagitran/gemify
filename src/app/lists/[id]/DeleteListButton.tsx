"use client";
import { authClient } from "@/app/lib/auth-client";
import supabase from "@/supabaseClient";
import { useRouter } from "next/navigation";

interface DeleteListButtonProps {
    listId: number;
    createdBy: string;
}

export default function DeleteListButton({ listId, createdBy }: DeleteListButtonProps) {
    const { data: session } = authClient.useSession();
    const router = useRouter();

    const isOwner = session?.user?.name && session.user.name === createdBy;

    if (!isOwner) return null;

    const handleDeleteList = async () => {
        if (!confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
            return;
        }

        try {
            // Delete all list places first
            await supabase.from("list_places").delete().eq("list_id", listId);

            // Delete all list members
            await supabase.from("list_members").delete().eq("list_id", listId);

            // Delete the list
            await supabase.from("lists").delete().eq("id", listId);

            // Redirect to lists page
            router.push("/lists");
        } catch (error) {
            console.error("Error deleting list:", error);
            alert("Failed to delete list. Please try again.");
        }
    };

    return (
        <button
            onClick={handleDeleteList}
            className="underline underline-offset-2 decoration-zinc-600 cursor-pointer"
        >
            delete list
        </button>
    );
} 