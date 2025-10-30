import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers"
import { db } from "@/db";
 
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	secret: process.env.BETTER_AUTH_SECRET!,
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	emailAndPassword: {    
		enabled: true,
		autoSignIn: true,
		requireEmailVerification: false,
	},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["credential"],
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	plugins: [bearer()],
	trustedOrigins: [
		"http://localhost:3000",
		process.env.BETTER_AUTH_URL || "",
	].filter(Boolean),
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: false,
				defaultValue: "admin",
				input: false,
			},
			brokerId: {
				type: "number",
				required: false,
				input: false,
			},
		},
	},
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}