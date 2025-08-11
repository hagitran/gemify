"use client";
import Link from "next/link";

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

interface ListReviewCardProps {
    note: Note;
}

export default function ListReviewCard({ note }: ListReviewCardProps) {
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
            return "Today at " + created.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } else {
            return created.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    };

    return (
        <div className="flex flex-col bg-white rounded-xl p-4 border border-zinc-200">
            {/* Header: Profile + Name + Date */}
            <div className="flex flex-row gap-3 items-start">
                <Link href={`/profiles/${note.user?.name}`} className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-bold text-zinc-500 flex-shrink-0">
                    {username?.[0]?.toUpperCase() || 'A'}
                </Link>
                <div className="flex flex-col flex-grow min-w-0">
                    <Link href={`/profiles/${note.user?.name}`} className="flex flex-col">
                        <span className="font-semibold text-black hover:text-emerald-600 duration-200 text-sm">{username}</span>
                        <span className="text-xs text-zinc-500">
                            {note.created_at ? formatTimeAgo(note.created_at) : 'Just now'}
                        </span>
                    </Link>
                </div>

            </div>

            {/* Text content */}
            <div className="mt-3">
                <div className="text-zinc-700 break-words text-sm leading-relaxed">
                    {note.note?.length > 150 ? `${note.note.substring(0, 150)}...` : note.note}
                </div>
                <div className="flex flex-row gap-2 flex-wrap mt-3">
                    <span className="px-2 py-1 rounded h-max bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
                        {!note.price ? 'free' : '$'.repeat(note?.price)}
                    </span>
                    {ambianceTags.slice(0, 2).map((tag: string, i: number) => (
                        <span key={i} className="px-2 py-1 rounded h-max bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">{tag}</span>
                    ))}
                </div>
                {/* {note.image_path && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden mt-3">
                        <Link href={note.image_path.replace(/thumbnails\//, 'uploads/')} target="_blank">
                            <Image
                                src={note.image_path}
                                alt="Review image"
                                fill
                                className="object-cover bg-zinc-200"
                            />
                        </Link>
                    </div>
                )} */}
            </div>
        </div>
    );
} 