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
    const [root, setRoot] = useState("All");

    // On mount, set city from cookie if exists, else from geolocation
    useEffect(() => {
        const cookieCity = getCookie('preferredCity');
        if (cookieCity) {
            setCityState(cookieCity);
        } else {
            fetch('/api/geo')
                .then(res => res.json())
                .then(data => {
                    if (data.city) {
                        setCityState(data.city);
                        setCookie('preferredCity', data.city);
                    }
                });
        }
    }, []);

    // When user changes city, update cookie as well
    const setCity = (newCity: string) => {
        setCityState(newCity);
        setCookie('preferredCity', newCity);
    };

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