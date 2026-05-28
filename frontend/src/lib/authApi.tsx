import axios from "axios";
import { getSession } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

authApi.interceptors.request.use(async (config) => {
  const isServer = typeof window === "undefined";
  const session = isServer
    ? await getServerSession(authOptions)
    : await getSession();

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});