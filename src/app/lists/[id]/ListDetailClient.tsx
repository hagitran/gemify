"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { updateListName } from "../actions";
import OngoingReviewCard from "@/app/components/OngoingReviewCard";

interface List {
    id: number;
    name: string;
    description: string | null;
    user: { name: string } | { name: string }[];
    created_at: string;
}

interface Place {
    id: number;
    name: string;
    city: string;
    type: string;
    address: string;
    image_path: string;
    price: number;
    lat?: number;
    long?: number;
    display_name?: string;
    osm_id?: string;
    notes: string;
    added_by: string;
    description: string;
    ambiance?: string;
    created_at?: string;
    view_count?: number;
}

export default function ListDetailClient({ initialList, places }: { initialList: List, places: Place[] }) {
    const [list, setList] = useState(initialList);
    const [name, setName] = useState(initialList.name || "");
    const [nameChange, setNameChange] = useState("");
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleNameBlur = async () => {
        let newName = name === "New list" ? nameChange.trim() : name.trim();
        if (!newName) {
            newName = "New list";
            setName(newName);
            setNameChange("");
        }
        if (list && newName !== list.name) {
            // Optimistically update
            const prevName = list.name;
            setList({ ...list, name: newName });
            setName(newName);
            setNameChange("");
            try {
                await updateListName(list.id, newName);
                setError(null);
            } catch {
                // Revert on error
                setList({ ...list, name: prevName });
                setName(prevName);
                setError("Failed to update name.");
            }
        }
    };

    return (
        <div className="flex flex-col w-1/2 mx-auto p-12">
            <div className="flex items-center gap-2 min-w-64 max-w-full justify-between mb-4">
                <input
                    ref={inputRef}
                    type="text"
                    value={name === "New list" ? nameChange : name}
                    onChange={name === "New list" ? e => setNameChange(e.target.value) : e => setName(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="New list"
                    className={`min-w-48 text-3xl font-semibold flex-grow overflow-hidden whitespace-nowrap text-ellipsis focus:outline-none focus:underline decoration-emerald-600 ${(name === "New list" && !nameChange) ? "text-zinc-500" : "text-black"}`}
                    style={{ maxWidth: 'calc(100% - 48px)' }}
                />
                <button
                    onClick={() => inputRef.current?.focus()}
                    className="p-2 pl-6 text-zinc-600 hover:text-emerald-600 transition-colors flex-shrink-0"
                    aria-label="Rename list"
                    type="button"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
            </div>
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            {list.description && <div className="text-zinc-500 mt-1">{list.description}</div>}
            <div>
                This list was curated by{" "}
                <Link href={`/profiles/${Array.isArray(list?.user) ? list.user[0]?.name : list?.user?.name}`} className="underline underline-offset-2 decoration-zinc-600">{Array.isArray(list?.user) ? list.user[0]?.name : list?.user?.name}</Link>
                {" "} on {" "}
                <span>
                    {list.created_at ? new Date(list.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}.
                </span>
            </div>
            <div className="mt-24">
                {places.length === 0 ? (
                    <div className="text-zinc-400">No places in this list yet.</div>
                ) : (
                    <ul className="flex flex-col gap-4">
                        {places.map((place) => (
                            <li key={place.id}>
                                <OngoingReviewCard place={place} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}