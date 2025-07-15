import Image from 'next/image';
import Link from 'next/link';

// Define type Place if not already defined
interface Place {
  id: string;
  name: string;
  city: string;
  type: string;
  address: string;
  image_path: string;
  price: number;
  lat?: number;
  long?: number;
  displayName?: string;
  osmId?: string;
  notes: string;
  added_by: string;
  description: string;
}

export default function PlaceCard({ data, distance }: { data: Place; distance?: number }) {

  console.log(data, 'data')

  return (
    <Link href={`/places/${data.id}`} className="max-w-[220px]">
      <div className="relative w-48">
        {data.image_path ? (
          <Image
            src={data.image_path}
            alt={data.name || data.displayName || 'Preview'}
            width={192}
            height={192}
            className="aspect-square object-cover rounded-2xl w-48 h-48 bg-zinc-200"
          />
        ) : (
          <div className='aspect-square object-cover bg-zinc-200 min-w-48 min-h-48 rounded-2xl' />
        )}
        {/* Type badge overlay */}
        <span className="absolute top-2 left-2 bg-white/90 text-gray-900 text-xs font-semibold rounded-full px-3 py-1 shadow-sm">
          {data.type.charAt(0).toUpperCase() + data.type.slice(1) || "What type?"}
        </span>
        {/* Heart icon overlay */}
        <span className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 w-4 h-4"><path d="M19.5 13.572l-7.5 7.178-7.5-7.178C2.5 11.5 4.5 7.5 8.5 7.5c2 0 3.5 1.5 3.5 1.5s1.5-1.5 3.5-1.5c4 0 6 4 3.5 6.072z"></path></svg>
        </span>
      </div>
      <div className="pt-2 pb-3 flex flex-col gap-0.5">
        <div className="font-medium text-gray-900 text-sm truncate">
          {(data.name || data.displayName)?.slice(0, 23) || "Place name"}
        </div>
        <div className='flex flex-row gap-4'>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {Number.isInteger(data.price) && data.price > 0 ? '$'.repeat(data.price) : 'Price'}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {typeof distance === 'number' && (
              <span>{distance.toFixed(1)} km</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
