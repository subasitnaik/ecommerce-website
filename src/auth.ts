import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

/** Required by Auth.js for signing JWTs. Set `AUTH_SECRET` in `.env` (e.g. `openssl rand -base64 32`). */
const authSecret =
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "local-dev-only-not-for-production-set-auth-secret-in-env-32chars"
    : undefined);

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: authSecret,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        try {
          const { prisma } = await import("@/lib/prisma");
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;
          return { id: user.id, email: user.email, name: user.name };
        } catch {
          /* No DATABASE_URL or DB down — allow ADMIN_EMAIL + ADMIN_PASSWORD from .env only */
          const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
          const adminPass = process.env.ADMIN_PASSWORD;
          if (
            adminEmail &&
            adminPass &&
            email === adminEmail &&
            password === adminPass
          ) {
            return { id: "local-dev-admin", email, name: "Admin" };
          }
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/admin/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
