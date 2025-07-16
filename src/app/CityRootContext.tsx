"use client";
import React, { createContext, useContext, useState } from "react";

type CityRootContextType = {
    city: string;
    setCity: (city: string) => void;
    root: string;
    setRoot: (root: string) => void;
};

const CityRootContext = createContext<CityRootContextType | undefined>(undefined);

export const CityRootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [city, setCity] = useState("sf");
    const [root, setRoot] = useState("All");

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