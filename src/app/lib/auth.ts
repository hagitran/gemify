import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db, user, session, account, verification } from "../../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  redirects: {
    signIn: "/",
    signUp: "/",
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // For now, we'll just log the OTP to console
        // In production, you would send this via email service
        console.log(`Sending OTP ${otp} to ${email} for ${type}`);

        // Example email service integration:
        // await sendEmail({
        //   to: email,
        //   subject: `Your verification code: ${otp}`,
        //   body: `Your verification code is: ${otp}`
        // });
      },
    }),
  ],
});
