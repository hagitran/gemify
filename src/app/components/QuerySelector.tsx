"use client";

import { useState, useEffect } from "react";

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

interface QuerySelectorProps {
    onCityChange: (city: string) => void;
    onRootChange: (root: string) => void;
}

export function QuerySelector({ onCityChange, onRootChange }: QuerySelectorProps) {
    const [city, setCity] = useState("hcmc");
    const [root, setRoot] = useState("All");
    const rootOptions = ["Food", "Cafe", "Experience", "All"];

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

    const handleCityChange = (newCity: string) => {
        setCity(newCity);
        savePrefs(newCity, root);
        onCityChange(newCity);
    };

    const handleRootChange = (newRoot: string) => {
        setRoot(newRoot);
        savePrefs(city, newRoot);
        onRootChange(newRoot);
    };

    return (
        <div className="flex flex-col rounded-xl shadow bg-white/80 px-4 py-2 items-center border border-zinc-200">
            <div className="flex flex-row items-stretch gap-6 w-full rounded-md">
                <div className="flex-1 flex flex-col min-h-0">
                    <span className="text-md font-medium text-zinc-700 mb-1">Where abouts?</span>
                    <select
                        className="rounded-md bg-white focus:border-emerald-500 py-2 focus:outline-none text-zinc-700 text-sm"
                        value={city}
                        onChange={(e) => handleCityChange(e.target.value)}
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
                                    onChange={(e) => handleRootChange(e.target.value)}
                                    className="focus:ring-emerald-500 accent-emerald-600"
                                />
                                <label htmlFor={option} className="text-zinc-700 text-sm cursor-pointer">{option}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 