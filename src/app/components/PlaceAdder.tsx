"use client";
import { useState } from "react";
import { addPlace } from "../actions";

export default function PlaceAdder({ city }: { city: string }) {
  const [name, setName] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    const res = await addPlace(city, encodeURIComponent(name));
    if (res && !Array.isArray(res) && res.error) {
      setError(typeof res.error === 'string' ? res.error : res.error.message);
      setResult(null);
    } else {
      setResult(res);
      setError(null);
      setName("");
    }
  }

  return (
    <form onSubmit={handleAdd} className="flex gap-2 items-center">
      <input
        className="border rounded px-2 py-1"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Place name"
      />
      <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
        Add
      </button>
      {result && <span className="ml-2 text-green-600">Added!</span>}
      {error && <span className="ml-2 text-red-600">{error}</span>}
    </form>
  );
}