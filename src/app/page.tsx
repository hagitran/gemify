"use client";

import { useState, useEffect } from "react";
import { getRouteData } from "./actions";
import PlaceCard from "./components/PlaceCard";
import Link from "next/link";
import { authClient } from "./lib/auth-client";

// Cookie utilities
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

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

export default function Home() {
  const [city, setCity] = useState("hcmc");
  const [root, setRoot] = useState("All");
  const [routeData, setRouteData] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; long: number } | null>(null);



  const rootOptions = ["Scenic", "Foodie", "Experiences", "All"];

  // Load user preferences from cookies
  useEffect(() => {
    const savedCity = getCookie('preferredCity');
    const savedRoot = getCookie('preferredRoot');

    if (savedCity) setCity(savedCity);
    if (savedRoot) setRoot(savedRoot);
  }, []);

  const savePrefs = (newCity?: string, newRoot?: string) => {
    const cityToSave = newCity || city;
    const rootToSave = newRoot || root;

    setCookie('preferredCity', cityToSave);
    setCookie('preferredRoot', rootToSave);

    console.log('Saving to cookies:', { preferredCity: cityToSave, preferredRoot: rootToSave });
  };

  // Listen for cookie changes from QuerySelector
  useEffect(() => {
    const checkCookies = () => {
      const savedCity = getCookie('preferredCity');
      const savedRoot = getCookie('preferredRoot');

      if (savedCity && savedCity !== city) setCity(savedCity);
      if (savedRoot && savedRoot !== root) setRoot(savedRoot);
    };

    // Check cookies periodically
    const interval = setInterval(checkCookies, 1000);
    return () => clearInterval(interval);
  }, [city, root]);

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
      <main className="flex flex-col flex-1 gap-8 items-center pt-8">

        <div className="flex justify-center items-center w-full flex-col gap-8">

          <div
            className={`flex justify-center gap-8 ${root ? 'flex-row items-center py-4 !gap-16' : 'flex-col items-center'} transition-all duration-300`}
          >

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
