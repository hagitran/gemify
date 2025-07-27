import { getListWithUser } from "../actions";
import ListDetailClient from "./ListDetailClient";
import supabase from "@/supabaseClient";

interface ListPlaceData {
    place: {
        id: number;
        name: string;
        city: string;
        type: string;
        address: string;
        image_path: string;
        price: number;
        lat?: number;
        long?: number;
        display_name?: string;
        osm_id?: string;
        notes: string;
        added_by: string;
        description: string;
        ambiance?: string;
        created_at?: string;
        view_count?: number;
    }[];
}

interface ListPlace {
    id: number;
    name: string;
    city: string;
    type: string;
    address: string;
    image_path: string;
    price: number;
    lat?: number;
    long?: number;
    display_name?: string;
    osm_id?: string;
    notes: string;
    added_by: string;
    description: string;
    ambiance?: string;
    created_at?: string;
    view_count?: number;
}

interface List {
    id: number;
    name: string;
    description: string | null;
    user: { name: string } | { name: string }[];
    created_at: string;
}

type Params = Promise<{ id: string }>;
export default async function ListDetailsPage({ params }: { params: Params }) {
    const { id } = await params;
    const list = await getListWithUser(id);
    if (!list) return <div className="p-8 text-center">List not found.</div>;

    // Fetch places in this list
    const { data: listPlaces } = await supabase
        .from("list_places")
        .select("place:place_id(*)")
        .eq("list_id", id);
    const places = (listPlaces || []).map((lp: ListPlaceData) => lp.place[0]) as ListPlace[];

    return <ListDetailClient initialList={list as List} places={places} />;
}