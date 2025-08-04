"use client";

import { useState, useEffect, useRef } from "react";
import { getRouteData } from "./actions";
import PlaceCard from "./components/PlaceCard";
import PlaceCardSkeleton from "./components/PlaceCardSkeleton";
import RecentReviews from "./components/RecentReviews";
import { useCityRoot } from "./CityRootContext";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

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

export default function Home() {
  const { city, root } = useCityRoot();
  const [routeData, setRouteData] = useState<Place[] | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; long: number } | null>(null);
  const cityCache = useRef<{ [key: string]: Place[] | null }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Listen for cache invalidation events
  useEffect(() => {
    function handleInvalidate(e: Event) {
      const customEvent = e as CustomEvent<{ city: string }>;
      const cacheKey = `${city}:${root ?? "all"}`;
      if (customEvent?.detail?.city) {
        // Invalidate all roots for this city
        Object.keys(cityCache.current).forEach(key => {
          if (key.startsWith(`${customEvent.detail.city}:`)) delete cityCache.current[key];
        });
      } else {
        cityCache.current = {};
      }
      // Optionally refetch if on that city/root
      getRouteData(city, root).then(data => {
        cityCache.current[cacheKey] = data;
        setRouteData(data);
      });
    }
    window.addEventListener('invalidateCityCache', handleInvalidate);
    return () => window.removeEventListener('invalidateCityCache', handleInvalidate);
  }, [city, root]);

  useEffect(() => {
    const cacheKey = `${city}:${root ?? "all"}`;

    // If cache exists, show it immediately
    if (cityCache.current[cacheKey]) {
      setRouteData(cityCache.current[cacheKey]);
      setIsLoading(false); // No skeleton
      // Fetch in background to update cache/state if data might be stale
      getRouteData(city, root).then(data => {
        cityCache.current[cacheKey] = data;
        setRouteData(data);
      });
    } else {
      // No cache, show skeleton
      setIsLoading(true);
      setRouteData(null);
      getRouteData(city, root).then(data => {
        cityCache.current[cacheKey] = data;
        setRouteData(data);
        setIsLoading(false);
      });
    }
  }, [city, root]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, long: pos.coords.longitude });
        },
        (err) => {
          console.log(err)
          // Optionally handle error
        }
      );
    }
  }, []);

  return (
    <div className="flex w-full h-full flex-col font-[family-name:var(--font-geist-sans)] text-zinc-700">
      <main className="flex flex-col flex-1 gap-8 items-center pt-16">
        <div className="flex justify-center items-center w-full h-full flex-col gap-8 max-w-6xl mx-auto px-4">
          {/* Recent Reviews Section */}
          <RecentReviews />

          {/* Loading skeletons */}
          {isLoading && (
            <div className="flex w-full flex-wrap sm:gap-x-8 sm:gap-y-8 mt-2 justify-evenly sm:justify-center items-center">
              {Array.from({ length: 15 }).map((_, i) => (
                <PlaceCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && routeData && (
            <div className="flex flex-col w-full h-full gap-2 sm:gap-4 mt-8">
              <h2 className="text-2xl font-bold">What we recommend</h2>
              {Array.isArray(routeData) && (routeData as Place[]).length > 0 && (
                <div className="flex w-full flex-wrap sm:gap-x-8 sm:gap-y-8 mt-2 justify-evenly sm:justify-center items-center">
                  {(routeData as Place[]).map((place: Place) => {
                    let distance = null;
                    if (
                      userLocation &&
                      typeof place.lat === "number" &&
                      typeof place.long === "number"
                    ) {
                      distance = haversineDistance(
                        userLocation.lat,
                        userLocation.long,
                        place.lat,
                        place.long
                      );
                    }
                    return (
                      <PlaceCard key={place.id} data={place} distance={distance === null ? undefined : distance} />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
