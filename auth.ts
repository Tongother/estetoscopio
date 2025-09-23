import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/config";

import {
  user as usersTable,
  account as accountsTable,
  session as sessionsTable,
  verification as verificationTokensTable,
} from "@/db/schema";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.APP_URL!,

  basePath: "/api/auth",
  
  database: drizzleAdapter(db, {
      provider: "pg", 
      schema: {
        users: usersTable,
        accounts: accountsTable,
        sessions: sessionsTable,
        verifications: verificationTokensTable,
      },
      usePlural: true,
  }),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }
  },

  plugins: [nextCookies()]
});