import { Auth0Client } from "@auth0/nextjs-auth0/server"

export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: "openid profile email",
    connection: "google-oauth2",
  },
  session: {
    rolling: false,
    absoluteDuration: 60 * 60 * 24 * 7, // 7 days
  },
})
