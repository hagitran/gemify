import supabase from '../../supabaseClient';

export default function PlaceCard({ data, distance, empty }: { data: any; distance?: number; empty?: boolean }) {
  let imageUrl: string | null = null;
  if (data.image_path) {
    const { data: urlData } = supabase.storage
      ? supabase.storage.from('images').getPublicUrl(data.image_path)
      : { data: { publicUrl: data.image_path } };
    imageUrl = urlData?.publicUrl || null;
  }
  console.log(distance)
  return (
    <div className="max-w-[220px] w-full">
      <div className="relative w-full">
        {empty && !imageUrl ? (
          <div className='aspect-square object-cover bg-zinc-200 min-w-48 min-h-48 rounded-2xl' />
        ) : (
          <img
            src={imageUrl || undefined}
            alt={data.name || data.displayName}
            className="w-full aspect-square object-cover rounded-2xl"
          />
        )}
        {/* Type badge overlay */}
        <span className={`absolute top-2 left-2 bg-white/90 text-gray-900 text-xs font-semibold rounded-full px-3 py-1 shadow-sm ${empty ? "!text-zinc-400" : ""}`}>
          {empty ? "What type?" : data.type}
        </span>
        {/* Heart icon overlay */}
        <span className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 w-4 h-4"><path d="M19.5 13.572l-7.5 7.178-7.5-7.178C2.5 11.5 4.5 7.5 8.5 7.5c2 0 3.5 1.5 3.5 1.5s1.5-1.5 3.5-1.5c4 0 6 4 3.5 6.072z"></path></svg>
        </span>
      </div>
      <div className="pt-2 pb-3 flex flex-col gap-0.5">
        <div className="font-medium text-gray-900 text-sm truncate">
          {empty ? "Place name" : data.name || data.displayName}
        </div>
        {/* <div className="text-xs text-gray-500 truncate">
          {empty ? "Display name" : data.displayName}
        </div> */}
        <div className='flex flex-row gap-4'>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {typeof distance === 'number' && (
              <span>{distance.toFixed(1)} km</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {empty ? 'Price' : (Number.isInteger(data.price) && data.price > 0 ? '$'.repeat(data.price) : null)}
          </div>
          {/* <div className="flex items-center gap-1 text-xs text-gray-500">
            {empty ? 'Karma' : (typeof data.karma === 'number' ? data.karma : null) + " likes"}
          </div> */}
        </div>
      </div>
    </div>
  );
}
