import { getListWithUser } from "../actions";
import ListDetailClient from "./ListDetailClient";
import supabase from "@/supabaseClient";

export default async function ListDetailsPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const list = await getListWithUser(id);
    if (!list) return <div className="p-8 text-center">List not found.</div>;

    // Fetch places in this list
    const { data: listPlaces, error } = await supabase
        .from("list_places")
        .select("place:place_id(*)")
        .eq("list_id", id);
    const places = (listPlaces || []).map((lp: any) => lp.place);

    return <ListDetailClient initialList={list} places={places} />;
}