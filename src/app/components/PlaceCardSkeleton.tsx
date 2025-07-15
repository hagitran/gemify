export default function PlaceCardSkeleton() {
    return (
        <div className="w-[220px] h-[320px] bg-zinc-100 rounded-2xl animate-pulse flex flex-col">
            <div className="h-40 bg-zinc-200 rounded-t-2xl" />
            <div className="flex-1 flex flex-col p-4 gap-2">
                <div className="h-5 bg-zinc-300 rounded w-3/4" />
                <div className="h-4 bg-zinc-200 rounded w-1/2" />
                <div className="h-4 bg-zinc-200 rounded w-1/3" />
            </div>
        </div>
    );
} 