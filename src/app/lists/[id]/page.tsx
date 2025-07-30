import { getListWithUser } from "../actions";
import ListDetailClient from "./ListDetailClient";
import supabase from "@/supabaseClient";
import { Place } from "../types";

type Params = Promise<{ id: string }>;

export default async function ListDetailsPage({ params }: { params: Params }) {
    const { id } = await params;
    const list = await getListWithUser(id);
    if (!list) return <div className="p-8 text-center">List not found.</div>;

    const { data: listPlaces } = await supabase
        .from("list_places")
        .select("place:place_id(*)")
        .eq("list_id", id);

    const places = (listPlaces || [])
        .map((lp) => lp.place)
        .filter(Boolean) as unknown as Place[];

    return <ListDetailClient initialList={list} places={places} />;
}