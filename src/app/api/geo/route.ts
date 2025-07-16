import { geolocation } from "@vercel/functions";

export async function GET(request: Request) {
  const data = geolocation(request);
  console.log(data, "data");
  //   console.log(city, "sio");
  return Response.json({ city: data.city?.toLowerCase() || "hcmc" });
}
