import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

declare module "next-auth" {
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = credentials.email as string;
        if (!email.endsWith("@colorado.edu")) {
          return null;
        }

        const role = (credentials.role as "student" | "recruiter") || "student";

        if (role === "recruiter") {
          let recruiter = await prisma.recruiter.findUnique({
            where: { email },
          });
          if (!recruiter) {
            recruiter = await prisma.recruiter.create({
              data: { email, name: email.split("@")[0] },
            });
          }
          return {
            id: recruiter.id,
            email: recruiter.email,
            name: recruiter.name,
            role: "recruiter",
          };
        }

        // student (default)
        let student = await prisma.student.findUnique({
          where: { email },
        });
        if (!student) {
          student = await prisma.student.create({
            data: { email, name: email.split("@")[0] },
          });
        }
        return {
          id: student.id,
          email: student.email,
          name: student.name,
          role: "student",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
