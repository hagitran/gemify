"use client";
import { useRef, useState, RefObject, FormEvent } from "react";
import { authClient } from "../../lib/auth-client";
import Image from "next/image";
import supabase from "@/supabaseClient";
import resizeImage from "@/utils/resizeImage";
import MultiSelectDropdown from "@/app/components/MultiSelectDropdown";

interface Option {
    value: string | number;
    label: string;
}

interface Place {
    id: number;
    name: string;
    price: number;
    ambiance: string[];
}

export default function ReviewForm({ onSubmit, className = "", textareaRef, place }: { onSubmit: (formData: FormData) => void, className?: string, textareaRef?: RefObject<HTMLTextAreaElement>, place?: Place }) {
    const { data: session } = authClient.useSession();
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const ref = textareaRef || internalRef;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string>("");
    const [uploadedImagePath, setUploadedImagePath] = useState<string>("");
    const [tried, setTried] = useState(false);
    const [recommendedItem, setRecommendedItem] = useState("");
    const [reviewPrice, setReviewPrice] = useState<number | "">(place?.price || "");
    const [ambiance, setAmbiance] = useState(place?.ambiance ? (Array.isArray(place.ambiance) ? place.ambiance.join(",") : place.ambiance) : "");
    const [liked, setLiked] = useState(false);
    const [worthIt, setWorthIt] = useState(false);

    // Concise helpers for price and ambiance labels
    const priceOptions = [
        { value: 1, label: "a good deal" },
        { value: 2, label: "fairly priced" },
        { value: 3, label: "pricey" },
    ];
    const getPriceLabel = (val: number | "") => priceOptions.find(o => o.value === val)?.label || "";

    const ambianceOptions = [
        { value: "cozy", label: "cozy" },
        { value: "lively", label: "lively" },
        { value: "work-friendly", label: "work-friendly" },
        { value: "trendy", label: "trendy" },
        { value: "traditional", label: "traditional" },
        { value: "romantic", label: "romantic" },
    ];


    // Helper to convert comma-separated string to display format
    const getAmbianceDisplay = (ambianceStr: string) => {
        if (!ambianceStr) return "";
        const values = ambianceStr.split(",").map(s => s.trim());
        const labels = ambianceOptions.filter(o => values.includes(o.value)).map(o => o.label);
        return labels.length < 2 ? labels.join("") : labels.slice(0, -1).join(", ") + (labels.length > 1 ? " and " + labels[labels.length - 1] : "");
    };

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
        formData.append("ambiance", ambiance);
        formData.append("price", reviewPrice !== "" ? String(reviewPrice) : (place?.price ? String(place.price) : ""));
        formData.append("liked", String(liked));
        formData.append("worth_it", String(worthIt));
        console.log(ambiance, 'c ambiance')
        onSubmit(formData);
        setNote("");
        setImage(null);
        setImageUrl("");
        setUploadedImagePath("");
        setTried(false);
        setRecommendedItem("");
        setReviewPrice("");
        setAmbiance(place?.ambiance ? (Array.isArray(place.ambiance) ? place.ambiance.join(",") : place.ambiance) : "");
        setLiked(false);
        setWorthIt(false);
        setLoading(false);
        if (ref.current) ref.current.value = "";
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImage(file);

        try {
            // Resize to high-quality thumbnail (e.g., 700x700, JPEG, quality 0.92)
            const resizedBlob = await resizeImage(file, 700, 700, 0.92);

            // Generate unique file names
            const timestamp = Date.now();
            const random = Math.random().toString(36).slice(2, 8);
            const sanitizedFileName = file.name.replace(/\s+/g, '_');
            const fileName = `${timestamp}_${random}_${sanitizedFileName}`;
            const uploadPath = `uploads/${fileName}`;
            const thumbnailPath = `thumbnails/${fileName}`;

            // Upload original file
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(uploadPath, file, {
                    contentType: file.type,
                    upsert: true,
                });

            if (uploadError) {
                setImageUrl("");
                setUploadedImagePath("");
                throw new Error('Original upload error: ' + uploadError.message);
            }

            // Upload thumbnail (non-blocking)
            try {
                await supabase.storage
                    .from('images')
                    .upload(thumbnailPath, resizedBlob, {
                        contentType: 'image/jpeg',
                        upsert: true,
                    });
            } catch (thumbnailError) {
                console.error('Thumbnail upload failed:', thumbnailError);
            }

            // Always use the original's public URL
            const { data: urlData } = supabase.storage.from('images').getPublicUrl(uploadPath);
            const publicUrl = urlData?.publicUrl || '';
            setImageUrl(publicUrl);
            setUploadedImagePath(publicUrl);
            console.log(publicUrl, 'puburl');
        } catch (error) {
            console.error('Image upload error:', error);
            setImageUrl("");
            setUploadedImagePath("");
        }
    }

    return (
        <form onSubmit={handleSubmit} className={`flex flex-col w-full ${className}`}>
            <div className="flex flex-col">
                <div className="flex flex-col w-full py-2">
                    <span className="text-black text-sm font-medium cursor-pointer mt-2">
                        Most users think {place?.name} is {" "}
                        <MultiSelectDropdown
                            options={priceOptions as Option[]}
                            selected={reviewPrice ? [reviewPrice] : []}
                            onChange={selected => setReviewPrice(selected[0] ? Number(selected[0]) : "")}
                            placeholder={getPriceLabel(place?.price || 0)}
                            buttonClassName="!inline-flex !items-center !justify-between !w-auto !min-w-0 !p-0 !border-none !bg-transparent !shadow-none !underline !underline-offset-2 !decoration-emerald-600 !font-medium !align-baseline !focus:outline-none !hover:bg-transparent !hover:underline"
                            dropdownClassName="!inline-block !p-0 !m-0"
                            variant="mini"
                            singleSelect={true}
                        />

                        <MultiSelectDropdown
                            options={ambianceOptions as Option[]}
                            selected={ambiance ? ambiance.split(",").map((s: string) => s.trim()) : []}
                            onChange={selected => setAmbiance((selected as string[]).join(","))}
                            placeholder={getAmbianceDisplay(ambiance)}
                            buttonClassName="ml-2 !inline-flex !items-center !justify-between !w-auto !min-w-0 !p-0 !border-none !bg-transparent !shadow-none !underline !underline-offset-2 !decoration-emerald-600 !font-medium !align-baseline !focus:outline-none !hover:bg-transparent !hover:underline"
                            dropdownClassName="!inline-block !p-0 !m-0"
                            variant="mini"
                        />
                        <label className="inline-flex items-center gap-1 text-sm font-normal text-zinc-400">
                            Disagree? Select what you think above.
                        </label>
                        {/* {
                            (
                                ambiance.split(",").map(s => s.trim()).filter(Boolean).sort().join(",") ==
                                (Array.isArray(place?.ambiance) ? place.ambiance.slice().sort().join(",") : "")
                                || reviewPrice != place?.price
                            ) &&
                            <div className="flex gap-2 mt-1">
                                <span className="text-sm text-zinc-400 font-normal">Disagree? Select what you think above.</span>

                                <input
                                    type="checkbox"
                                    checked={liked}
                                    required
                                    onChange={e => setLiked(e.target.checked)}
                                    className="align-middle"
                                />

                                <label className="inline-flex items-center gap-1 text-sm font-medium">
                                    Agree?
                                </label>

                            </div>} */}
                    </span>
                </div>
                {imageUrl && (
                    <>
                        <div className="relative w-48 h-48 self-start">
                            <Image
                                src={imageUrl}
                                alt="Preview"
                                fill
                                className="object-cover rounded-lg bg-zinc-200"
                            />
                        </div>
                        <span className="text-sm text-zinc-400 mt-1 mb-2">Added {imageUrl.slice(-13)}</span>

                    </>
                )}
                <div className="relative w-full">
                    <textarea
                        ref={ref}
                        id="review-note"
                        name="note"
                        placeholder="Recommend a dish or share your thoughts :)"
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
                    className="underline underline-offset-2 text-black hover:text-emerald-600 text-sm font-medium cursor-pointer mt-2 w-16 whitespace-nowrap"
                >
                    {image ? "Change image" : "Add image"}
                </label>
                <input
                    ref={fileInputRef}
                    id="review-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={loading}
                />
                <div className="flex w-full justify-end">
                    <button
                        type="submit"
                        className="text-zinc-100 rounded-full hover:text-zinc-300 cursor-pointer font-medium text-sm transition-colors py-2 px-4 mt-4 bg-black text-right"
                        aria-label="Add Note"
                        disabled={loading || !note.trim()}
                    >
                        {loading ? "Adding..." : "Review"}
                    </button>
                </div>

            </div>
        </form>
    );
} 