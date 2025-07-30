export type UserPreferences = {
  cozy: number;
  lively: number;
  work_friendly: number;
  trendy: number;
  traditional: number;
  romantic: number;
  price: number;
};

const ACTION_WEIGHTS: Record<PlaceInteraction["action"], number> = {
  view: 1,
  share: 3,
  try: 5,
};

type PlaceInteraction = {
  action: "view" | "share" | "try";
  count: number;
  price: number;
  ambiance: string[];
};

export default function computeUserPreferenceVector(
  interactions: PlaceInteraction[]
): UserPreferences {
  const preferences: UserPreferences = {
    cozy: 0,
    lively: 0,
    work_friendly: 0,
    trendy: 0,
    traditional: 0,
    romantic: 0,
    price: 0,
  };

  let totalWeight = 0;

  for (const interaction of interactions) {
    const weight =
      (ACTION_WEIGHTS[interaction.action] ?? 0) * interaction.count;
    totalWeight += weight;

    // Update price preference based on interaction
    preferences.price += interaction.price * weight;

    // Update ambiance preferences based on place ambiance
    for (const amb of interaction.ambiance ?? []) {
      const ambianceKey = amb
        .toLowerCase()
        .replace("-", "") as keyof UserPreferences;
      if (ambianceKey in preferences) {
        preferences[ambianceKey] += weight;
      }
    }
  }

  // Normalize preferences
  if (totalWeight > 0) {
    preferences.price = preferences.price / totalWeight;

    // Normalize ambiance preferences (count how many times each was encountered)
    const ambianceCounts: Record<string, number> = {};
    for (const interaction of interactions) {
      for (const amb of interaction.ambiance ?? []) {
        const key = amb.toLowerCase().replace("-", "");
        ambianceCounts[key] = (ambianceCounts[key] || 0) + interaction.count;
      }
    }

    // Set preference based on frequency of encounters
    for (const [key, count] of Object.entries(ambianceCounts)) {
      if (key in preferences) {
        preferences[key as keyof UserPreferences] = Math.min(
          1,
          count / totalWeight
        );
      }
    }
  } else {
    // Default values if no interactions
    preferences.price = 0.5;
    for (const key in preferences) {
      if (key !== "price") {
        preferences[key as keyof UserPreferences] = 0.5;
      }
    }
  }

  // Ensure all values are between 0 and 1
  for (const key in preferences) {
    const k = key as keyof UserPreferences;
    preferences[k] = Math.max(0, Math.min(1, preferences[k]));
  }

  return preferences;
}
