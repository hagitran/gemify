import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "http://gemify-ore.vercel.app",
  plugins: [emailOTPClient()],
});
