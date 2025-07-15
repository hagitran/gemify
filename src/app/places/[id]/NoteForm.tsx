"use client";
import { useRef, useState, RefObject, FormEvent } from "react";
import { authClient } from "../../lib/auth-client";

export default function NoteForm({ onSubmit, className = "", textareaRef }: { onSubmit: (formData: FormData) => void, className?: string, textareaRef?: RefObject<HTMLTextAreaElement> }) {
    const { data: session } = authClient.useSession();
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const ref = textareaRef || internalRef;
    const [focused, setFocused] = useState(false);
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState("");
    const [image, setImage] = useState<File | null>(null);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        const formData = new FormData();
        formData.append("note", note);
        if (image) formData.append("image", image);
        if (session?.user?.id) formData.append("user_id", session.user.id);
        await onSubmit(formData);
        setNote("");
        setImage(null);
        setLoading(false);
        if (ref.current) ref.current.value = "";
    }

    return (
        <form onSubmit={handleSubmit} className={`mb-4 flex flex-col gap-2 justify-end mt-4 ${className}`}>
            <div className="relative">
                <textarea
                    ref={ref}
                    name="note"
                    placeholder="Add a note..."
                    className="p-2 bg-zinc-100 rounded focus:outline-none focus:ring-2 text-md resize-none w-full peer"
                    rows={2}
                    required
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 100)}
                    disabled={loading}
                />
                {focused && (
                    <div className="flex items-center gap-2 mt-2 absolute left-0">
                        <label className="cursor-pointer text-black hover:text-emerald-600 text-sm font-medium">
                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                className="hidden"
                                onChange={e => setImage(e.target.files?.[0] || null)}
                                disabled={loading}
                            />
                            <span className="underline underline-offset-2">Add image</span>
                        </label>
                        {image && <span className="text-xs text-zinc-500">{image.name}</span>}
                    </div>
                )}
            </div>
            <div className="flex w-full justify-end">
                <button
                    type="submit"
                    className="text-zinc-100 rounded-full hover:text-zinc-300 cursor-pointer font-medium text-sm transition-colors py-2 px-4 bg-black text-right"
                    aria-label="Add Note"
                    disabled={loading || !note.trim()}
                >
                    {loading ? "Adding..." : "Comment"}
                </button>
            </div>
        </form>
    );
} 