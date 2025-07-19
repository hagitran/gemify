"use client";

interface QuerySelectorProps {
    city: string;
    root: string;
    onCityChange: (city: string) => void;
    onRootChange: (root: string) => void;
}

export function QuerySelector({ city, root, onCityChange, onRootChange }: QuerySelectorProps) {
    const rootOptions = ["Food", "Cafe", "Experience", "All"];

    const handleCityChange = (newCity: string) => {
        onCityChange(newCity);
    };

    const handleRootChange = (newRoot: string) => {
        onRootChange(newRoot);
    };

    return (
        <div className="flex flex-col rounded-xl shadow bg-white/80 px-4 py-2 items-center border border-zinc-200 w-full max-w-full">
            <div className="flex flex-row items-stretch gap-6 w-full rounded-md flex-wrap sm:flex-nowrap">
                <div className="flex-1 flex flex-col min-h-0 max-w-full min-w-[220px] w-64">
                    <span className="text-md font-medium text-zinc-700 mb-1 group relative">
                        Where abouts?
                        <span className="text-xs text-zinc-500 invisible group-hover:visible absolute left-0 top-full mt-1 bg-white border border-zinc-200 rounded px-2 py-1 shadow">
                            *Limited for quality control
                        </span>
                    </span>
                    <select
                        className="rounded-md bg-white focus:border-emerald-500 py-2 focus:outline-none text-zinc-700 text-sm min-w-[180px] w-56"
                        value={city}
                        onChange={(e) => handleCityChange(e.target.value)}
                    >
                        <option value="hcmc">Ho Chi Minh City</option>
                        <option value="sf">San Francisco</option>
                    </select>
                </div>
                <div className="flex-1 flex flex-col min-h-0 w-full max-w-full">
                    <p className="text-md font-medium text-zinc-700 mb-1">What type?</p>
                    <div className="flex items-center gap-4 flex-row ring-emerald-600 py-2 flex-wrap">
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