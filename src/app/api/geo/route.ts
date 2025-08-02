import { geolocation } from "@vercel/functions";

export async function GET(request: Request) {
  const { city } = geolocation(request);

  console.log("Geolocation data:", { city });

  // Map city names to our internal codes
  let cityCode = "sf"; // default

  if (city) {
    const cityLower = city.toLowerCase();
    if (
      cityLower.includes("ho chi minh") ||
      cityLower.includes("hcmc") ||
      cityLower.includes("saigon")
    ) {
      cityCode = "hcmc";
    } else if (
      cityLower.includes("san francisco") ||
      cityLower.includes("sf")
    ) {
      cityCode = "sf";
    }
  }

  console.log("Mapped city code:", cityCode);
  return Response.json({ city: cityCode });
}
