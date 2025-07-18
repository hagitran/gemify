"use client";
import { useRef, useState, useEffect } from "react";

interface MultiSelectDropdownProps {
    options: { value: string | number; label: string }[];
    selected: (string | number)[];
    onChange: (selected: (string | number)[]) => void;
    placeholder?: string;
    buttonClassName?: string;
    dropdownClassName?: string;
    disabled?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmDisabled?: boolean;
    variant?: "simple" | "detailed";
}

export default function MultiSelectDropdown({
    options,
    selected,
    onChange,
    placeholder = "Select...",
    buttonClassName = "",
    dropdownClassName = "",
    disabled = false,
    onConfirm,
    onCancel,
    confirmLabel = "Add",
    cancelLabel = "Cancel",
    confirmDisabled = false,
    variant = "simple",
}: MultiSelectDropdownProps) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
                if (onCancel) onCancel();
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, onCancel]);

    const toggleOption = (value: string | number) => {
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const selectedLabels = options.filter(o => selected.includes(o.value)).map(o => o.label);

    return (
        <div className={`relative py-2 ${dropdownClassName}`} ref={dropdownRef}>
            <button
                type="button"
                className={`p-2 w-full border border-zinc-300 rounded-lg focus:outline-none cursor-pointer text-md bg-white flex justify-between items-center ${buttonClassName}`}
                onClick={() => setOpen(o => !o)}
                disabled={disabled}
            >
                {selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder}
                <svg className={`w-4 h-4 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {open && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-zinc-100 rounded max-h-60 overflow-y-auto">
                    {options.map(option => (
                        <label key={option.value} className="flex items-center px-4 py-2 cursor-pointer hover:bg-zinc-50">
                            <input
                                type="checkbox"
                                checked={selected.includes(option.value)}
                                onChange={() => toggleOption(option.value)}
                                className="mr-4 accent-emerald-600"
                            />
                            {option.label}
                        </label>
                    ))}
                    {variant === "detailed" && (
                        <div className="flex justify-end px-2 pt-2">
                            <div className="flex gap-6 p-2">
                                <button
                                    className="flex text-zinc-700 py-1 rounded transition-colors font-medium cursor-pointer hover:text-emerald-900"
                                    onClick={() => { setOpen(false); if (onCancel) onCancel(); }}
                                    type="button"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    className="flex text-emerald-600 py-1 rounded transition-colors font-medium cursor-pointer hover:text-emerald-900"
                                    onClick={() => { if (onConfirm) onConfirm(); setOpen(false); }}
                                    disabled={confirmDisabled}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 