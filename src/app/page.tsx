"use client";

import { useState, useEffect } from "react";
import { getRouteData } from "./actions";
import PlaceCard from "./components/PlaceCard";
import Link from "next/link";

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
  console.log(lat1, lat2, lon1, lon2, '02')
  return R * c;
}

export default function Home() {
  const [city, setCity] = useState("hcmc");
  const [root, setRoot] = useState("");
  const [routeData, setRouteData] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; long: number } | null>(null);

  const rootOptions = ["Scenic", "Foodie", "Experiences", "All"];

  useEffect(() => {
    getRouteData(city, root).then(setRouteData);
  }, [root]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, long: pos.coords.longitude });
        },
        (err) => {
          // Optionally handle error
        }
      );
    }
  }, []);

  return (
    <div className="flex w-full flex-col font-[family-name:var(--font-geist-sans)] text-zinc-700">
      <main className="flex flex-col flex-1 gap-12 items-center">
        {/* <div className="w-full flex justify-end mb-4">
          <Link href="/add" className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700 transition-colors font-medium">
            Add a Place
          </Link>
        </div> */}

        <div className="flex justify-center items-center w-full flex-col gap-8">

          <div
            className={`flex justify-center gap-8 ${root ? 'flex-row items-center py-4 !gap-16 z-50 sticky top-0 left-0 w-full bg-zinc-50 border-b border-zinc-300' : 'flex-col items-center'} transition-all duration-300`}
          >
            <Link href="/" className="flex flex-col gap-2 items-center sm:items-start">
              <div className="flex flex-row items-end gap-4">
                <h1 className="text-4xl font-bold tracking-tight"><strong className="text-emerald-600">Gem</strong>ify</h1>
                <h2 className="text-2xl font-medium text-zinc-700">discover hidden gems</h2>
              </div>
              <p className={`text-zinc-500 text-sm mt-1 transition-opacity duration-300 ${root ? "opacity-0 pointer-events-none h-0" : "opacity-100 h-auto"}`}>
                *for quality control only select cities are available right now
              </p>
            </Link>

            <div className="flex flex-col rounded-xl shadow bg-white/80 px-4 py-2 items-center border border-zinc-200">
              <div className="flex flex-row items-stretch gap-6 w-full rounded-md">
                <div className="flex-1 flex flex-col min-h-0">
                  <span className="text-md font-medium text-zinc-700 mb-1">Where abouts?</span>
                  <select
                    className="rounded-md bg-white focus:border-emerald-500 py-2 focus:outline-none text-zinc-700 text-sm"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <option value="hcmc">Ho Chi Minh City</option>
                    <option value="sf">San Francisco</option>
                  </select>
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                  <p className="text-md font-medium text-zinc-700 mb-1">What type?</p>
                  <div className="flex items-center gap-4 flex-row ring-emerald-600 py-2">
                    {rootOptions.map((option) => (
                      <div key={option} className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="root"
                          id={option}
                          value={option}
                          checked={root === option}
                          onChange={(e) => setRoot(e.target.value)}
                          className="focus:ring-emerald-500 accent-emerald-600"
                        />
                        <label htmlFor={option} className="text-zinc-700 text-sm cursor-pointer">{option}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {root && (
              <Link
                className="ml-4 cursor-pointer px-5 py-2 text-black"
                href="/add"
              >
                Share a gem
                <div className="text-xs text-zinc-400">it's fast I promise</div>
              </Link>
            )}
          </div>
          {root && routeData && (
            <div className="flex w-full flex-col gap-4 justify-center">
              {Array.isArray(routeData) && routeData.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-x-6 gap-y-8 mt-2 max-w-6xl mx-auto justify-center">
                  {routeData.map((place: any) => {
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
