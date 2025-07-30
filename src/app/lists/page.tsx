"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllLists, getListPlaces } from "./actions";
import PlaceCard from "@/app/components/PlaceCard";
import { List, Place } from "./types";

function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

function ListCard({ list }: { list: List }) {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getListPlaces(list.id)
            .then((data) => {
                setPlaces(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Failed to load places for list:', error);
                setLoading(false);
            });
    }, [list.id]);

    return (
        <li key={list.id} className="rounded py-4 bg-white">
            <div className="flex gap-1 mt-2">
                <Link href={`/profiles/${list.createdBy}`} className="w-12 h-12 mr-2 rounded-full bg-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-500">
                    {list.createdBy?.[0]?.toUpperCase() || 'A'}
                </Link>
                <Link href={`/profiles/${list.createdBy}`} className="flex flex-col">
                    <span className="font-semibold text-black text-lg hover:text-emerald-600 duration-200">{list.createdBy || 'Anonymous'}</span>
                    <span className="text-sm text-zinc-500">{formatTimeAgo(list.created_at)}</span>
                </Link>

                <span className="flex flex-col text-lg font-medium">curated
                    <span className="text-sm text-zinc-500 font-normal">{list.place_count ? list.place_count : "many"} places</span>
                </span>

                <Link href={`/lists/${list.id}`} className="font-semibold underline underline-offset-2 decoration-emerald-600 text-lg">
                    {" " + list.name}
                </Link>
            </div>

            <div className="mt-4">
                {loading ? (
                    <div className="text-zinc-400 text-sm">Loading places...</div>
                ) : places.length === 0 ? (
                    <div className="text-zinc-400 text-sm">No places in this list</div>
                ) : (
                    <div className="flex gap-2 overflow-x-auto">
                        {places.map((place) => (
                            <div key={place.id} className="flex-shrink-0">
                                <PlaceCard
                                    data={{
                                        id: place.id.toString(),
                                        name: place.name || '',
                                        city: place.city || '',
                                        type: place.type || '',
                                        address: '',
                                        image_path: place.image_path || '',
                                        price: place.price || 0,
                                        lat: place.lat || undefined,
                                        long: place.long || undefined,
                                        displayName: place.displayName || undefined,
                                        osmId: place.osmId || undefined,
                                        notes: '',
                                        added_by: place.addedBy || '',
                                        description: '',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </li>
    );
}

export default function ListsPage() {
    const [lists, setLists] = useState<List[]>([]);
    const [trendingLists, setTrendingLists] = useState<List[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllLists()
            .then((data) => {
                setLists(data);
                setTrendingLists([...data].sort((a, b) => (b.karma || 0) - (a.karma || 0)));
                setLoading(false);
            })
            .catch((error) => {
                console.error('Failed to load lists:', error);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-8 text-center">Loading lists...</div>;

    return (
        <div className="w-3/4 mx-auto p-6">
            <div className="flex flex-row gap-8">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-6">New Lists</h1>
                    {lists.length === 0 ? (
                        <div className="text-zinc-400">No lists found.</div>
                    ) : (
                        <ul className="space-y-4">
                            {lists.map(list => <ListCard key={list.id} list={list} />)}
                        </ul>
                    )}
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-6 flex-nowrap">Trending Lists</h1>
                    {trendingLists.length === 0 ? (
                        <div className="text-zinc-400">No lists found.</div>
                    ) : (
                        <ul className="space-y-4">
                            {trendingLists.map(list => <ListCard key={list.id} list={list} />)}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}