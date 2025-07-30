export interface List {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  verified: boolean | null;
  createdBy: string | null;
  karma: number;
  place_count: number;
}

export interface Place {
  id: number;
  name: string | null;
  type: string | null;
  created_at: string;
  specificType: string | null;
  osmId: string | null;
  displayName: string | null;
  karma: number | null;
  lat: number | null;
  long: number | null;
  city: string | null;
  image_path: string | null;
  price: number | null;
  addedBy: string | null;
  ambiance: string[] | null;
  verified: boolean | null;
  viewCount: number | null;
}
