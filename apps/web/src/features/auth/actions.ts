"use server"

import { cookies } from "next/headers"

export const setLocalToken = async (token: string) => {
  const cookieStore = await cookies()
  cookieStore.set("local_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export const getLocalToken = async (): Promise<string | null> => {
  const cookieStore = await cookies()
  return cookieStore.get("local_token")?.value ?? null
}

export const removeLocalToken = async () => {
  const cookieStore = await cookies()
  cookieStore.delete("local_token")
}
