"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";
import supabase from "@/supabaseClient";
import { addPlaceTolist } from "../places/actions";
import MultiSelectDropdown from "./MultiSelectDropdown";

interface AddToListButtonProps {
    placeId: number;
}

export default function AddToListButton({ placeId }: AddToListButtonProps) {
    const { data: session } = authClient.useSession();
    const [lists, setLists] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const router = useRouter();
    const [dropdownKey, setDropdownKey] = useState(0); // for force close

    useEffect(() => {
        if (!session?.user?.id) return;
        supabase
            .from("lists")
            .select("id, name")
            .eq("created_by", session.user.id)
            .then(({ data }) => {
                setLists(data || []);
                setLoading(false);
            });
    }, [session?.user?.id]);

    // Add a special option for creating a new list
    const NEW_LIST_VALUE = "__new__";
    const listOptions = [
        { value: NEW_LIST_VALUE, label: "Create a new list" },
        ...lists.map((it) => ({ value: it.id, label: it.name })),
    ];

    const handleAddToLists = async () => {
        setAdding(true);
        setError(null);
        setSuccess(null);
        let anyError = false;
        let newListId: number | null = null;
        let selected = selectedIds;

        // If 'New list' is selected, create it first
        if (selected.some(id => String(id) === NEW_LIST_VALUE)) {
            const { data, error } = await supabase
                .from("lists")
                .insert([{ name: "New list", created_by: session?.user.id }])
                .select();
            if (error || !data || !data[0]) {
                setError("Failed to create list");
                setAdding(false);
                return;
            }
            newListId = data[0].id;
            // Replace NEW_LIST_VALUE with the new id, filter to numbers only
            selected = selected.filter(id => typeof id === 'number');
            if (newListId !== null) selected = [...selected, newListId];
            setSelectedIds(selected);
        } else {
            // Always filter to numbers only
            selected = selected.filter((id): id is number => typeof id === 'number');
        }

        // Only add to lists with numeric IDs
        const numericSelected = selected.filter((id): id is number => typeof id === 'number');
        for (const listId of numericSelected) {
            const res = await addPlaceTolist({ list_id: listId, place_id: placeId });
            if (res && res.error) {
                setError(`Some failed: ${res.error}`);
                anyError = true;
            }
        }

        if (!anyError) {
            setSuccess("Added to selected lists! Redirecting...");
            router.push(`/lists/${newListId || numericSelected[0]}`);
        }
        setAdding(false);
        setTimeout(() => { setSuccess(null); setError(null); }, 2000);

        // Link the place to the new list
        if (newListId && placeId) {
            const { error: linkError } = await supabase
                .from("list_places")
                .insert([{ list_id: newListId, place_id: placeId }]);
            if (linkError) {
                setError("Failed to link place to new list");
                setAdding(false);
                return;
            }
        }
    };

    // Only allow one 'New list' at a time
    const handleDropdownChange = (selected: (string | number)[]) => {
        if (selected.some(id => String(id) === NEW_LIST_VALUE)) {
            setSelectedIds([NEW_LIST_VALUE]);
        } else {
            setSelectedIds(selected.filter((id): id is number => typeof id === 'number'));
        }
    };

    const handleCreateList = async () => {
        setAdding(true);
        setError(null);
        setSuccess(null);
        const { data, error } = await supabase
            .from("lists")
            .insert([{ name: "New list", created_by: session?.user.id }])
            .select();
        setAdding(false);
        if (error || !data || !data[0]) {
            setError("Failed to create list");
            return;
        }
        router.push(`/lists/${data[0].id}`);
    };

    if (!session?.user?.id) return null;
    if (loading) return <div>Loading...</div>;
    if (lists.length === 0) {
        return (
            <button onClick={handleCreateList} className="text-md text-zinc-700 hover:text-emerald-600 transition-colors text-right cursor-pointer" disabled={adding}>
                Create new list
                <div className="text-sm text-zinc-400">Start planning</div>
            </button>
        );
    }

    return (
        <div className="w-62">
            <MultiSelectDropdown
                options={listOptions}
                selected={selectedIds}
                onChange={handleDropdownChange}
                placeholder="Add to list..."
                onConfirm={handleAddToLists}
                onCancel={() => setDropdownKey(k => k + 1)}
                confirmLabel={adding ? "Adding..." : "Add"}
                cancelLabel="Cancel"
                confirmDisabled={adding || selectedIds.length === 0}
                key={dropdownKey}
                variant="detailed"
            />
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
            {success && <div className="text-emerald-600 text-xs mt-1">{success}</div>}
        </div>
    );
} 