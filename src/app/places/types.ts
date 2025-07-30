// Types for Places functionality

// === Core Place Types ===
export interface Place {
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
  osmId?: string;
  notes: string;
  added_by: string;
  description: string;
  ambiance: string[];
  user: { name: string };
  match_score?: number;
  created_at?: string;
  view_count?: number;
  last_viewed_at?: string;
}

// === Review/Note Types ===
export interface RawNote {
  id: number;
  note: string;
  user_id: string;
  image_path: string;
  user: { name: string } | { name: string }[];
  tried: boolean;
  recommended_item: string;
  price: number;
  ambiance: string;
  place_id: number;
  created_at: string;
}

export interface Note {
  id: number;
  note: string;
  user_id: string;
  image_path: string;
  user?: { name: string };
  tried?: boolean;
  recommended_item?: string;
  price: number;
  ambiance?: string;
  liked?: boolean;
  place_id?: number;
  created_at?: string;
}

// === Form and UI Types ===
export interface Option {
  value: string | number;
  label: string;
}

export interface PlaceFormData {
  id: number;
  name: string;
  price: number;
  ambiance: string[];
}

// === Component Props Types ===
export interface PlacePersonalizationBannerProps {
  place: {
    name: string;
    city?: string;
    type?: string;
    price?: number;
    ambiance?: string[];
  };
}

export interface NotesSectionProps {
  notes: Note[];
  handleAddNote: (formData: FormData) => void;
  handleDeleteNote: (noteId: number) => void;
  place: {
    id: number;
    name: string;
    price: number;
    ambiance: string[];
    address?: string;
    display_name?: string;
  };
}

export interface DeletePlaceButtonProps {
  placeId: number;
  addedBy: string;
}

export interface ViewInteractionLoggerProps {
  placeId: number;
}

// === Action Types ===
export interface AddReviewParams {
  place_id: number;
  user_id: string;
  note: string;
  image_path?: string;
  tried?: boolean;
  recommended_item?: string | null;
  price?: number | null;
  ambiance?: string | null;
}

export interface AddUserReviewParams {
  user_id: string;
  place_id: number;
}

export interface AddPlaceToListParams {
  list_id: number;
  place_id: number;
}

// === Utility Types ===
export type Params = Promise<{ id: string }>;

export interface MatchBadge {
  label: string;
  color: string;
}

// === User Preference Types ===
export interface UserPreferences {
  cozy: number;
  lively: number;
  workFriendly: number;
  trendy: number;
  traditional: number;
  romantic: number;
  price: number;
}

export interface PlaceInteraction {
  action: "view" | "share" | "try";
  count: number;
  price: number;
  ambiance: string[];
}
