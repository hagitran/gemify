export default function PlaceCardSkeleton() {
    return (
        <div className="max-w-42 sm:max-w-full">
            <div className="relative w-42 h-42">
                {/* Image skeleton */}
                <div className="aspect-square object-cover bg-zinc-200 rounded-2xl animate-pulse" />
                {/* Heart icon overlay */}
                {/* <span className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 w-4 h-4"><path d="M19.5 13.572l-7.5 7.178-7.5-7.178C2.5 11.5 4.5 7.5 8.5 7.5c2 0 3.5 1.5 3.5 1.5s1.5-1.5 3.5-1.5c4 0 6 4 3.5 6.072z"></path></svg>
                </span> */}
            </div>
            <div className="pt-2 pb-3 flex flex-col gap-0.5">
                <div className="font-medium text-gray-900 text-sm truncate">
                    <div className="h-5 bg-zinc-200 rounded w-3/4 animate-pulse" />
                </div>
                <div className='flex flex-row gap-4'>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="h-4 bg-zinc-200 rounded w-8 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="h-4 bg-zinc-200 rounded w-10 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
} 