import axios from "axios";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { requireApiBaseUrl } from "@/lib/api-base-url";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const apiBaseUrl = requireApiBaseUrl();

          const loginResponse = await axios.post(
            `${apiBaseUrl}/api/v1/auth/login`,
            credentials
          );
          const token = loginResponse.data.token;

          if (!token) {
            console.log("Token manquant dans la réponse de /auth/login");
            return null;
          }

          const userResponse = await axios.get(
            `${apiBaseUrl}/api/v1/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const user = userResponse.data;

          if (!user || !user.id || !user.email) {
            console.log("Données utilisateur incomplètes dans /users/me");
            return null;
          }

          return {
            id: Number(user.id),
            email: user.email,
            accessToken: token,
            refreshToken: "", // à gérer ça plus tard hsl
          } as any;
        } catch (error) {
          console.error("Erreur lors de l'autorisation :", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = Number(user.id);
        token.email = user.email;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as number,
        email: token.email as string,
        accessToken: token.accessToken as string,
        refreshToken: token.refreshToken as string,
      };
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};
