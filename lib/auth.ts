import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID?.length) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET?.length);

/** Email that always has admin rights regardless of DB role (bootstrap). */
function isBootstrapAdmin(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  return Boolean(adminEmail && email && email === adminEmail);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: googleConfigured
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ]
    : [],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    // Upsert the User record on every sign-in
    async signIn({ user, account }) {
      try {
        await connectDB();
        const bootstrap = isBootstrapAdmin(user.email);
        await User.findOneAndUpdate(
          { email: user.email?.toLowerCase() },
          {
            $set: {
              name: user.name ?? undefined,
              image: user.image ?? undefined,
              googleId: account?.providerAccountId ?? undefined,
              isActive: true,
            },
            // Only set role on first insert — don't downgrade an existing admin
            $setOnInsert: {
              role: bootstrap ? "admin" : "user",
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        // Ensure bootstrap admin always has the admin role in DB
        if (bootstrap) {
          await User.updateOne(
            { email: user.email?.toLowerCase() },
            { $set: { role: "admin" } }
          );
        }
      } catch (err) {
        console.error("[auth] signIn upsert error", err);
        // Don't block sign-in on DB failure
      }
      return true;
    },

    // Embed role in the JWT on every validation so that:
    // - ADMIN_EMAIL changes take effect without requiring sign-out
    // - Promotions made in the admin panel apply on the next page load
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in: persist user id
        token.id = user.id;
      }

      // Re-read role from DB on every JWT check so promotions/demotions
      // are picked up without forcing users to sign out.
      // token.email is always present (set by NextAuth from the Google profile).
      const email = (token.email as string | undefined)?.toLowerCase();
      if (email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email })
            .select("role isActive")
            .lean();
          token.role = dbUser?.role ?? "user";
          token.isActive = dbUser?.isActive ?? true;
        } catch {
          // DB unavailable — fall back without crashing
        }
      }

      // Bootstrap override: ADMIN_EMAIL always wins regardless of DB state
      if (isBootstrapAdmin(email)) {
        token.role = "admin";
      }

      return token as JWT & { role: string; isActive: boolean };
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token as JWT & { id?: string }).id ?? token.sub ?? "";
        session.user.role = (token as JWT & { role?: string }).role ?? "user";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
};

export function isGoogleAuthConfigured(): boolean {
  return googleConfigured;
}
