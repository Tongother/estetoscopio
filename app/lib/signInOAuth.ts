import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signInWithGoogle = async () => {
  "use server";
  const res = await auth.api.signInSocial({
    body: {
      provider: "google",
      // Dirección a la que se redirige tras el login
      callbackURL: "/",
    },
    headers: await headers(),
  });

  if (res?.url) redirect(res.url);
};