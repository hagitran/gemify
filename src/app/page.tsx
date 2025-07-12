"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { getRouteData } from "./actions";
import PlaceAdder from "./components/PlaceAdder"
import PlaceCard from "./components/PlaceCard";

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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] text-zinc-700">
      <main className="flex flex-col gap-12 row-start-2 items-center sm:items-start">
        <div className="flex flex-col gap-2 ">
          <div className="flex flex-row items-end gap-4">
            <h1 className="text-4xl font-bold">Gemify</h1>
            <h2 className="text-2xl font-medium">discover hidden <strong className="text-emerald-600">gems</strong></h2>
          </div>
          <p>
            *for quality control only select cities are available right now
          </p>
        </div>


        <div>
          <div className="flex flex-row items-stretch gap-6 w-full py-2 rounded-md p-2 bg-white/50">
            <div className="flex-1 flex flex-col min-h-0">
              <span className=" text-lg">Where abouts?</span>
              <select
                className="rounded-md bg-white  focus:border-emerald-500 focus:outline-none py-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="hcmc">Ho Chi Minh City</option>
                <option value="sf">San Francisco</option>
              </select>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <p className=" text-lg">What type?</p>
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
                      className=" focus:ring-emerald-500"
                    />
                    <label htmlFor={option} className="">{option}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {root && routeData && (
            <div className="flex w-full gap-4">
              <div className="flex w-full flex-col gap-4">
                <div className="mt-4">
                  <h3 className="text-lg mb-2 ">recommended <strong>leaves</strong></h3>

                  {Array.isArray(routeData) && routeData.length > 0 && (
                    <div className="flex flex-col flex-wrap mt-2 gap-2">
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
                        return <PlaceCard key={place.id} data={place} distance={distance} />;
                      })}
                    </div>
                  )}
                </div>

                <PlaceAdder city={city} />
              </div>
            </div>
          )}
        </div>

      </main>
      <footer className="row-start-3 flex gap-[12px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://hagitran.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          By Hagi
        </a>
      </footer>
    </div>
  );
}
