import { geolocation } from "@vercel/functions";

// export async function GET(request: Request) {
//   const { city } = geolocation(request);

//   console.log(city, "ewoifj");

//   const shown = city == "ho chi minh city" ? "hcmc" : "sf";

//   return Response.json({ city: shown });
// }
export async function GET(request: Request) {
  const data = geolocation(request);
  console.log(request, "geo request");

  return Response.json({ city: data });
}
