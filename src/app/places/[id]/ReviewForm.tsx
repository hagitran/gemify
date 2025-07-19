"use client";
import { useRef, useState, RefObject, FormEvent } from "react";
import { authClient } from "../../lib/auth-client";
import Image from "next/image";
import supabase from "@/supabaseClient";
import resizeImage from "@/utils/resizeImage";

export default function ReviewForm({ onSubmit, className = "", textareaRef, imageUploadRef }: { onSubmit: (formData: FormData) => void, className?: string, textareaRef?: RefObject<HTMLTextAreaElement>, imageUploadRef?: RefObject<HTMLLabelElement> }) {
    const { data: session } = authClient.useSession();
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const ref = textareaRef || internalRef;
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string>("");
    const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
    const [uploadedImagePath, setUploadedImagePath] = useState<string>("");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        const formData = new FormData();
        formData.append("note", note);
        if (uploadedImagePath) formData.append("image_path", uploadedImagePath);
        if (session?.user?.id) formData.append("user_id", session.user.id);
        onSubmit(formData);
        setNote("");
        setImage(null);
        setThumbnailBlob(null);
        setImageUrl("");
        setUploadedImagePath("");
        setLoading(false);
        if (ref.current) ref.current.value = "";
    }

    async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImage(file);
        // Resize to high-quality thumbnail (e.g., 700x700, JPEG, quality 0.92)
        const resizedBlob = await resizeImage(file, 700, 700, 0.92);
        setThumbnailBlob(resizedBlob);
        // Upload to Supabase Storage
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 8);
        const sanitizedFileName = file.name.replace(/\s+/g, '_');
        const fileName = `${timestamp}_${random}_${sanitizedFileName}`;
        const storagePath = `thumbnails/${fileName}`;
        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(storagePath, resizedBlob, {
                contentType: 'image/jpeg',
                upsert: true,
            });
        console.log(uploadError, 'uploaderr', imageUrl)
        if (uploadError) {
            setImageUrl("");
            setUploadedImagePath("");
            return;
        }
        // Get public URL
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(storagePath);
        const publicUrl = urlData?.publicUrl || '';
        setImageUrl(publicUrl);
        setUploadedImagePath(publicUrl);
        console.log(publicUrl, 'puburl')
    }

    return (
        <form onSubmit={handleSubmit} className={`flex flex-col gap-4 sm:gap-2 justify-end ${className}`}>
            <div className="flex flex-col">
                {imageUrl && (
                    <div className="w-48 h-48 mt-12 relative self-start">
                        <Image
                            src={imageUrl}
                            alt="Preview"
                            fill
                            className="object-cover rounded-2xl bg-zinc-200"
                        />
                    </div>
                )}
                <div className="relative w-full mt-4">
                    <textarea
                        ref={ref}
                        name="note"
                        placeholder="Add a review..."
                        className="p-2 bg-zinc-100 rounded focus:outline-none focus:ring-2 text-md resize-none w-full peer"
                        rows={2}
                        required
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        disabled={loading}
                    />
                    <label
                        htmlFor="review-image-upload"
                        className="absolute left-0 -bottom-7 underline underline-offset-2 text-black hover:text-emerald-600 text-sm font-medium cursor-pointer"
                    >
                        {image ? "Change image" : "Add image"}
                    </label>
                    <input
                        id="review-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                        disabled={loading}
                    />
                </div>
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