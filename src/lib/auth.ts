import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('No user found');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          managerId: user.managerId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'azure-ad') {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });
          
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.department = dbUser.department;
            token.managerId = dbUser.managerId;
          } else {
            token.id = user.id;
            token.role = 'EMPLOYEE';
            token.department = 'General';
          }
        } else {
          token.id = user.id;
          token.role = (user as any).role;
          token.department = (user as any).department;
          token.managerId = (user as any).managerId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).department = token.department;
        (session.user as any).managerId = token.managerId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'atomberg-performance-secret-key-2026',
};
