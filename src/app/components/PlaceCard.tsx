import supabase from '../../supabaseClient';

export default function PlaceCard({ data, distance }: { data: any; distance?: number }) {
  let imageUrl: string | null = null;
  if (data.image_path) {
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.image_path);
    imageUrl = urlData?.publicUrl || null;
  }
  console.log(distance)
  return (
    <div className="rounded-xl p-4 bg-white min-w-44 max-w-xs flex flex-col items-start gap-2">
      {imageUrl && (
        <div className="w-full flex justify-center">
          <img
            src={imageUrl}
            alt={data.name || data.displayName}
            className="aspect-square w-40 h-40 object-cover rounded-lg mb-2 border border-emerald-50"
            style={{ minWidth: 0, minHeight: 0 }}
          />
        </div>
      )}
      <div className="font-semibold text-sm text-emerald-700 mb-0.5 w-full truncate">
        {data.name || data.displayName}
      </div>
      <div className="text-xs text-zinc-500 mb-1 w-full truncate">
        {data.displayName}
      </div>
      <div className='flex flex-row gap-2 w-full items-center'>
        <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-xs font-medium">
          {data.type}
        </span>
        <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-xs font-medium">
          {typeof distance === 'number' && distance.toFixed(2)} km
        </span>
      </div>
    </div>
  );
}
