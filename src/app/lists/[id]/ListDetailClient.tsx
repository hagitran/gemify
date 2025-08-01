"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { updateListName } from "../actions";
import ListItem from "./ListItem";
import { Place, List } from "../types";
import supabase from "@/supabaseClient";

export default function ListDetailClient({
    initialList,
    places
}: {
    initialList: List,
    places: Place[]
}) {
    const [list, setList] = useState(initialList);
    const [currentPlaces, setCurrentPlaces] = useState(places);
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
            const prevName = list.name;
            setList({ ...list, name: newName });
            setName(newName);
            setNameChange("");
            try {
                await updateListName(list.id, newName);
                setError(null);
            } catch {
                setList({ ...list, name: prevName });
                setName(prevName);
                setError("Failed to update name.");
            }
        }
    };

    const userName = list?.createdBy;

    // Listen for list updates
    useEffect(() => {
        const handleListUpdate = () => {
            // Refetch places data instead of reloading the page
            const refetchPlaces = async () => {
                try {
                    const { data: listPlaces } = await supabase
                        .from("list_places")
                        .select("place:place_id(*)")
                        .eq("list_id", list.id);

                    const places = (listPlaces || [])
                        .map((lp: { place: Place[] }) => lp.place[0])
                        .filter(Boolean) as unknown as Place[];

                    setCurrentPlaces(places);
                } catch (error) {
                    console.error('Failed to refetch places:', error);
                }
            };

            refetchPlaces();
        };

        window.addEventListener('listUpdated', handleListUpdate);
        return () => window.removeEventListener('listUpdated', handleListUpdate);
    }, [list.id]);

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
                    className={`min-w-48 text-3xl underline underline-offset-2 font-semibold flex-grow overflow-hidden whitespace-nowrap text-ellipsis focus:outline-none focus:underline decoration-emerald-600 ${(name === "New list" && !nameChange) ? "text-zinc-500" : "text-black"}`}
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
            <div>
                This list was curated by{" "}
                <Link href={`/profiles/${userName}`} className="underline underline-offset-2 decoration-zinc-600">{userName}</Link>
                {" "} on {" "}
                <span>
                    {list.created_at ? new Date(list.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}.
                </span>
            </div>
            <div className="mt-24 w-full">
                {currentPlaces.length === 0 ? (
                    <div className="text-zinc-400">No places in this list yet.</div>
                ) : (
                    <ul className="flex flex-col gap-8">
                        {currentPlaces.map((place, index) => (
                            <li key={place.id} className="flex flex-col gap-4">
                                <ListItem
                                    index={index + 1}
                                    place={{
                                        id: place.id,
                                        name: place.name || '',
                                        city: place.city || '',
                                        type: place.type || '',
                                        image_path: place.image_path || '',
                                        price: place.price || 0,
                                        lat: place.lat || undefined,
                                        long: place.long || undefined,
                                        display_name: place.displayName || undefined,
                                        osm_id: place.osmId || undefined,
                                        added_by: place.addedBy || '',
                                        ambiance: place.ambiance?.[0] || undefined,
                                    }}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}