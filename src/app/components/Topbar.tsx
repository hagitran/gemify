"use client"

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Topbar() {

    return (
        <div className="flex justify-center items-center h-24 z-50 px-4 sticky absolute top-0 left-0 w-full h-16 bg-white border-b border-zinc-300">
            <div className="flex w-4/5 justify-between">
                <Link href="/" className="flex cursor-pointer text-3xl tracking-tight text-black font-semibold py-1">
                    <strong className="text-emerald-600">Gem</strong>ify
                </Link>

                <Link href="/add"
                    className="flex items-center px-4 py-1 text-lg font-medium cursor-pointer hover:underline hover:underline-offset-4">
                    Login
                </Link>
            </div>
        </div>
    );
}