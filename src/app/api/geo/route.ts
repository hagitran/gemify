import { geolocation } from "@vercel/functions";

export async function GET(request: Request) {
  const { city } = geolocation(request);

  const shown = city == "ho chi minh city" ? "hcmc" : "sf";

  return Response.json({ city: shown });
}
