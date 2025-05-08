import NextAuth, { AuthOptions, Session, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb-adapter';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/firebase';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

// Extended types for NextAuth
interface ExtendedUser extends Omit<NextAuthUser, 'id'> {
  id?: string;
}

interface ExtendedSession extends Omit<Session, 'user'> {
  user?: ExtendedUser;
  accessToken?: string;
}

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        idToken: { label: "ID Token", type: "text" },
        provider: { label: "Provider", type: "text" }
      },
      async authorize(credentials) {
        // Handle Firebase Google authentication
        if (credentials?.idToken && credentials?.provider === 'google') {
          try {
            // Create credential from the token
            const googleCredential = GoogleAuthProvider.credential(credentials.idToken);
            
            // Sign in to Firebase with credential
            const userCredential = await signInWithCredential(auth, googleCredential);
            const firebaseUser = userCredential.user;
            
            // Connect to MongoDB
            await connectDB();
            
            // Check if user exists in our DB
            let user = await User.findOne({ email: firebaseUser.email });
            
            // If not, create a new user
            if (!user) {
              user = await User.create({
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email,
                password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
                image: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'User')}&background=random`,
              });
            }
            
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              image: user.image || firebaseUser.photoURL,
            };
          } catch (error) {
            console.error("Firebase auth error:", error);
            throw new Error('Authentication failed');
          }
        }
        
        // Regular credentials authentication
        if (credentials?.email && credentials?.password) {
          await connectDB();

          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            throw new Error('No user found with this email');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }
        
        throw new Error('Invalid credentials');
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async session({ session, token }: { session: ExtendedSession; token: any }) {
      if (token && session.user) {
        session.user.id = token.sub;
        
        // Save access token to session if it exists
        if (token.accessToken) {
          session.accessToken = token.accessToken;
        }
      }
      return session;
    },
    async jwt({ token, account }: { token: any; account: any }) {
      // Keep access token when user logs in
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async signIn({ account, profile }: { account: any; profile?: any }) {
      // If we have an access token, save it to sessionStorage (client-side)
      if (typeof window !== 'undefined' && account?.access_token) {
        sessionStorage.setItem('accessToken', account.access_token);
        console.log("✅ Saved NextAuth Google Access Token to sessionStorage");
      }
      return true;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };