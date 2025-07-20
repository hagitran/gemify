"use client";
import { useRef, useState, RefObject, FormEvent } from "react";
import { authClient } from "../../lib/auth-client";
import Image from "next/image";
import supabase from "@/supabaseClient";
import resizeImage from "@/utils/resizeImage";
import MultiSelectDropdown from "@/app/components/MultiSelectDropdown";

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
    const [tried, setTried] = useState(false);
    const [recommendedItem, setRecommendedItem] = useState("");
    const [reviewPrice, setReviewPrice] = useState<number | "">("");
    const [ambiance, setAmbiance] = useState("");
    const [liked, setLiked] = useState(false);
    const [worthIt, setWorthIt] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        const formData = new FormData();
        formData.append("note", note);
        if (uploadedImagePath) formData.append("image_path", uploadedImagePath);
        if (session?.user?.id) formData.append("user_id", session.user.id);
        formData.append("tried", String(tried));
        formData.append("recommended_item", recommendedItem);
        if (reviewPrice !== "") formData.append("price", String(reviewPrice));
        formData.append("ambiance", ambiance);
        formData.append("liked", String(liked));
        formData.append("worth_it", String(worthIt));
        onSubmit(formData);
        setNote("");
        setImage(null);
        setThumbnailBlob(null);
        setImageUrl("");
        setUploadedImagePath("");
        setTried(false);
        setRecommendedItem("");
        setReviewPrice("");
        setAmbiance("");
        setLiked(false);
        setWorthIt(false);
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
        <form onSubmit={handleSubmit} className={`flex flex-col w-full ${className}`}>
            <div className="flex flex-col">
                <div className="relative w-full">
                    <textarea
                        ref={ref}
                        id="review-note"
                        name="note"
                        placeholder="Add a review..."
                        className="p-2 bg-zinc-100 w-full rounded focus:outline-none focus:ring-2 text-md resize-none peer"
                        rows={2}
                        required
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <label
                    htmlFor="review-image-upload"
                    className="underline underline-offset-2 text-black hover:text-emerald-600 text-sm font-medium cursor-pointer"
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
                {/* Additional review fields, only show if imageUrl is present */}
                {imageUrl && (
                    <div className="flex flex-row gap-4 mt-4">
                        <div className="relative w-48 h-48 shrink-0">
                            <Image
                                src={imageUrl}
                                alt="Preview"
                                fill
                                className="object-cover rounded-2xl bg-zinc-200"
                            />
                        </div>
                        <div className="flex flex-col w-full gap-2">
                            <div className="flex flex-col">
                                <label htmlFor="recommended-item" className="block text-sm font-medium text-gray-700 mb-1">Recommended Item</label>
                                <input
                                    id="recommended-item"
                                    type="text"
                                    value={recommendedItem}
                                    onChange={e => setRecommendedItem(e.target.value)}
                                    className="p-2 border border-zinc-300 w-full rounded-lg focus:outline-none focus:ring-2 text-md"
                                />
                            </div>
                            <div className="flex flex-row gap-4">
                                {/* Price input + worth it */}
                                <div className="flex flex-col flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                    <div className="flex items-center gap-2 py-2">
                                        {[1, 2, 3, 4, 5].map((dollar) => (
                                            <button
                                                type="button"
                                                key={dollar}
                                                onClick={() => setReviewPrice(dollar)}
                                                className={`text-3xl ${reviewPrice === dollar ? "text-emerald-600" : "text-zinc-400"}`}
                                                aria-label={`Set price to ${dollar}`}
                                            >
                                                $
                                            </button>
                                        ))}
                                    </div>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={worthIt} onChange={e => setWorthIt(e.target.checked)} />
                                        Was it worth it?
                                    </label>
                                </div>
                                {/* Ambiance input + did you like it */}
                                <div className="flex flex-col flex-1 w-full">
                                    <label htmlFor="ambiance" className="block text-sm font-medium text-gray-700 mb-1">Ambiance</label>
                                    <div className="">
                                        <MultiSelectDropdown
                                            options={[
                                                { value: "cozy", label: "Cozy" },
                                                { value: "lively", label: "Lively" },
                                                { value: "work-friendly", label: "Work-Friendly" },
                                                { value: "trendy", label: "Trendy" },
                                                { value: "traditional", label: "Traditional" },
                                                { value: "romantic", label: "Romantic" },
                                            ]}
                                            selected={ambiance ? ambiance.split(",") : []}
                                            onChange={selected => setAmbiance((selected as string[]).join(","))}
                                            placeholder="Select ambiance..."
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={liked} onChange={e => setLiked(e.target.checked)} />
                                        Did you like it?
                                    </label>
                                </div>
                            </div>
                        </div>
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