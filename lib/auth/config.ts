import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";

declare module "next-auth" {
  interface User {
    businessId: number;
    role: "admin" | "worker";
    fullName: string;
  }
  interface Session {
    user: {
      id: string;
      businessId: number;
      role: "admin" | "worker";
      fullName: string;
      email?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    businessId: number;
    role: "admin" | "worker";
    fullName: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const [profile] = await db
          .select()
          .from(profiles)
          .where(and(eq(profiles.email, email), eq(profiles.role, "admin")))
          .limit(1);

        if (!profile || !profile.passwordHash) return null;

        const isValid = await bcrypt.compare(password, profile.passwordHash);
        if (!isValid) return null;

        return {
          id: profile.id.toString(),
          email: profile.email,
          businessId: profile.businessId,
          role: profile.role as "admin",
          fullName: profile.fullName,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours for admin
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.businessId = (user as { businessId: number }).businessId;
        token.role = (user as { role: "admin" | "worker" }).role;
        token.fullName = (user as { fullName: string }).fullName;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.businessId = token.businessId;
      session.user.role = token.role;
      session.user.fullName = token.fullName;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
