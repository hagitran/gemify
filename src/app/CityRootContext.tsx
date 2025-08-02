"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type CityRootContextType = {
    city: string;
    setCity: (city: string) => void;
    root: string;
    setRoot: (root: string) => void;
};

const CityRootContext = createContext<CityRootContextType | undefined>(undefined);

// Cookie helpers
function setCookie(name: string, value: string, days = 365) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}
function getCookie(name: string) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

export const CityRootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [city, setCityState] = useState("sf");
    const [root, setRootState] = useState("All");

    const validCities = ["sf", "hcmc"];

    const setCity = (newCity: string) => {
        const cityStr = String(newCity ?? "").toLowerCase();
        if (validCities.includes(cityStr)) {
            setCityState(cityStr);
            setCookie("preferredCity", cityStr);
        } else {
            setCityState("sf");
            setCookie("preferredCity", "sf");
        }
    };

    const validRoots = ["Food", "Cafe", "Experience", "All"];
    const setRoot = (newRoot: string) => {
        if (validRoots.includes(newRoot)) {
            setRootState(newRoot);
        } else {
            setRootState("All");
        }
    };

    useEffect(() => {
        const cookieCity = getCookie('preferredCity');
        if (typeof cookieCity === 'string' && validCities.includes(cookieCity.toLowerCase())) {
            setCityState(cookieCity.toLowerCase());
        } else {
            fetch('/api/geo')
                .then(res => res.json())
                .then(data => {
                    console.log("Geo API response:", data);
                    let cityValue = data.city;

                    // Handle different response formats
                    if (typeof cityValue === 'object' && cityValue !== null) {
                        cityValue = cityValue.code || cityValue.city || "sf";
                    }

                    cityValue = String(cityValue || "sf").toLowerCase();
                    console.log("Processed city value:", cityValue);

                    if (validCities.includes(cityValue)) {
                        setCityState(cityValue);
                        setCookie('preferredCity', cityValue);
                    } else {
                        setCityState("sf");
                        setCookie('preferredCity', "sf");
                    }
                })
                .catch(() => {
                    setCityState("sf");
                    setCookie('preferredCity', "sf");
                });
        }
    }, [validCities]);

    return (
        <CityRootContext.Provider value={{ city, setCity, root, setRoot }}>
            {children}
        </CityRootContext.Provider>
    );
};

export function useCityRoot() {
    const context = useContext(CityRootContext);
    if (!context) throw new Error("useCityRoot must be used within a CityRootProvider");
    return context;
} 