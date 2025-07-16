import { geolocation } from "@vercel/functions";

// export async function GET(request: Request) {
//   const { city } = geolocation(request);

//   console.log(city, "ewoifj");

//   const shown = city == "ho chi minh city" ? "hcmc" : "sf";

//   return Response.json({ city: shown });
// }
export async function GET(request: Request) {
  const data = geolocation(request);

  console.log(data, "ewoifj");

  const shown = data.country == "VN" ? "hcmc" : "sf";
  console.log(shown);

  return Response.json({ city: shown });
}
