"use client";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "../lib/auth-client";

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

interface ReviewCardProps {
    note: Note;
    onDelete?: (noteId: number) => void;
}

export default function ReviewCard({ note, onDelete }: ReviewCardProps) {
    const { data: session } = authClient.useSession();

    const isOwnNote = session?.user?.id && (note.user_id === session.user.id) || session?.user.id == "EhK3OlvjJXRB1bGm9LxGzhsupemDKcaE";
    const username = note.user?.name || note.user_id;

    // Ambiance tags helper
    const ambianceTags = note.ambiance ? note.ambiance.split(/,| and /).map((a: string) => a.trim()).filter(Boolean) : [];

    const formatTimeAgo = (createdAt: string) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffMs = now.getTime() - created.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffMinutes < 1) {
            return 'Just now';
        } else if (diffHours < 24) {
            return "Today at " + created.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } else {
            return created.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    };
    console.log(note, 'wefhoi')

    // Social media post layout with image
    return (
        <div className="flex flex-col group relative mb-4">
            {/* Header: Profile + Name + Date */}
            <div className="flex flex-row gap-3">
                <Link href={`/profiles/${note.user?.name}`} className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-500">
                    {username?.[0]?.toUpperCase() || 'A'}
                </Link>
                <Link href={`/profiles/${note.user?.name}`} className="flex flex-col">
                    <span className="font-semibold text-black hover:text-emerald-600 duration-200">{username}</span>
                    <span className="text-sm text-zinc-500">
                        {note.created_at ? formatTimeAgo(note.created_at) : 'Just now'}
                    </span>
                </Link>
                <div className="flex flex-row gap-2 flex-wrap ml-8">
                    <span className="px-2 py-1 rounded h-max bg-green-50 text-green-700 text-sm font-semibold border-blue-100">
                        {'$'.repeat(note?.price)}
                    </span>
                    {ambianceTags.map((tag: string, i: number) => (
                        <span key={i} className="px-2 py-1 rounded h-max bg-blue-50 text-blue-700 text-sm font-semibold border-blue-100">{tag}</span>
                    ))}
                </div>
                {isOwnNote && onDelete && (
                    <button
                        className="text-sm ml-auto cursor-pointer font-medium text-black border-none bg-transparent rounded underline underline-offset-2 decoration-black hover:decoration-red-600 hover:text-red-600 transition-all z-10 self-start"
                        onClick={() => onDelete(note.id)}
                        title="Delete note"
                    >
                        Discard
                    </button>
                )}
            </div>

            {/* Text content */}
            <div className="flex flex-col mx-16 gap-4">
                <div className="text-zinc-700 break-words text-md">
                    {note.note}
                </div>
                {
                    note.image_path &&
                    <div className="relative w-1/2 aspect-square rounded-xl overflow-hidden mx-auto">
                        <Link href={note.image_path.replace(/thumbnails\//, 'uploads/')} target="_blank">
                            <Image
                                src={note.image_path}
                                alt="Preview"
                                fill
                                className="object-cover bg-zinc-200"
                            />
                        </Link>
                    </div>}
            </div>
        </div>
    );
} 