import NextAuth from 'next-auth'
import LineProvider from 'next-auth/providers/line'

const handler = NextAuth({
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.userId = profile?.sub
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.userId = token.userId
      return session
    },
  },
})

export { handler as GET, handler as POST } 